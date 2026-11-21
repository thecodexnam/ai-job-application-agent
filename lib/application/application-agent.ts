import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { ApplicationMode, ApplicationStatus, JobPlatform, MissingField } from "./types";
import { detectJobPlatform } from "./platform-detector";
import { browserbaseService } from "./browserbase.service";
import { stagehandService } from "./stagehand.service";
import { fetchCandidateData, fetchResumeBuffer } from "./candidate-data";
import { runAutomatedApplication } from "./workflow";
import { validateJobApplicationUrl, isMockAutomationEnabled } from "./validate-url";
import {
  ACTIVE_AUTOMATION_STATUSES,
  APPLICATION_WORKFLOW_STATUS,
  isActiveAutomationStatus,
} from "./status";

export interface StartApplicationParams {
  jobId?: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  applicationMode: ApplicationMode;
  force?: boolean;
}

export interface ApplicationExecutionResult {
  success: boolean;
  applicationId: string;
  applicationStatus: ApplicationStatus;
  platform: JobPlatform;
  missingFields?: MissingField[];
  browserSessionId?: string | null;
  liveDebugUrl?: string | null;
  message?: string;
  confirmationMessage?: string;
  isDuplicate?: boolean;
  isConcurrencyLock?: boolean;
  error?: string;
  requiresReview?: boolean;
  queued?: boolean;
}

const PROFILE_UPDATE_KEYS = [
  "first_name",
  "last_name",
  "full_name",
  "phone",
  "linkedin_url",
  "github_url",
  "portfolio_url",
  "location",
  "work_authorization",
  "requires_sponsorship",
  "salary_expectation",
  "notice_period",
] as const;

export class ApplicationAgent {
  public static fetchCandidateData = fetchCandidateData;
  public static fetchResumeBuffer = fetchResumeBuffer;

  public static async checkActiveLock(
    supabase: any,
    userId: string
  ): Promise<{ hasActive: boolean; activeApp?: any }> {
    const { data: activeApps } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", userId)
      .in("application_status", ACTIVE_AUTOMATION_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeApps && activeApps.length > 0) {
      return { hasActive: true, activeApp: activeApps[0] };
    }
    return { hasActive: false };
  }

  public static async checkDuplicateSubmission(
    supabase: any,
    userId: string,
    jobId?: string,
    jobUrl?: string
  ): Promise<{ isDuplicate: boolean; existingApp?: any }> {
    if (jobId) {
      const { data: byJobId } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", userId)
        .eq("job_id", jobId)
        .or(
          `status.in.(applied,interviewing,offer),application_status.eq.${APPLICATION_WORKFLOW_STATUS.SUBMITTED}`
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (byJobId && byJobId.length > 0) {
        return { isDuplicate: true, existingApp: byJobId[0] };
      }
    }

    if (jobUrl) {
      const { data: byJobUrl } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", userId)
        .eq("job_url", jobUrl)
        .or(
          `status.in.(applied,interviewing,offer),application_status.eq.${APPLICATION_WORKFLOW_STATUS.SUBMITTED}`
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (byJobUrl && byJobUrl.length > 0) {
        return { isDuplicate: true, existingApp: byJobUrl[0] };
      }
    }

    return { isDuplicate: false };
  }

  public static async startApplication(
    userId: string,
    params: StartApplicationParams
  ): Promise<ApplicationExecutionResult> {
    const supabase = await createClient();
    const validated = validateJobApplicationUrl(params.jobUrl);
    if (!validated.ok) {
      throw new Error(validated.error);
    }

    const jobUrl = validated.url;
    const { platform } = detectJobPlatform(jobUrl);

    if (params.applicationMode === "manual") {
      const { data: appRecord, error } = await supabase
        .from("job_applications")
        .insert({
          user_id: userId,
          job_id: params.jobId || null,
          job_title: params.jobTitle,
          company_name: params.company,
          job_url: jobUrl,
          platform,
          application_mode: "manual",
          application_status: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
          status: "applied",
          applied_at: new Date().toISOString(),
          current_step: "submitted",
        } as any)
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (params.jobId) {
        await supabase
          .from("jobs")
          .update({ application_status: "applied" })
          .eq("id", params.jobId)
          .eq("user_id", userId);
      }

      return {
        success: true,
        applicationId: appRecord.id,
        applicationStatus: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
        platform,
        confirmationMessage: "Manual application tracked. The job URL was opened in a new tab.",
        message: "Manual application tracked successfully.",
      };
    }

    if (!params.force) {
      const duplicateCheck = await this.checkDuplicateSubmission(
        supabase,
        userId,
        params.jobId,
        jobUrl
      );
      if (duplicateCheck.isDuplicate) {
        const existing = duplicateCheck.existingApp;
        const appliedDate = existing.applied_at || existing.created_at;
        return {
          success: false,
          isDuplicate: true,
          applicationId: existing.id,
          applicationStatus: (existing.application_status as ApplicationStatus) || APPLICATION_WORKFLOW_STATUS.SUBMITTED,
          platform,
          browserSessionId: existing.browser_session_id || null,
          confirmationMessage: `Previously submitted on ${new Date(appliedDate).toLocaleDateString()}`,
          message: `An application for "${params.jobTitle}" at "${params.company}" was already submitted. Duplicate submissions are prevented.`,
        };
      }
    }

    const lockCheck = await this.checkActiveLock(supabase, userId);
    if (lockCheck.hasActive) {
      return {
        success: false,
        isConcurrencyLock: true,
        applicationId: lockCheck.activeApp.id,
        applicationStatus: lockCheck.activeApp.application_status as ApplicationStatus,
        platform,
        browserSessionId: lockCheck.activeApp.browser_session_id || null,
        message: `Another automated application is currently active for "${lockCheck.activeApp.job_title}". Applications run sequentially one at a time per user.`,
      };
    }

    const { data: appRecord, error: createErr } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        job_id: params.jobId || null,
        job_title: params.jobTitle,
        company_name: params.company,
        job_url: jobUrl,
        platform,
        application_mode: "automated",
        application_status: APPLICATION_WORKFLOW_STATUS.PENDING,
        current_step: "queued",
        status: "wishlist",
        retry_count: 0,
      } as any)
      .select("id")
      .single();

    if (createErr || !appRecord) {
      if (createErr?.code === "23505") {
        const lock = await this.checkActiveLock(supabase, userId);
        return {
          success: false,
          applicationId: lock.activeApp?.id || "",
          applicationStatus: lock.activeApp?.application_status || APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
          platform,
          message: "Another automated application is already in progress for this account.",
        };
      }
      throw new Error(createErr?.message || "Failed to initialize application record.");
    }

    const applicationId = appRecord.id;
    const eventPayload = {
      userId,
      applicationId,
      jobTitle: params.jobTitle,
      company: params.company,
      jobUrl,
      jobId: params.jobId || null,
    };

    try {
      await inngest.send({
        name: "job/application.start",
        data: eventPayload,
      });
    } catch (err: any) {
      console.warn("[ApplicationAgent] Inngest send failed, running workflow in-process:", err?.message);
      if (isMockAutomationEnabled()) {
        return runAutomatedApplication({ userId, applicationId });
      }
    }

    return {
      success: true,
      queued: true,
      applicationId,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.PENDING,
      platform,
      message: "Automated application queued. Processing one job at a time.",
    };
  }

