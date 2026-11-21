// ==============================================================================
// lib/application/stagehand.service.ts
// Stagehand integration service with Browserbase cloud browser
// ==============================================================================

import { FormField, JobPlatform } from "./types";
import { greenhousePlatformHandler } from "../platforms/greenhouse";
import { leverPlatformHandler } from "../platforms/lever";
import { workablePlatformHandler } from "../platforms/workable";
import { wellfoundPlatformHandler } from "../platforms/wellfound";
import { ashbyPlatformHandler } from "../platforms/ashby";
import { genericPlatformHandler } from "../platforms/generic";

export interface AutomationProgressCallback {
  (step: string, details?: string): void;
}

export class StagehandService {
  private stagehandInstance: any | null = null;

  public isStagehandAvailable(): boolean {
    return Boolean(
      process.env.BROWSERBASE_API_KEY &&
      process.env.BROWSERBASE_PROJECT_ID &&
      (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)
    );
  }

  /**
   * Initializes Stagehand with Browserbase cloud browser dynamically
   */
  public async initSession(options?: {
    sessionId?: string;
    onProgress?: AutomationProgressCallback;
  }): Promise<{ stagehand: any; page: any }> {
    if (!this.isStagehandAvailable()) {
      throw new Error(
        "Automation credentials not fully configured. Please ensure BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, and an AI key (OPENAI_API_KEY or GEMINI_API_KEY) are configured."
      );
    }

    options?.onProgress?.("Connecting Stagehand to Browserbase cloud session...");

    try {
      // Dynamic import to avoid build-time bundling issues with Node-only evaluation
      const { Stagehand } = await import("@browserbasehq/stagehand");

      const stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        keepAlive: true,
        verbose: 1,
        browserbaseSessionID: options?.sessionId,
        browserbaseSessionCreateParams: {
          projectId: process.env.BROWSERBASE_PROJECT_ID,
          keepAlive: true,
        },
        model: process.env.OPENAI_API_KEY ? "gpt-4o" : "gemini-1.5-flash",
        modelName: process.env.OPENAI_API_KEY ? "gpt-4o" : "gemini-1.5-flash",
      } as any);

      if (typeof stagehand.init === "function") {
        await stagehand.init();
      } else {
        await stagehand.init;
      }
      this.stagehandInstance = stagehand;
      const page =
        (typeof (stagehand as any).resolvePage === "function"
          ? await (stagehand as any).resolvePage()
          : null) ||
        (stagehand as any).page ||
        (await (stagehand as any).context?.pages?.()?.[0]);

      return { stagehand, page };
    } catch (err: any) {
      console.error("[StagehandService] Init failed:", err.message);
      throw err;
    }
  }

  /**
   * Navigates to the job URL and checks for anti-bot barriers or CAPTCHAs
   */
  public async navigateAndCheck(
    page: any,
    jobUrl: string,
    onProgress?: AutomationProgressCallback
  ): Promise<{ hasCaptcha: boolean; title: string }> {
    onProgress?.("Navigating to application URL...");
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const title = await page.title();

    // Check for CAPTCHAs or Cloudflare challenge barriers
    const pageContent = await page.content().catch(() => "");
    const hasCaptcha =
      pageContent.includes("cf-turnstile") ||
      pageContent.includes("g-recaptcha") ||
      pageContent.includes("hcaptcha") ||
      pageContent.includes("Please verify you are a human") ||
      title.toLowerCase().includes("just a moment");

    return { hasCaptcha, title };
  }

  /**
   * Extracts form fields from the live page using platform-specific scripts or Stagehand
   */
  public async extractLiveFormFields(
    page: any,
    platform: JobPlatform,
    onProgress?: AutomationProgressCallback
  ): Promise<FormField[]> {
    onProgress?.("Extracting form inputs and requirements...");

    try {
      let extractionScript = "";
      if (platform === "greenhouse") {
        extractionScript = greenhousePlatformHandler.getExtractionScript();
      } else if (platform === "lever") {
        extractionScript = leverPlatformHandler.getExtractionScript();
      } else if (platform === "workable") {
        extractionScript = workablePlatformHandler.getExtractionScript();
      } else if (platform === "wellfound") {
        extractionScript = wellfoundPlatformHandler.getExtractionScript();
      } else if (platform === "ashby") {
        extractionScript = ashbyPlatformHandler.getExtractionScript();
      } else {
        extractionScript = genericPlatformHandler.getExtractionScript();
      }

      if (extractionScript) {
        const fields = await page.evaluate(extractionScript);
        if (Array.isArray(fields) && fields.length > 0) {
          return fields;
        }
      }

      // Generic fallback extraction via DOM evaluation
      const genericFields: FormField[] = await page.evaluate(() => {
        const results: any[] = [];
        const inputs = document.querySelectorAll(
          'input:not([type="hidden"]):not([type="submit"]), textarea, select'
        );

        inputs.forEach((el: any, idx) => {
          const id = el.id || el.name || `field_${idx}`;
          const labelEl =
            document.querySelector(`label[for="${el.id}"]`) || el.closest("label");
          const label = labelEl
            ? labelEl.innerText.trim()
            : el.placeholder || el.name || id;
          const required =
            el.required ||
            el.getAttribute("aria-required") === "true" ||
            label.includes("*");

          let type = "text";
          if (el.tagName.toLowerCase() === "textarea") type = "textarea";
          else if (el.tagName.toLowerCase() === "select") type = "select";
          else if (el.type === "file") type = "file";
          else if (el.type === "email") type = "email";
          else if (el.type === "tel") type = "tel";

          results.push({
            id,
            name: el.name || id,
            label: label.replace(/[*✱]/g, "").trim(),
            type,
            required,
          });
        });

        return results;
      });

      return genericFields;
    } catch (err: any) {
      console.warn("[StagehandService] Live extraction warning:", err.message);
      return [];
    }
  }

  /**
   * Closes Stagehand and cleans up resources
   */
  public async close(): Promise<void> {
    if (this.stagehandInstance) {
      try {
        await this.stagehandInstance.close();
      } catch (err) {
        console.warn("[StagehandService] Error closing stagehand:", err);
      } finally {
        this.stagehandInstance = null;
      }
    }
  }
}

export const stagehandService = new StagehandService();
