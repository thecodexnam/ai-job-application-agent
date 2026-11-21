// ==============================================================================
// lib/application/form-filler.ts
// Intelligent auto-filling of form inputs, dropdowns, and resume attachments
// ==============================================================================

import { FormField } from "./types";
import { greenhousePlatformHandler } from "../platforms/greenhouse";
import { leverPlatformHandler } from "../platforms/lever";
import { workablePlatformHandler } from "../platforms/workable";
import { wellfoundPlatformHandler } from "../platforms/wellfound";

export interface FillOptions {
  platform: string;
  matchedData: Record<string, any>;
  resumeBuffer?: Buffer;
  resumeFileName?: string;
}

/**
 * Fills application fields in the browser session page
 */
export async function fillApplicationForm(
  page: any,
  fields: FormField[],
  options: FillOptions
): Promise<{ filledCount: number; errors: string[] }> {
  const { matchedData, resumeBuffer, resumeFileName } = options;
  let filledCount = 0;
  const errors: string[] = [];

  for (const field of fields) {
    const value = matchedData[field.id] || matchedData[field.name];
    if (value === undefined || value === null) continue;

    try {
      if (field.type === "file") {
        // Handle resume / file attachment
        if (resumeBuffer && resumeFileName) {
          const fileInput = await page.$(`input[type="file"]`);
          if (fileInput) {
            // Write buffer to temporary or buffer upload
            await fileInput.setInputFiles({
              name: resumeFileName,
              mimeType: "application/pdf",
              buffer: resumeBuffer,
            });
            filledCount++;
          }
        }
      } else if (field.type === "select") {
        // Handle select dropdowns
        const selector = `#${field.id}, select[name="${field.name}"]`;
        const selectEl = await page.$(selector);
        if (selectEl) {
          await selectEl.selectOption({ label: String(value) }).catch(async () => {
            await selectEl.selectOption({ value: String(value) });
          });
          filledCount++;
        }
      } else if (field.type === "checkbox" || field.type === "radio") {
        // Handle checkboxes/radios
        const selector = `#${field.id}, input[name="${field.name}"]`;
        const inputEl = await page.$(selector);
        if (inputEl && (value === true || value === "Yes" || value === "true")) {
          await inputEl.check();
          filledCount++;
        }
      } else {
        // Handle standard text, email, tel, textarea
        const selector = `#${field.id}, input[name="${field.name}"], textarea[name="${field.name}"]`;
        const inputEl = await page.$(selector);
        if (inputEl) {
          await inputEl.fill(String(value));
          filledCount++;
        }
      }
    } catch (err: any) {
      console.warn(`[FormFiller] Could not fill field ${field.label || field.id}:`, err.message);
      errors.push(`Field ${field.label || field.id}: ${err.message}`);
    }
  }

  return { filledCount, errors };
}
