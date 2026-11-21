"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  AlertCircleIcon,
  DocumentValidationIcon,
  Globe02Icon,
  UserEdit01Icon,
  CpuIcon,
  LinkSquare02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { PlatformLogo } from "./platform-logo";
import { detectJobPlatform } from "@/lib/application/platform-detector";
import { MissingField, ApplicationStatus } from "@/lib/application/types";

export interface ApplyJobTarget {
  id?: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location?: string | null;
  job_url: string;
  platform?: string;
}

interface JobApplyDialogProps {
  job: ApplyJobTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationCompleted?: (jobId?: string) => void;
}

type DialogView =
  | "select_mode"
  | "automating"
  | "missing_data"
  | "resume_required"
  | "verification_required"
  | "conflict"
  | "duplicate"
  | "result";

export function JobApplyDialog({
  job,
  isOpen,
  onClose,
  onApplicationCompleted,
}: JobApplyDialogProps) {
  const [view, setView] = useState<DialogView>("select_mode");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<ApplicationStatus>("pending");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [liveDebugUrl, setLiveDebugUrl] = useState<string | null>(null);
  const [browserSessionId, setBrowserSessionId] = useState<string | null>(null);
  const [showLiveView, setShowLiveView] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  const detected = detectJobPlatform(job?.job_url || "");
  const platformKey = job?.platform || detected.platform;

  if (!job) return null;

  const steps = [
    { key: "platform_detected", label: "Job Platform Detected" },
    { key: "session_created", label: "Browserbase Session Initialized" },
    { key: "form_analyzed", label: "Application Form Fields Detected & Saved" },
    { key: "profile_checked", label: "Candidate Profile Verified" },
    { key: "filling_form", label: "Form Inputs Populated & Resume Attached" },
    { key: "submitted", label: "Submitted & Recorded to Database" },
  ];

  const stepIndexFromCurrent = (currentStep?: string | null) => {
    const map: Record<string, number> = {
      queued: 0,
      platform_detected: 0,
      session_created: 1,
      page_opened: 1,
      form_analyzed: 2,
      profile_checked: 3,
      missing_data: 3,
      resume_required: 3,
      filling_form: 4,
      submitted: 5,
      completed: 5,
    };
    return map[currentStep || ""] ?? currentStepIndex;
  };

  const applyPolledApplication = (application: any) => {
    if (application.browser_session_id) setBrowserSessionId(application.browser_session_id);
    if (application.live_debug_url) setLiveDebugUrl(application.live_debug_url);
    if (application.application_status) setAppStatus(application.application_status);
    setCurrentStepIndex(stepIndexFromCurrent(application.current_step));
    if (application.confirmation_details) setConfirmationMessage(application.confirmation_details);
    if (application.error_message) setErrorMessage(application.error_message);
  };

  const pollApplication = async (id: string) => {
    for (let attempt = 0; attempt < 90; attempt++) {
      const res = await fetch(`/api/applications/status?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok || !data.application) {
        throw new Error(data.error || "Could not read application status.");
      }

      const application = data.application;
      applyPolledApplication(application);
      const status = application.application_status as string;

      if (
        status === "MISSING_PROFILE_INFO" ||
        status === "NEEDS_USER_ACTION" ||
        status === "SUBMITTED" ||
        status === "FAILED"
      ) {
        return application;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Timed out waiting for the automation worker. Check Inngest and try again.");
  };

  const presentApplicationOutcome = (application: any, fallbackMessage?: string) => {
    const status = application.application_status as string;
    const missing = (application.missing_fields || []) as MissingField[];

    if (status === "MISSING_PROFILE_INFO") {
      if (missing.some((field) => field.key === "resume") && missing.length === 1) {
        setView("resume_required");
        return;
      }
      setMissingFields(missing);
      const initialInputs: Record<string, any> = {};
      missing.forEach((field) => {
        initialInputs[field.key] = field.currentValue || (field.options ? field.options[0] : "");
      });
      setFormInputs(initialInputs);
      setView("missing_data");
      return;
    }

    if (status === "NEEDS_USER_ACTION") {
      setErrorMessage(application.error_message || fallbackMessage || "User action is required.");
      setView("verification_required");
      return;
    }

    if (status === "SUBMITTED") {
      setConfirmationMessage(
        application.confirmation_details || fallbackMessage || "Application submitted."
      );
      setView("result");
      onApplicationCompleted?.(job.id);
      return;
    }

    setErrorMessage(application.error_message || fallbackMessage || "Application automation failed.");
    setView("result");
  };

  // Reset dialog state on reopen
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setView("select_mode");
      setApplicationId(null);
      setAppStatus("pending");
      setCurrentStepIndex(0);
      setMissingFields([]);
      setFormInputs({});
      setLiveDebugUrl(null);
      setBrowserSessionId(null);
      setShowLiveView(false);
      setErrorMessage(null);
      setConfirmationMessage(null);
      setCopiedSessionId(false);
      onClose();
    }
  };

  const copySessionId = () => {
    if (!browserSessionId) return;
    navigator.clipboard.writeText(browserSessionId).then(() => {
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    });
  };

  // ── 1. Handle Apply Manually ───────────────────────────────────────────────
  const handleApplyManually = async () => {
    setLoadingAction(true);
    try {
      // Open original job application URL in new tab immediately
      window.open(job.job_url, "_blank", "noopener,noreferrer");

      // Track manual application in database
      const res = await fetch("/api/applications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          jobUrl: job.job_url,
          applicationMode: "manual",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onApplicationCompleted?.(job.id);
        setApplicationId(data.applicationId);
        setAppStatus("submitted");
        setConfirmationMessage(data.confirmationMessage || "Manual application tracked in pipeline. Opened application link in new browser tab.");
        setView("result");
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error("Manual apply tracking error:", err);
      onClose();
    } finally {
      setLoadingAction(false);
    }
  };

  // ── 2. Handle Apply Automatically ─────────────────────────────────────────
  const handleApplyAutomatically = async (forceApply = false) => {
    setView("automating");
    setLoadingAction(true);
    setErrorMessage(null);
    setConfirmationMessage(null);
    setCurrentStepIndex(1); // Step 1: Platform detected

    try {
      const res = await fetch("/api/applications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          jobUrl: job.job_url,
          applicationMode: "automated",
          force: forceApply,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Priority 1: Duplicate submission check
        if (data.isDuplicate) {
          setErrorMessage(data.message);
          if (data.browserSessionId) setBrowserSessionId(data.browserSessionId);
          setView("duplicate");
          return;
        }

        // Priority 2: Sequential concurrency lock
        if (
          data.isConcurrencyLock ||
          data.message?.includes("sequentially") ||
          data.message?.includes("one at a time") ||
          res.status === 409
        ) {
          setErrorMessage(
            data.message ||
              "Another automated application is currently active. Applications are processed sequentially one at a time to reduce conflicts and avoid platform rate limits."
          );
          setView("conflict");
          return;
        }

        throw new Error(data.error || data.message || "Failed to start automation");
      }

      setApplicationId(data.applicationId);
      setAppStatus(data.applicationStatus);
      if (data.browserSessionId) setBrowserSessionId(data.browserSessionId);
      if (data.liveDebugUrl) setLiveDebugUrl(data.liveDebugUrl);
      if (data.confirmationMessage) setConfirmationMessage(data.confirmationMessage);

      // Check duplicate
      if (data.isDuplicate) {
        setErrorMessage(data.message);
        setView("duplicate");
        return;
      }

      // Check user review required (e.g. CAPTCHA, verification)
      if (data.requiresReview) {
        setCurrentStepIndex(4);
        setErrorMessage(data.message);
        setView("verification_required");
        return;
      }

      // Handle Missing Profile Info
      if (
        data.applicationStatus === "needs_user_input" ||
        data.applicationStatus === "Missing Profile Info" ||
        data.applicationStatus === "Missing Profile Data"
      ) {
        if (data.missingFields && data.missingFields.length > 0) {
          setCurrentStepIndex(3);
          setMissingFields(data.missingFields);
          const initialInputs: Record<string, any> = {};
          data.missingFields.forEach((mf: MissingField) => {
            initialInputs[mf.key] = mf.currentValue || (mf.options ? mf.options[0] : "");
          });
          setFormInputs(initialInputs);
          setView("missing_data");
          return;
        }

        // Resume required
        setCurrentStepIndex(3);
        setView("resume_required");
        return;
      }

      if (data.applicationStatus === "Resume Required") {
        setCurrentStepIndex(3);
        setView("resume_required");
        return;
      }

      // Handle Failed
      if (data.applicationStatus === "failed" || !data.success) {
        setErrorMessage(data.error || data.message || "Application automation encountered an error.");
        setCurrentStepIndex(4);
        setView("result");
        return;
      }

      // Success
      if (data.applicationStatus === "submitted" || data.applicationStatus === "Submitted") {
        setCurrentStepIndex(5);
        setView("result");
        onApplicationCompleted?.(job.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Application automation encountered an issue.");
      setAppStatus("failed");
      setView("result");
    } finally {
      setLoadingAction(false);
    }
  };

  // ── 3. Handle Missing Fields Submission & Resumption ───────────────────────
  const handleResumeWithData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    setLoadingAction(true);
    setErrorMessage(null);
    setView("automating");
    setCurrentStepIndex(4); // Moving into filling form

    try {
      const res = await fetch("/api/applications/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          updatedFields: formInputs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resume application");
      }

      setCurrentStepIndex(5);
      setAppStatus("submitted");
      setConfirmationMessage(data.confirmationMessage || "Missing details saved permanently and application submitted.");
      setView("result");
      onApplicationCompleted?.(job.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resume application.");
      setView("missing_data");
    } finally {
      setLoadingAction(false);
    }
  };

  // ── 4. Handle Authorized User Submission (Step 5 Verification) ─────────────
  const handleAuthorizeAndSubmit = async () => {
    if (!applicationId) return;

    setLoadingAction(true);
    setErrorMessage(null);
    setView("automating");
    setCurrentStepIndex(5);

    try {
      const res = await fetch("/api/applications/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          updatedFields: {},
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete submission");
      }

      setAppStatus("submitted");
      setConfirmationMessage(data.confirmationMessage || "Submission authorized and confirmed by applicant.");
      setView("result");
      onApplicationCompleted?.(job.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete authorized submission.");
      setAppStatus("failed");
      setView("result");
    } finally {
      setLoadingAction(false);
    }
  };

  const isCompletedSuccess = appStatus === "submitted" || appStatus === "Submitted";
  const isFailed = appStatus === "failed" || appStatus === "Failed";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-[#1A1A1A]/20 rounded-lg shadow-xl p-0 overflow-hidden text-[#171914]">
        {/* Header with Title and Platform Badge */}
        <DialogHeader className="p-5 sm:p-6 bg-[#F7F6F0] border-b border-[#1A1A1A]/10 flex flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#687064]">
                Job Application Flow
              </span>
              <span className="text-[#687064]">•</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#1A1A1A]/15">
                <PlatformLogo platform={platformKey} className="size-3" />
                <span className="capitalize">{detected.displayName}</span>
              </span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-[#171914] line-clamp-1">
              {job.title}
            </DialogTitle>
            <p className="text-xs font-medium text-[#5A5D55] flex items-center gap-2">
              <span className="font-semibold">{job.company}</span>
              {job.location && (
                <>
                  <span>•</span>
                  <span>{job.location}</span>
                </>
              )}
            </p>
          </div>
        </DialogHeader>

        {/* Modal Body Based on Dialog View */}
        <div className="p-5 sm:p-6">
          {/* VIEW 1: MODE SELECTION (MANUAL VS AUTOMATED) */}
          {view === "select_mode" && (
            <div className="space-y-5">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-[#171914]">
                  Choose How You Want to Apply
                </h3>
                <p className="text-xs text-[#5A5D55]">
                  Select whether to apply manually on the employer website or let JobBuddy AI detect form fields, attach your resume, and submit automatically using Browserbase.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Apply Manually */}
                <button
                  type="button"
                  onClick={handleApplyManually}
                  disabled={loadingAction}
                  className="group relative flex flex-col justify-between p-4 text-left rounded-lg border border-[#1A1A1A]/15 bg-white hover:bg-[#F7F6F0] transition-colors cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="size-9 rounded-md bg-[#F2F0E8] border border-[#1A1A1A]/10 flex items-center justify-center">
                      <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4 text-[#171914]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#171914] flex items-center justify-between">
                        <span>1. Apply Manually</span>
                        <HugeiconsIcon
                          icon={LinkSquare02Icon}
                          className="size-3.5 text-[#687064] group-hover:text-[#171914] transition-colors"
                        />
                      </h4>
                      <p className="text-[11px] text-[#5A5D55] leading-relaxed">
                        Redirects you directly to the job application URL in your browser. You review, fill out, and submit the application yourself while tracking it in your pipeline.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-[#1A1A1A]/10 flex items-center gap-1 text-[11px] font-semibold text-[#171914]">
                    <span>Open Job URL in Browser</span>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
                  </div>
                </button>

                {/* Option 2: Apply Automatically using AI Agent */}
                <button
                  type="button"
                  onClick={() => handleApplyAutomatically(false)}
                  disabled={loadingAction}
                  className="group relative flex flex-col justify-between p-4 text-left rounded-lg border border-[#9FB944] bg-[#F3F8E2] hover:bg-[#EBF5D5] transition-colors cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-9 rounded-md bg-[#DDF19B] border border-[#9FB944] flex items-center justify-center">
                        <HugeiconsIcon icon={SparklesIcon} className="size-4 text-[#1B2710]" />
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#172013] text-white tracking-wider">
                        AI Automation
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#1B2710] flex items-center gap-1.5">
                        <span>2. Apply Automatically Using AI Agent</span>
                        <HugeiconsIcon icon={CpuIcon} className="size-3.5 text-[#1B2710]" />
                      </h4>
                      <p className="text-[11px] text-[#304019] leading-relaxed">
                        Uses Browserbase & Stagehand to analyze form fields, compare with verified profile data, attach your resume, and submit sequentially.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-[#9FB944]/30 flex items-center justify-between text-[11px] font-bold text-[#1B2710]">
                    <span>Browserbase + Stagehand</span>
                    <span className="px-1.5 py-0.5 bg-[#DDF19B] rounded border border-[#9FB944] text-[9px]">
                      Sequential Lock
                    </span>
                  </div>
                </button>
              </div>

              {/* Information pill */}
              <div className="p-3 bg-[#F7F6F0] rounded-md border border-[#1A1A1A]/10 text-xs text-[#5A5D55] flex items-start gap-2.5">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-[#687064] shrink-0 mt-0.5" />
                <p>
                  If any required information is missing from your profile, the automation pauses and prompts you to provide it before continuing. Personal info is never fabricated.
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: AUTOMATING / IN PROGRESS */}
          {view === "automating" && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex size-12 rounded-lg bg-[#DDF19B] border border-[#9FB944] items-center justify-center">
                  <HugeiconsIcon icon={Loading03Icon} className="size-6 text-[#1B2710] animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-[#171914]">
                  Automating Application with Browserbase Agent...
                </h3>
                <p className="text-xs text-[#5A5D55] font-medium max-w-md mx-auto">
                  Processing your application on {detected.displayName}. Applications run sequentially one at a time to prevent conflicts and avoid platform rate limits.
                </p>
              </div>

              {/* Step Progress Checklist */}
              <div className="bg-[#F7F6F0] p-4 rounded-lg border border-[#1A1A1A]/10 space-y-2">
                {steps.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center justify-between p-2 rounded-md text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-white border border-[#1A1A1A]/15 text-[#171914] font-semibold shadow-xs"
                          : isDone
                          ? "text-[#171914] opacity-90"
                          : "text-[#687064]/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            className="size-4 text-emerald-600 shrink-0"
                          />
                        ) : isCurrent ? (
                          <HugeiconsIcon
                            icon={Loading03Icon}
                            className="size-4 text-[#171914] animate-spin shrink-0"
                          />
                        ) : (
                          <div className="size-4 rounded-full border border-[#687064]/30 shrink-0" />
                        )}
                        <span>{step.label}</span>
                      </div>

                      {isDone && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          Completed
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-[#DDF19B] text-[#1B2710] px-2 py-0.5 rounded border border-[#9FB944]">
                          In Progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Browserbase Session ID Display */}
              {browserSessionId && (
                <div className="px-3 py-2 bg-white rounded-md border border-[#1A1A1A]/10 flex items-center justify-between text-[11px]">
                  <span className="text-[#687064] font-medium">Browserbase Session ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#171914] truncate max-w-xs">{browserSessionId}</span>
                    <button
                      type="button"
                      onClick={copySessionId}
                      className="px-2 py-0.5 rounded border border-[#1A1A1A]/20 bg-[#F7F6F0] text-[10px] font-semibold hover:bg-white cursor-pointer"
                    >
                      {copiedSessionId ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Live View Toggle if Browserbase session active */}
              {liveDebugUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5A5D55] flex items-center gap-1.5">
                      <HugeiconsIcon icon={Globe02Icon} className="size-3.5" />
                      Browserbase Live Inspector
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLiveView(!showLiveView)}
                      className="text-xs h-7 px-2.5 font-semibold border border-[#1A1A1A]/20 rounded-md"
                    >
                      {showLiveView ? "Hide Live View" : "Show Live Browser"}
                    </Button>
                  </div>
                  {showLiveView && (
                    <div className="h-64 rounded-lg overflow-hidden border border-[#1A1A1A]/15">
                      <iframe
                        src={liveDebugUrl}
                        className="w-full h-full border-0"
                        title="Browserbase Live View"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: MISSING PROFILE INFO (PAUSED FOR USER COMPLETION) */}
          {view === "missing_data" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 text-amber-950 flex items-start gap-3">
                <div className="size-8 rounded-md bg-amber-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={UserEdit01Icon} className="size-4 text-amber-900" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950">
                    Step 3: Validate User Profile (Missing Required Data)
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Mandatory form fields were detected that are not in your profile. Provide valid data below to proceed; personal information will never be fabricated.
                  </p>
                </div>
              </div>

              <form onSubmit={handleResumeWithData} className="space-y-3.5 max-h-[40vh] overflow-y-auto pr-1">
                {missingFields.map((field) => (
                  <div key={field.key} className="space-y-1 text-left">
                    <label className="text-xs font-semibold text-[#171914] flex items-center justify-between">
                      <span>{field.label}</span>
                      <span className="text-[10px] text-rose-600 font-semibold">Required</span>
                    </label>

                    {field.description && (
                      <p className="text-[11px] text-[#687064]">{field.description}</p>
                    )}

                    {field.type === "select" && field.options ? (
                      <select
                        required={field.required}
                        value={formInputs[field.key] || ""}
                        onChange={(e) =>
                          setFormInputs({ ...formInputs, [field.key]: e.target.value })
                        }
                        className="w-full h-9 px-3 text-xs font-medium rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white focus:outline-none"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        rows={3}
                        value={formInputs[field.key] || ""}
                        onChange={(e) =>
                          setFormInputs({ ...formInputs, [field.key]: e.target.value })
                        }
                        placeholder={`Enter ${field.label}...`}
                        className="w-full p-2.5 text-xs font-medium rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <input
                        type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
                        required={field.required}
                        value={formInputs[field.key] || ""}
                        onChange={(e) =>
                          setFormInputs({ ...formInputs, [field.key]: e.target.value })
                        }
                        placeholder={`Enter your ${field.label}...`}
                        className="w-full h-9 px-3 text-xs font-medium rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white focus:outline-none"
                      />
                    )}
                  </div>
                ))}

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#1A1A1A]/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setView("select_mode")}
                    className="text-xs font-semibold text-[#5A5D55] h-9 px-3.5 rounded-md cursor-pointer hover:bg-[#F2F0E8]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loadingAction}
                    className="h-9 px-4 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs cursor-pointer"
                  >
                    {loadingAction ? "Saving & Continuing Automation..." : "Save to Profile & Continue Automation"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 4: RESUME REQUIRED */}
          {view === "resume_required" && (
            <div className="space-y-4 text-center sm:text-left">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-3">
                <div className="size-8 rounded-md bg-amber-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={DocumentValidationIcon} className="size-4 text-amber-900" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-amber-950">
                    Step 3: Resume Document Required
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    This job application requires a resume to be attached. Upload your master resume in the Resume Studio so the agent can attach it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("select_mode")}
                  className="text-xs font-semibold h-9 px-3.5 border border-[#1A1A1A]/20 rounded-md cursor-pointer"
                >
                  Back to Options
                </Button>
                <a
                  href="/dashboard/resume"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-[#172013] hover:bg-[#26321E] text-white font-semibold text-xs"
                >
                  <span>Upload Resume in New Tab</span>
                  <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* VIEW 5: USER VERIFICATION / CONSENT REQUIRED (STEP 5) */}
          {view === "verification_required" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-3">
                <div className="size-8 rounded-md bg-amber-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-amber-900" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-amber-950">
                    Step 5: User Verification & Submission Authorization
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    A security check (CAPTCHA, consent declaration, or user verification) requires your review before submission. The application will only be submitted with your explicit authorization.
                  </p>
                </div>
              </div>

              {liveDebugUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5A5D55]">
                    <span className="font-semibold">Interactive Cloud Browser:</span>
                    <a
                      href={liveDebugUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 underline font-semibold flex items-center gap-1"
                    >
                      Open in Full Browser Tab
                      <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
                    </a>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden border border-[#1A1A1A]/15">
                    <iframe
                      src={liveDebugUrl}
                      className="w-full h-full border-0"
                      title="Browserbase Live Interaction"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1A1A1A]/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("select_mode")}
                  className="text-xs font-semibold h-9 px-3.5 border border-[#1A1A1A]/20 rounded-md cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAuthorizeAndSubmit}
                  disabled={loadingAction}
                  className="h-9 px-4 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs cursor-pointer"
                >
                  {loadingAction ? "Confirming Submission..." : "Authorize & Complete Submission"}
                </Button>
              </div>
            </div>
          )}

          {/* VIEW 6: SEQUENTIAL CONFLICT */}
          {view === "conflict" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-3">
                <div className="size-8 rounded-md bg-amber-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-amber-900" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-amber-950">
                    Sequential Concurrency Lock Active
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {errorMessage || "Another automated application is currently active. Applications are processed sequentially one at a time to reduce conflicts and avoid platform rate limits."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Link
                  href="/dashboard/status"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs"
                >
                  <span>View Active in Pipeline</span>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs font-semibold h-9 px-3.5 border border-[#1A1A1A]/20 rounded-md cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* VIEW 7: DUPLICATE SUBMISSION PREVENTED */}
          {view === "duplicate" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-300 flex items-start gap-3">
                <div className="size-8 rounded-md bg-amber-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-amber-900" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-amber-950">
                    Duplicate Submission Prevented
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {errorMessage || `An application for "${job.title}" at "${job.company}" was already submitted. Duplicate applications are blocked to keep your records clean.`}
                  </p>
                </div>
              </div>

              {/* Display Result Details */}
              <div className="p-3.5 bg-[#F7F6F0] rounded-lg border border-[#1A1A1A]/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#687064]">Role:</span>
                  <span className="font-semibold text-[#171914]">{job.title} ({job.company})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#687064]">Job URL:</span>
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline font-medium truncate max-w-xs flex items-center gap-1"
                  >
                    <span>Open Posting</span>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#687064]">Status:</span>
                  <Badge variant="outline" className="bg-[#DDF19B] border-[#9FB944] text-[#1B2710] font-bold text-[10px]">
                    Already Applied
                  </Badge>
                </div>
                {browserSessionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#687064]">Session ID:</span>
                    <span className="font-mono text-[#171914] text-[11px]">{browserSessionId}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleApplyAutomatically(true)}
                  disabled={loadingAction}
                  className="text-xs font-semibold h-9 px-3.5 border border-[#1A1A1A]/20 rounded-md cursor-pointer text-amber-950 hover:bg-amber-100/60"
                >
                  {loadingAction ? "Starting..." : "Apply Again Anyway"}
                </Button>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/status"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs"
                  >
                    <span>View in Pipeline</span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="text-xs font-semibold h-9 px-3 border border-transparent rounded-md cursor-pointer text-[#687064]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 8: FINAL RESULT (SECTION 4 SPECIFICATION) */}
          {view === "result" && (
            <div className="space-y-4.5">
              {/* Header Icon & Title */}
              <div className="text-center space-y-1.5 pt-1">
                <div
                  className={`size-12 rounded-full border flex items-center justify-center mx-auto ${
                    isCompletedSuccess
                      ? "bg-[#E9F2D1] border-[#9FB944] text-[#304019]"
                      : "bg-rose-50 border-rose-300 text-rose-700"
                  }`}
                >
                  <HugeiconsIcon
                    icon={isCompletedSuccess ? CheckmarkCircle01Icon : AlertCircleIcon}
                    className="size-6"
                  />
                </div>
                <h3 className="text-base font-bold text-[#171914]">
                  {isCompletedSuccess ? "Application Attempt Completed" : "Application Attempt Result"}
                </h3>
                <p className="text-xs text-[#5A5D55]">
                  {isCompletedSuccess
                    ? "Your job application has been processed and accurately logged to your database."
                    : "The application automation encountered an issue. Details and session ID are recorded below."}
                </p>
              </div>

              {/* Comprehensive Result Details Card (Section 4) */}
              <div className="p-4 bg-[#F7F6F0] rounded-lg border border-[#1A1A1A]/10 space-y-2.5 text-xs">
                {/* 1. Job Title & Company Name */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#1A1A1A]/10">
                  <span className="text-[#687064] font-medium shrink-0">Role & Company:</span>
                  <div className="text-right">
                    <span className="font-bold text-[#171914] block">{job.title}</span>
                    <span className="text-[11px] text-[#5A5D55]">{job.company}</span>
                  </div>
                </div>

                {/* 2. Job Application URL */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1A1A1A]/10">
                  <span className="text-[#687064] font-medium shrink-0">Application URL:</span>
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold underline truncate max-w-xs flex items-center gap-1 hover:text-emerald-800"
                  >
                    <span className="truncate">{job.job_url}</span>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3 shrink-0" />
                  </a>
                </div>

                {/* 3. Current Application Status */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1A1A1A]/10">
                  <span className="text-[#687064] font-medium">Application Status:</span>
                  <Badge
                    variant="outline"
                    className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded-sm ${
                      isCompletedSuccess
                        ? "bg-[#DDF19B] border-[#9FB944] text-[#1B2710]"
                        : isFailed
                        ? "bg-rose-100 border-rose-300 text-rose-800"
                        : "bg-amber-100 border-amber-300 text-amber-800"
                    }`}
                  >
                    {appStatus}
                  </Badge>
                </div>

                {/* 4. Submission Confirmation if available */}
                {confirmationMessage && (
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#1A1A1A]/10">
                    <span className="text-[#687064] font-medium shrink-0">Confirmation:</span>
                    <span className="text-right text-[#171914] font-semibold text-[11px] max-w-xs">
                      {confirmationMessage}
                    </span>
                  </div>
                )}

                {/* 5. Errors or Missing Information if any */}
                {errorMessage && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] flex items-start gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 6. Browserbase Session ID for Debugging */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[#687064] font-medium shrink-0">Browserbase Session:</span>
                  {browserSessionId ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-[#171914] font-bold truncate max-w-[180px]">
                        {browserSessionId}
                      </span>
                      <button
                        type="button"
                        onClick={copySessionId}
                        className="px-2 py-0.5 rounded border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F0E8] text-[10px] font-bold text-[#171914] cursor-pointer"
                      >
                        {copiedSessionId ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#687064] italic">Not created (Manual / Simulated)</span>
                  )}
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <Link
                  href="/dashboard/status"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F0E8] text-[#171914] font-semibold text-xs"
                >
                  <span>Review in Application Pipeline</span>
                  <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
                </Link>

                <Button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto h-9 px-5 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs cursor-pointer"
                >
                  Done & Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
