// ==============================================================================
// lib/application/browserbase-scripts/form-submitter.script.ts
// Browserbase script to locate and click submit button, verify completion
// ==============================================================================

import { JobPlatform } from "../types";
import { greenhousePlatformHandler } from "../../platforms/greenhouse";
import { leverPlatformHandler } from "../../platforms/lever";
import { workablePlatformHandler } from "../../platforms/workable";
import { wellfoundPlatformHandler } from "../../platforms/wellfound";
import { ashbyPlatformHandler } from "../../platforms/ashby";
import { genericPlatformHandler } from "../../platforms/generic";

export interface FormSubmitterResult {
  success: boolean;
  confirmationMessage?: string;
  errorMessage?: string;
  submittedAt?: string;
}

export async function executeFormSubmission(
  page: any,
  platform: JobPlatform,
  onProgress?: (msg: string) => void
): Promise<FormSubmitterResult> {
  onProgress?.("Locating platform submission button...");

  try {
    // 1. Determine platform-specific submit selectors
    let selectors: string[] = [];
    switch (platform) {
      case "greenhouse":
        selectors = greenhousePlatformHandler.knownFieldSelectors.submitButton;
        break;
      case "lever":
        selectors = leverPlatformHandler.knownFieldSelectors.submitButton;
        break;
      case "workable":
        selectors = workablePlatformHandler.knownFieldSelectors.submitButton;
        break;
      case "wellfound":
        selectors = wellfoundPlatformHandler.knownFieldSelectors.submitButton;
        break;
      case "ashby":
        selectors = ashbyPlatformHandler.knownFieldSelectors.submitButton;
        break;
      default:
        selectors = genericPlatformHandler.knownFieldSelectors.submitButton;
        break;
    }

    // 2. Find clickable submit element
    let submitBtn: any = null;
    for (const sel of selectors) {
      submitBtn = await page.$(sel).catch(() => null);
      if (submitBtn) break;
    }

    if (!submitBtn) {
      // General heuristic button search
      submitBtn = await page
        .$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")')
        .catch(() => null);
    }

    if (!submitBtn) {
      return {
        success: false,
        errorMessage: "Could not locate the submit button on the application form.",
      };
    }

    onProgress?.("Submitting application...");

    // 3. Click submit and wait for navigation or DOM update
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => null),
      submitBtn.click().catch(() => null),
    ]);

    // Small delay to let AJAX requests settle
    await new Promise((r) => setTimeout(r, 1500));

    // 4. Inspect page text for confirmation keywords
    const pageText: string = await page.evaluate(() => document.body.innerText).catch(() => "");
    const lowerText = pageText.toLowerCase();

    const successKeywords = [
      "thank you for applying",
      "application submitted",
      "application received",
      "we've received your application",
      "your application has been sent",
      "successfully submitted",
      "thanks for applying",
      "application complete",
    ];

    const hasSuccessKeyword = successKeywords.some((kw) => lowerText.includes(kw));

    if (hasSuccessKeyword) {
      return {
        success: true,
        confirmationMessage: "Application submitted and received by employer.",
        submittedAt: new Date().toISOString(),
      };
    }

    // 5. Check for inline validation errors on the page
    const errorNotice = await page.evaluate(() => {
      const err = document.querySelector(".error, [role='alert'], .field-error, .invalid-feedback, .alert-danger");
      return err ? (err as HTMLElement).innerText : null;
    }).catch(() => null);

    if (errorNotice) {
      return {
        success: false,
        errorMessage: `Form validation issue: ${errorNotice}`,
      };
    }

    const currentUrl = page.url();
    if (
      currentUrl.includes("confirmation") ||
      currentUrl.includes("thanks") ||
      currentUrl.includes("success") ||
      currentUrl.includes("submitted")
    ) {
      return {
        success: true,
        confirmationMessage: "Application submitted successfully.",
        submittedAt: new Date().toISOString(),
      };
    }

    return {
      success: false,
      errorMessage:
        "Submission outcome could not be confirmed. The form may still be open, require a CAPTCHA, or need manual review.",
    };
  } catch (err: any) {
    console.error("[FormSubmitterScript] Error executing submission:", err);
    return {
      success: false,
      errorMessage: err.message || "An error occurred during submission.",
    };
  }
}
