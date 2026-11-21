// ==============================================================================
// lib/application/browserbase-scripts/form-filler.script.ts
// Browserbase script to fill application form fields and attach candidate resume
// ==============================================================================

import { FormField, JobPlatform } from "../types";

export interface FormFillerOptions {
  platform: JobPlatform;
  matchedData: Record<string, any>;
  resumeBuffer?: Buffer | Uint8Array | null;
  resumeFileName?: string;
  onProgress?: (msg: string) => void;
}

export interface FormFillerResult {
  success: boolean;
  filledCount: number;
  resumeAttached: boolean;
  errors: string[];
}

export async function executeFormFilling(
  page: any,
  fields: FormField[],
  options: FormFillerOptions
): Promise<FormFillerResult> {
  const { matchedData, resumeBuffer, resumeFileName, onProgress } = options;
  let filledCount = 0;
  let resumeAttached = false;
  const errors: string[] = [];

  onProgress?.("Starting automated form field population...");

  for (const field of fields) {
    const value = matchedData[field.id] || matchedData[field.name];
    const isRequired = field.required;

    try {
      // ── 1. Handle File Uploads (Resume & Attachments) ──────────────────────
      if (field.type === "file" || field.name.toLowerCase().includes("resume") || field.id.toLowerCase().includes("resume")) {
        if (resumeBuffer && resumeFileName) {
          onProgress?.(`Attaching resume "${resumeFileName}"...`);
          const fileInput = await page.$(`input[type="file"]`).catch(() => null);

          if (fileInput) {
            await fileInput.setInputFiles({
              name: resumeFileName,
              mimeType: resumeFileName.endsWith(".pdf")
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              buffer: Buffer.isBuffer(resumeBuffer) ? resumeBuffer : Buffer.from(resumeBuffer),
            });

            // Verify the file was indeed attached
            const verified = await page
              .evaluate((el: any) => Boolean(el?.files && el.files.length > 0), fileInput)
              .catch(() => true);

            if (verified) {
              resumeAttached = true;
              filledCount++;
              onProgress?.("Resume successfully attached to application form.");
            } else {
              errors.push("Resume file could not be attached to form input.");
            }
          }
        }
        continue;
      }

      if (value === undefined || value === null || value === "") {
        continue;
      }

      // ── 2. Handle Select Dropdowns ─────────────────────────────────────────
      if (field.type === "select") {
        const selector = `#${field.id}, select[name="${field.name}"], select[id*="${field.id}"]`;
        const selectEl = await page.$(selector).catch(() => null);

        if (selectEl) {
          const strVal = String(value);
          const selected = await selectEl
            .selectOption({ label: strVal })
            .catch(async () => {
              return await selectEl.selectOption({ value: strVal }).catch(() => null);
            });

          if (selected) {
            filledCount++;
          }
        }
        continue;
      }

      // ── 3. Handle Checkboxes and Radios ────────────────────────────────────
      if (field.type === "checkbox" || field.type === "radio") {
        const selector = `#${field.id}, input[name="${field.name}"][type="${field.type}"]`;
        const inputEl = await page.$(selector).catch(() => null);

        if (inputEl) {
          const shouldCheck =
            value === true ||
            value === "true" ||
            value === "Yes" ||
            value === "1" ||
            String(value).toLowerCase() === "authorized";

          if (shouldCheck) {
            await inputEl.check().catch(() => null);
            filledCount++;
          }
        }
        continue;
      }

      // ── 4. Handle Standard Text / Email / Phone / Textarea ────────────────
      const selector = `#${field.id}, input[name="${field.name}"], textarea[name="${field.name}"], input[id*="${field.id}"], textarea[id*="${field.id}"]`;
      const inputEl = await page.$(selector).catch(() => null);

      if (inputEl) {
        const existing = await inputEl.inputValue?.().catch(() => "");
        if (existing && String(existing).trim()) {
          filledCount++;
          continue;
        }
        await inputEl.fill(String(value));
        filledCount++;
      }
    } catch (err: any) {
      console.warn(`[FormFillerScript] Warning filling field ${field.label || field.id}:`, err.message);
      errors.push(`${field.label || field.id}: ${err.message}`);
    }
  }

  // ── 5. Multi-Step Form Navigation Check ─────────────────────────────────
  try {
    const nextBtn = await page
      .$(
        'button:has-text("Next"), button:has-text("Continue"), input[value="Next"], input[value="Continue"], [data-ui="next"], [data-ui="continue"]'
      )
      .catch(() => null);

    if (nextBtn) {
      const btnText = (await nextBtn.innerText?.().catch(() => "")) || "";
      const isSubmit =
        btnText.toLowerCase().includes("submit") ||
        btnText.toLowerCase().includes("apply") ||
        btnText.toLowerCase().includes("review");

      if (!isSubmit) {
        onProgress?.("Advancing multi-step application form...");
        await Promise.all([
          page.waitForNavigation({ timeout: 4000 }).catch(() => null),
          nextBtn.click().catch(() => null),
        ]);
        await new Promise((r) => setTimeout(r, 1200));

        // Re-check and fill any dynamic fields appearing on the next step
        for (const field of fields) {
          const val = matchedData[field.id] || matchedData[field.name];
          if (!val) continue;
          const selector = `#${field.id}, input[name="${field.name}"], textarea[name="${field.name}"]`;
          const el = await page.$(selector).catch(() => null);
          if (el) {
            const existingVal = await el.inputValue?.().catch(() => "");
            if (!existingVal || !String(existingVal).trim()) {
              await el.fill(String(val)).catch(() => null);
              filledCount++;
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[FormFillerScript] Multi-step check warning:", err.message);
  }

  return {
    success: errors.length === 0 || filledCount > 0,
    filledCount,
    resumeAttached,
    errors,
  };
}
