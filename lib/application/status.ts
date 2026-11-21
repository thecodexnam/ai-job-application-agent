export const APPLICATION_WORKFLOW_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  MISSING_PROFILE_INFO: "MISSING_PROFILE_INFO",
  NEEDS_USER_ACTION: "NEEDS_USER_ACTION",
  SUBMITTED: "SUBMITTED",
  FAILED: "FAILED",
} as const;

export type ApplicationWorkflowStatus =
  (typeof APPLICATION_WORKFLOW_STATUS)[keyof typeof APPLICATION_WORKFLOW_STATUS];

export const ACTIVE_AUTOMATION_STATUSES: ApplicationWorkflowStatus[] = [
  APPLICATION_WORKFLOW_STATUS.PENDING,
  APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
  APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
];

export const TERMINAL_AUTOMATION_STATUSES: ApplicationWorkflowStatus[] = [
  APPLICATION_WORKFLOW_STATUS.SUBMITTED,
  APPLICATION_WORKFLOW_STATUS.FAILED,
];

export const MAX_AUTOMATION_RETRIES = 3;

const LEGACY_STATUS_MAP: Record<string, ApplicationWorkflowStatus> = {
  pending: APPLICATION_WORKFLOW_STATUS.PENDING,
  Pending: APPLICATION_WORKFLOW_STATUS.PENDING,
  PENDING: APPLICATION_WORKFLOW_STATUS.PENDING,
  preparing: APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  Preparing: APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  in_progress: APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  "In Progress": APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  IN_PROGRESS: APPLICATION_WORKFLOW_STATUS.IN_PROGRESS,
  needs_user_input: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
  NEEDS_USER_ACTION: APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
  "Missing Profile Info": APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
  "Missing Profile Data": APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
  MISSING_PROFILE_INFO: APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
  "Resume Required": APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO,
  "Ready for Review": APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION,
  submitted: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
  Submitted: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
  SUBMITTED: APPLICATION_WORKFLOW_STATUS.SUBMITTED,
  failed: APPLICATION_WORKFLOW_STATUS.FAILED,
  Failed: APPLICATION_WORKFLOW_STATUS.FAILED,
  FAILED: APPLICATION_WORKFLOW_STATUS.FAILED,
  duplicate: APPLICATION_WORKFLOW_STATUS.FAILED,
};

export function normalizeApplicationStatus(
  value: string | null | undefined
): ApplicationWorkflowStatus {
  if (!value) return APPLICATION_WORKFLOW_STATUS.PENDING;
  return LEGACY_STATUS_MAP[value] || APPLICATION_WORKFLOW_STATUS.PENDING;
}

export function isActiveAutomationStatus(value: string | null | undefined): boolean {
  return ACTIVE_AUTOMATION_STATUSES.includes(normalizeApplicationStatus(value));
}

export function retryBackoffMs(retryCount: number): number {
  const attempt = Math.max(0, retryCount);
  return Math.min(60_000, 2_000 * 2 ** attempt);
}

export function isTransientAutomationError(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("503") ||
    lower.includes("econnreset") ||
    lower.includes("network") ||
    lower.includes("socket") ||
    lower.includes("temporar")
  );
}
