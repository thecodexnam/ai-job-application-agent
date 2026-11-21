// ==============================================================================
// lib/application/application-submitter.ts
// Final validation, form submission, and confirmation detection
// ==============================================================================

import { JobPlatform } from "./types";
import { greenhousePlatformHandler } from "../platforms/greenhouse";
import { leverPlatformHandler } from "../platforms/lever";
import { workablePlatformHandler } from "../platforms/workable";
import { wellfoundPlatformHandler } from "../platforms/wellfound";

export interface SubmissionResult {
  success: boolean;
  confirmationMessage?: string;
  errorMessage?: string;
  submittedAt?: string;
}

/**
 * Validates the form state and executes the submission action in the browser page
 */
export async function submitApplicationForm(
  page: any,
  platform: JobPlatform
): Promise<SubmissionResult> {
  try {
    // 1. Identify platform submit button selector
    let submitSelectors: string[] = [];
    if (platform === "greenhouse") {
      submitSelectors = greenhousePlatformHandler.knownFieldSelectors.submitButton;
    } else if (platform === "lever") {
      submitSelectors = leverPlatformHandler.knownFieldSelectors.submitButton;
    } else if (platform === "workable") {
      submitSelectors = workablePlatformHandler.knownFieldSelectors.submitButton;
    } else if (platform === "wellfound") {
      submitSelectors = wellfoundPlatformHandler.knownFieldSelectors.submitButton;
    } else {
      submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Submit Application")'];
    }

    // 2. Locate submit button
    let submitBtn: any = null;
    for (const sel of submitSelectors) {
      submitBtn = await page.$(sel).catch(() => null);
      if (submitBtn) break;
    }

    if (!submitBtn) {
      return {
        success: false,
        errorMessage: "Could not locate the submit button on the application page.",
      };
    }

    // 3. Click the submit button and await response or navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => null),
      submitBtn.click().catch(() => null),
    ]);

    // 4. Check for success indicators on the page
    const pageText: string = await page.evaluate(() => document.body.innerText).catch(() => "");

    const successKeywords = [
      "thank you for applying",
      "application submitted",
      "application received",
      "we've received your application",
      "your application has been sent",
      "successfully submitted",
    ];

    const isSuccess = successKeywords.some((kw) =>
      pageText.toLowerCase().includes(kw)
    );

    if (isSuccess) {
      return {
        success: true,
        confirmationMessage: "Application submitted and received by employer.",
        submittedAt: new Date().toISOString(),
      };
    }

    // Check for inline error notices
    const errorText = await page.evaluate(() => {
      const errEl = document.querySelector(".error, [role='alert'], .field-error, .invalid-feedback");
      return errEl ? (errEl as HTMLElement).innerText : null;
    }).catch(() => null);

    if (errorText) {
      return {
        success: false,
        errorMessage: `Validation notice: ${errorText}`,
      };
    }

    // Default optimistic success if navigated to a confirmation page
    const currentUrl = page.url();
    if (currentUrl.includes("confirmation") || currentUrl.includes("thanks") || currentUrl.includes("success")) {
      return {
        success: true,
        confirmationMessage: "Application submitted successfully.",
        submittedAt: new Date().toISOString(),
      };
    }

    return {
      success: false,
      errorMessage:
        "Submission outcome could not be confirmed. Manual review is required before marking this application submitted.",
    };
  } catch (err: any) {
    console.error("[ApplicationSubmitter] Error during submission:", err);
    return {
      success: false,
      errorMessage: err.message || "An error occurred while submitting the application.",
    };
  }
}
