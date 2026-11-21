// ==============================================================================
// lib/application/types.ts
// Common types for JobBuddy AI Automated & Manual Job Application flow
// ==============================================================================

export type JobPlatform =
  | "greenhouse"
  | "lever"
  | "workable"
  | "wellfound"
  | "ashby"
  | "generic";

export type ApplicationMode = "manual" | "automated";

export type ApplicationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "MISSING_PROFILE_INFO"
  | "NEEDS_USER_ACTION"
  | "SUBMITTED"
  | "FAILED"
  | "pending"
  | "in_progress"
  | "needs_user_input"
  | "submitted"
  | "failed"
  | "duplicate"
  | "Pending"
  | "Preparing"
  | "Missing Profile Info"
  | "Missing Profile Data"
  | "Resume Required"
  | "In Progress"
  | "Ready for Review"
  | "Submitted"
  | "Failed";

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "file";

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  value?: string;
  description?: string;
  profileMapping?: string | null;
  selector?: string;
}

export interface MissingField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "boolean" | "file";
  description?: string;
  options?: string[];
  required: boolean;
  currentValue?: string | boolean | null;
}

export interface FormAnalysisResult {
  platform: JobPlatform;
  jobTitle?: string;
  company?: string;
  fields: FormField[];
  customQuestions: FormField[];
  requiresResume: boolean;
  requiresCoverLetter: boolean;
}

export interface ProfileMatchResult {
  isComplete: boolean;
  matchedFields: Record<string, any>;
  missingFields: MissingField[];
  requiresResume: boolean;
  hasResume: boolean;
  resumeStoragePath?: string;
  resumeFileName?: string;
}

export interface ApplicationJobContext {
  id: string;
  jobId?: string;
  userId: string;
  jobTitle: string;
  company: string;
  platform: JobPlatform;
  jobUrl: string;
  applicationMode: ApplicationMode;
  applicationStatus: ApplicationStatus;
  browserSessionId?: string | null;
  liveDebugUrl?: string | null;
  currentStep?: string | null;
  missingFields?: MissingField[];
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
}

export interface ApplicationStepProgress {
  step:
    | "platform_detected"
    | "session_created"
    | "page_opened"
    | "form_analyzed"
    | "profile_checked"
    | "filling_form"
    | "ready_for_review"
    | "submitted"
    | "missing_data"
    | "error";
  label: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: string;
  details?: string;
}
