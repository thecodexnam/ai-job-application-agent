import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCandidateData, fetchResumeBuffer } from "./candidate-data";
import { detectJobPlatform, detectJobPlatformFromPage } from "./platform-detector";
import { browserbaseService } from "./browserbase.service";
import { stagehandService } from "./stagehand.service";
import { SessionManager } from "./browserbase-scripts/session-manager";
import { detectFormFieldsFromPage, getDefaultFieldsForPlatform } from "./browserbase-scripts/field-detector.script";
import { executeFormFilling } from "./browserbase-scripts/form-filler.script";
import { executeFormSubmission } from "./browserbase-scripts/form-submitter.script";
import { normalizeFormAnalysis } from "./form-analyzer";
import { matchProfileToForm } from "./profile-matcher";
import { persistDetectedFields } from "./field-store";
import { getMockFormFields } from "./mock-form";
import { isMockAutomationEnabled } from "./validate-url";
import {
  APPLICATION_WORKFLOW_STATUS,
  ApplicationWorkflowStatus,
  MAX_AUTOMATION_RETRIES,
  isTransientAutomationError,
  normalizeApplicationStatus,
} from "./status";
import { ApplicationStatus, FormField, JobPlatform, MissingField } from "./types";

export interface WorkflowResult {
  success: boolean;
  applicationId: string;
  applicationStatus: ApplicationStatus;
  platform: JobPlatform;
  missingFields?: MissingField[];
  browserSessionId?: string | null;
  liveDebugUrl?: string | null;
  message?: string;
  confirmationMessage?: string;
  requiresReview?: boolean;
  queued?: boolean;
  error?: string;
}

function sanitizeLog(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=[redacted]");
}

async function updateApplication(
  supabase: ReturnType<typeof createAdminClient>,
  applicationId: string,
  patch: Record<string, unknown>
) {
  const { error } = await supabase.from("job_applications").update(patch).eq("id", applicationId);
  if (error) {
    console.warn("[ApplicationWorkflow] Update failed:", sanitizeLog(error.message));
  }
}

async function loadApplication(supabase: ReturnType<typeof createAdminClient>, applicationId: string, userId: string) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Application record not found.");
  }
  return data;
}