  public static async resumeApplication(
    userId: string,
    applicationId: string,
    updatedFields: Record<string, any>
  ): Promise<ApplicationExecutionResult> {
    const supabase = await createClient();

    const { data: appRecord, error: appErr } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .single();

    if (appErr || !appRecord) {
      throw new Error("Application record not found.");
    }

    const status = appRecord.application_status as string;
    if (!isActiveAutomationStatus(status) && status !== APPLICATION_WORKFLOW_STATUS.FAILED) {
      return {
        success: false,
        applicationId,
        applicationStatus: status as ApplicationStatus,
        platform: (appRecord.platform as JobPlatform) || "generic",
        message: "This application cannot be resumed in its current state.",
      };
    }

    const profileUpdates: Record<string, any> = {};
    for (const key of PROFILE_UPDATE_KEYS) {
      if (updatedFields[key] !== undefined && updatedFields[key] !== "") {
        if (key === "requires_sponsorship") {
          const value = updatedFields[key];
          profileUpdates[key] =
            value === true ||
            value === "Yes" ||
            String(value).toLowerCase().includes("require");
        } else {
          profileUpdates[key] = updatedFields[key];
        }
      }
    }

    if (updatedFields.first_name || updatedFields.last_name) {
      const first = updatedFields.first_name || profileUpdates.first_name;
      const last = updatedFields.last_name || profileUpdates.last_name;
      if (first && last && !profileUpdates.full_name) {
        profileUpdates.full_name = `${first} ${last}`.trim();
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from("profiles").update(profileUpdates).eq("id", userId);
    }

    const customAnswers: Record<string, unknown> = { ...(appRecord.form_data || {}) };
    customAnswers.userAnswers = {
      ...((appRecord.form_data as any)?.userAnswers || {}),
      ...updatedFields,
    };

    await supabase
      .from("job_applications")
      .update({
        application_status: APPLICATION_WORKFLOW_STATUS.PENDING,
        current_step: "queued_resume",
        missing_fields: [],
        form_data: customAnswers,
      })
      .eq("id", applicationId)
      .eq("user_id", userId);

    try {
      await inngest.send({
        name: "job/application.resume",
        data: {
          userId,
          applicationId,
          jobUrl: appRecord.job_url,
          jobId: appRecord.job_id,
        },
      });
    } catch {
      if (isMockAutomationEnabled()) {
        return runAutomatedApplication({ userId, applicationId, resumeFromPause: true });
      }
    }

    return {
      success: true,
      queued: true,
      applicationId,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.PENDING,
      platform: (appRecord.platform as JobPlatform) || "generic",
      browserSessionId: appRecord.browser_session_id,
      liveDebugUrl: appRecord.live_debug_url,
      message: "Profile updated. Automation will resume from the next step.",
    };
  }

  public static async cancelApplication(userId: string, applicationId: string): Promise<void> {
    const supabase = await createClient();

    const { data: app } = await supabase
      .from("job_applications")
      .select("browser_session_id")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .single();

    if (app?.browser_session_id) {
      await browserbaseService.terminateSession(app.browser_session_id);
    }

    await stagehandService.close();

    await supabase
      .from("job_applications")
      .update({
        application_status: APPLICATION_WORKFLOW_STATUS.FAILED,
        current_step: "cancelled",
        error_message: "Application was cancelled by the candidate.",
      })
      .eq("id", applicationId)
      .eq("user_id", userId);
  }
}
