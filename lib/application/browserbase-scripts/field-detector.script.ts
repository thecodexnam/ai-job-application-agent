// ==============================================================================
// lib/application/browserbase-scripts/field-detector.script.ts
// Browserbase + Stagehand script to detect form fields and requirements
// ==============================================================================

import { FormField, JobPlatform } from "../types";
import { greenhousePlatformHandler } from "../../platforms/greenhouse";
import { leverPlatformHandler } from "../../platforms/lever";
import { workablePlatformHandler } from "../../platforms/workable";
import { wellfoundPlatformHandler } from "../../platforms/wellfound";
import { ashbyPlatformHandler } from "../../platforms/ashby";
import { genericPlatformHandler } from "../../platforms/generic";

/**
 * Executes field detection on a live Browserbase page based on the detected platform
 */
export async function detectFormFieldsFromPage(
  page: any,
  platform: JobPlatform
): Promise<FormField[]> {
  try {
    let script = "";
    switch (platform) {
      case "greenhouse":
        script = greenhousePlatformHandler.getExtractionScript();
        break;
      case "lever":
        script = leverPlatformHandler.getExtractionScript();
        break;
      case "workable":
        script = workablePlatformHandler.getExtractionScript();
        break;
      case "wellfound":
        script = wellfoundPlatformHandler.getExtractionScript();
        break;
      case "ashby":
        script = ashbyPlatformHandler.getExtractionScript();
        break;
      default:
        script = genericPlatformHandler.getExtractionScript();
        break;
    }

    const liveFields = await page.evaluate(script).catch(() => []);

    if (Array.isArray(liveFields) && liveFields.length > 0) {
      return liveFields;
    }

    // Fallback to default fields for platform
    return getDefaultFieldsForPlatform(platform);
  } catch (err: any) {
    console.warn(`[FieldDetector] Live detection warning on ${platform}:`, err.message);
    return getDefaultFieldsForPlatform(platform);
  }
}

/**
 * Fallback static schemas for platforms
 */
export function getDefaultFieldsForPlatform(platform: JobPlatform): FormField[] {
  switch (platform) {
    case "greenhouse":
      return greenhousePlatformHandler.getDefaultFormFields();
    case "lever":
      return leverPlatformHandler.getDefaultFormFields();
    case "workable":
      return workablePlatformHandler.getDefaultFormFields();
    case "wellfound":
      return wellfoundPlatformHandler.getDefaultFormFields();
    case "ashby":
      return ashbyPlatformHandler.getDefaultFormFields();
    default:
      return genericPlatformHandler.getDefaultFormFields();
  }
}