export async function runAutomatedApplication(params: {
  userId: string;
  applicationId: string;
  resumeFromPause?: boolean;
}): Promise<WorkflowResult> {
  const supabase = createAdminClient();
  const app = await loadApplication(supabase, params.applicationId, params.userId);
  const currentStatus = normalizeApplicationStatus(app.application_status);

  if (currentStatus === APPLICATION_WORKFLOW_STATUS.SUBMITTED) {
    return {
      success: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
      platform: (app.platform as JobPlatform) || "generic",
      confirmationMessage: app.confirmation_details || "Application already submitted.",
      message: "Application already submitted.",
    };
  }

  if (currentStatus === APPLICATION_WORKFLOW_STATUS.FAILED && (app.retry_count || 0) >= MAX_AUTOMATION_RETRIES) {
    return {
      success: false,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.FAILED,
      platform: (app.platform as JobPlatform) || "generic",
      error: app.error_message || "Retry limit reached.",
      message: app.error_message || "Retry limit reached for this application.",
    };
  }

  await updateApplication(supabase, app.id, {
    application_status: APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
    current_step: params.resumeFromPause ? "resumed" : "platform_detected",
    processing_started_at: new Date().toISOString(),
    error_message: null,
  });

  const jobUrl = app.job_url as string;
  let platformInfo = detectJobPlatform(jobUrl);
  let platform: JobPlatform = platformInfo.platform;

  await updateApplication(supabase, app.id, {
    platform,
    current_step: "platform_detected",
  });

  if (isMockAutomationEnabled()) {
    return completeWithDetectedFields({
      supabase,
      app,
      userId: params.userId,
      platform,
      fields: getMockFormFields(platform),
      page: null,
      browserSessionId: null,
      liveDebugUrl: null,
      mockSubmit: true,
    });
  }

  let browserSessionId: string | null = app.browser_session_id || null;
  let liveDebugUrl: string | null = app.live_debug_url || null;
  let page: any = null;

  const canAutomate = browserbaseService.isConfigured() && stagehandService.isStagehandAvailable();
  if (!canAutomate) {
    const fields = getDefaultFieldsForPlatform(platform);
    const analysis = normalizeFormAnalysis(platform, fields, {
      jobTitle: app.job_title,
      company: app.company_name,
    });
    await persistDetectedFields(supabase, app.id, platform, analysis.fields);
    const candidateData = await fetchCandidateData(supabase, params.userId);
    const match = matchProfileToForm(
      analysis.fields,
      candidateData,
      (app.form_data as any)?.userAnswers || {}
    );

    if (!match.isComplete) {
      await updateApplication(supabase, app.id, {
        application_status: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
        missing_fields: match.missingFields,
        current_step: "missing_data",
      });
      return {
        success: false,
        applicationId: app.id,
        applicationStatus: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
        platform,
        missingFields: match.missingFields,
        message: "Required candidate profile fields are missing. Please complete them to proceed.",
      };
    }

    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      current_step: "browser_unavailable",
      error_message:
        "Browser automation is not configured. Add Browserbase and an AI model key, then resume this application.",
    });

    return {
      success: false,
      requiresReview: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      platform,
      message:
        "Profile data is complete, but Browserbase/Stagehand is not configured. The application was not submitted.",
    };
  }

  try {
    if (browserSessionId) {
      try {
        const session = await stagehandService.initSession({ sessionId: browserSessionId });
        page = session.page;
      } catch (err: any) {
        console.warn("[ApplicationWorkflow] Existing session reuse failed:", sanitizeLog(err.message || ""));
        browserSessionId = null;
      }
    }

    if (!page) {
      const created = await SessionManager.createAndConnectSession();
      browserSessionId = created.sessionId;
      liveDebugUrl = created.liveDebugUrl || null;
      page = created.page;
    }

    await updateApplication(supabase, app.id, {
      browser_session_id: browserSessionId,
      live_debug_url: liveDebugUrl,
      current_step: "session_created",
    });

    const navigation = await stagehandService.navigateAndCheck(page, jobUrl);
    const loadedUrl = typeof page.url === "function" ? page.url() : jobUrl;
    const html = await page.content?.().catch(() => "") || "";
    platformInfo = detectJobPlatformFromPage(loadedUrl, html);
    platform = platformInfo.platform;

    await updateApplication(supabase, app.id, {
      platform,
      current_step: "page_opened",
    });

    if (navigation.hasCaptcha) {
      await updateApplication(supabase, app.id, {
        application_status: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
        current_step: "captcha_detected",
        error_message: "CAPTCHA or login wall detected. Complete it in the live browser, then resume.",
      });
      await stagehandService.close();
      return {
        success: false,
        requiresReview: true,
        applicationId: app.id,
        applicationStatus: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
        platform,
        browserSessionId,
        liveDebugUrl,
        message: "CAPTCHA or authentication is blocking automation. User action is required.",
      };
    }

    let extractedFields: FormField[] = await detectFormFieldsFromPage(page, platform);
    if (!extractedFields.length) {
      extractedFields = getDefaultFieldsForPlatform(platform);
    }

    return completeWithDetectedFields({
      supabase,
      app,
      userId: params.userId,
      platform,
      fields: extractedFields,
      page,
      browserSessionId,
      liveDebugUrl,
      mockSubmit: false,
    });
  } catch (err: any) {
    const message = sanitizeLog(err?.message || "Automation failed.");
    const retryCount = (app.retry_count || 0) + 1;
    const transient = isTransientAutomationError(message);
    const status: ApplicationWorkflowStatus =
      transient && retryCount < MAX_AUTOMATION_RETRIES
        ? APPLICATION_WORKFLOW_STATUS.PENDING
        : APPLICATION_WORKFLOW_STATUS.FAILED;

    await updateApplication(supabase, app.id, {
      application_status: status,
      current_step: "error",
      error_message: message,
      retry_count: retryCount,
      last_retry_at: new Date().toISOString(),
    });

    if (status === APPLICATION_WORKFLOW_STATUS.FAILED) {
      await SessionManager.cleanupSession(browserSessionId);
    } else {
      await stagehandService.close();
    }

    if (transient && retryCount < MAX_AUTOMATION_RETRIES) {
      throw err;
    }

    return {
      success: false,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.FAILED,
      platform,
      browserSessionId,
      liveDebugUrl,
      error: message,
      message,
    };
  }
}

