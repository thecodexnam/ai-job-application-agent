import { inngest } from "../client";
import { runAutomatedApplication } from "@/lib/application/workflow";
import {
  APPLICATION_WORKFLOW_STATUS,
  MAX_AUTOMATION_RETRIES,
  isTransientAutomationError,
  retryBackoffMs,
} from "@/lib/application/status";

async function executeWithBackoff(data: {
  userId: string;
  applicationId: string;
  resumeFromPause?: boolean;
}) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_AUTOMATION_RETRIES; attempt++) {
    try {
      return await runAutomatedApplication({
        userId: data.userId,
        applicationId: data.applicationId,
        resumeFromPause: data.resumeFromPause,
      });
    } catch (err: any) {
      lastError = err;
      const message = err?.message || "Automation failed";
      if (!isTransientAutomationError(message) || attempt === MAX_AUTOMATION_RETRIES - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, retryBackoffMs(attempt)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Automation failed");
}

export const automatedApplicationWorkflow = inngest.createFunction(
  {
    id: "job-application-automation-flow",
    name: "Automate Job Application with Browserbase",
    triggers: [{ event: "job/application.start" }],
    concurrency: [
      {
        limit: 1,
        key: "event.data.userId",
      },
    ],
    retries: MAX_AUTOMATION_RETRIES,
  },
  async ({ event }: any) => {
    const { userId, applicationId } = event.data || {};
    if (!userId || !applicationId) {
      return { status: APPLICATION_WORKFLOW_STATUS.FAILED, error: "Missing application identifiers." };
    }

    const result = await executeWithBackoff({ userId, applicationId });
    return {
      status: result.applicationStatus,
      applicationId,
      success: result.success,
      message: result.message,
    };
  }
);

export const resumeApplicationWorkflow = inngest.createFunction(
  {
    id: "job-application-automation-resume",
    name: "Resume Paused Job Application",
    triggers: [{ event: "job/application.resume" }],
    concurrency: [
      {
        limit: 1,
        key: "event.data.userId",
      },
    ],
    retries: MAX_AUTOMATION_RETRIES,
  },
  async ({ event }: any) => {
    const { userId, applicationId } = event.data || {};
    if (!userId || !applicationId) {
      return { status: APPLICATION_WORKFLOW_STATUS.FAILED, error: "Missing application identifiers." };
    }

    const result = await executeWithBackoff({
      userId,
      applicationId,
      resumeFromPause: true,
    });
    return {
      status: result.applicationStatus,
      applicationId,
      success: result.success,
      message: result.message,
    };
  }
);