async function completeWithDetectedFields(params: {
  supabase: ReturnType<typeof createAdminClient>;
  app: any;
  userId: string;
  platform: JobPlatform;
  fields: FormField[];
  page: any;
  browserSessionId: string | null;
  liveDebugUrl: string | null;
  mockSubmit: boolean;
}): Promise<WorkflowResult> {
  const { supabase, app, userId, platform, fields, page, browserSessionId, liveDebugUrl, mockSubmit } = params;

  const analysis = normalizeFormAnalysis(platform, fields, {
    jobTitle: app.job_title,
    company: app.company_name,
  });

  await persistDetectedFields(supabase, app.id, platform, analysis.fields);
  await updateApplication(supabase, app.id, { current_step: "form_analyzed" });

  const candidateData = await fetchCandidateData(supabase, userId);
  const match = matchProfileToForm(
    analysis.fields,
    candidateData,
    (app.form_data as any)?.userAnswers || {}
  );

  if (!match.isComplete) {
    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
      missing_fields: match.missingFields,
      current_step: "missing_data",
      browser_session_id: browserSessionId,
      live_debug_url: liveDebugUrl,
    });
    await stagehandService.close();
    return {
      success: false,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
      platform,
      missingFields: match.missingFields,
      browserSessionId,
      liveDebugUrl,
      message: "Required candidate profile fields are missing. Please complete them to proceed.",
    };
  }

  await updateApplication(supabase, app.id, {
    current_step: "filling_form",
    missing_fields: [],
  });

  if (mockSubmit) {
    await markSubmitted(supabase, app, userId, platform, "Mock application submitted for development.");
    return {
      success: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
      platform,
      confirmationMessage: "Mock application submitted for development.",
      message: "Mock application submitted.",
    };
  }

  if (!page) {
    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      current_step: "browser_unavailable",
      error_message: "No browser session is available to fill the form.",
    });
    return {
      success: false,
      requiresReview: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      platform,
      message: "No browser session is available to fill the form.",
    };
  }

  const resumeFile = await fetchResumeBuffer(supabase, candidateData.primaryResume);
  if (analysis.requiresResume && !resumeFile.buffer) {
    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
      current_step: "resume_required",
      missing_fields: [
        {
          key: "resume",
          label: "Resume / CV Document",
          type: "file",
          required: true,
          description: "A resume file is required and could not be downloaded from storage.",
        },
      ],
    });
    await stagehandService.close();
    return {
      success: false,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
      platform,
      browserSessionId,
      liveDebugUrl,
      message: "A resume file is required and could not be attached.",
    };
  }

  const fillResult = await executeFormFilling(page, analysis.fields, {
    platform,
    matchedData: match.matchedFields,
    resumeBuffer: resumeFile.buffer,
    resumeFileName: resumeFile.fileName,
  });

  if (analysis.requiresResume && !fillResult.resumeAttached) {
    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      current_step: "resume_upload_failed",
      error_message: "Resume upload could not be verified on the application form.",
    });
    await stagehandService.close();
    return {
      success: false,
      requiresReview: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      platform,
      browserSessionId,
      liveDebugUrl,
      message: "Resume upload could not be verified. User intervention is required.",
    };
  }

  const submission = await executeFormSubmission(page, platform);
  if (!submission.success) {
    await updateApplication(supabase, app.id, {
      application_status: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      current_step: "submission_unconfirmed",
      error_message: submission.errorMessage,
      confirmation_details: null,
    });
    await stagehandService.close();
    return {
      success: false,
      requiresReview: true,
      applicationId: app.id,
      applicationStatus: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
      platform,
      browserSessionId,
      liveDebugUrl,
      error: submission.errorMessage,
      message: submission.errorMessage || "Submission could not be confirmed.",
    };
  }

  await markSubmitted(supabase, app, userId, platform, submission.confirmationMessage);
  await SessionManager.cleanupSession(browserSessionId);

  return {
    success: true,
    applicationId: app.id,
    applicationStatus: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
    platform,
    browserSessionId,
    liveDebugUrl,
    confirmationMessage: submission.confirmationMessage,
    message: "Application filled, resume attached, and submission confirmed.",
  };
}

async function markSubmitted(
  supabase: ReturnType<typeof createAdminClient>,
  app: any,
  userId: string,
  platform: JobPlatform,
  confirmation?: string
) {
  const submittedAt = new Date().toISOString();
  await updateApplication(supabase, app.id, {
    application_status: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
    status: "applied",
    applied_at: submittedAt,
    submission_confirmed_at: submittedAt,
    confirmation_details: confirmation || "Application submitted.",
    current_step: "submitted",
    missing_fields: [],
    error_message: null,
    platform,
  });

  if (app.job_id) {
    await supabase
      .from("jobs")
      .update({ application_status: "applied" })
      .eq("id", app.job_id)
      .eq("user_id", userId);
  }
}
