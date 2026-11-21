// ==============================================================================
// lib/application/form-analyzer.ts
// Analyzes application form fields, input types, and required status
// ==============================================================================

import { FormAnalysisResult, FormField, JobPlatform } from "./types";
import { greenhousePlatformHandler } from "../platforms/greenhouse";
import { leverPlatformHandler } from "../platforms/lever";
import { workablePlatformHandler } from "../platforms/workable";
import { wellfoundPlatformHandler } from "../platforms/wellfound";

/**
 * Normalizes extracted fields and identifies custom questions
 */
export function normalizeFormAnalysis(
  platform: JobPlatform,
  rawFields: FormField[],
  pageMetadata?: { jobTitle?: string; company?: string }
): FormAnalysisResult {
  const fields: FormField[] = [];
  const customQuestions: FormField[] = [];
  let requiresResume = false;
  let requiresCoverLetter = false;

  const standardFieldKeys = [
    "firstname",
    "lastname",
    "fullname",
    "name",
    "email",
    "phone",
    "mobile",
    "resume",
    "cv",
    "coverletter",
    "linkedin",
    "github",
    "portfolio",
    "website",
    "location",
    "address",
    "city",
  ];

  for (const field of rawFields) {
    const normKey = (field.label || field.name || field.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      (field.type === "file" || normKey.includes("resume") || normKey.includes("cv")) &&
      field.required !== false
    ) {
      requiresResume = true;
    }
    if ((normKey.includes("coverletter") || normKey.includes("letter")) && field.required) {
      requiresCoverLetter = true;
    }

    const isStandard = standardFieldKeys.some((std) => normKey.includes(std));

    if (isStandard) {
      fields.push(field);
    } else {
      // It's a custom application question (e.g., "Why do you want to work here?")
      customQuestions.push(field);
      fields.push(field);
    }
  }

  return {
    platform,
    jobTitle: pageMetadata?.jobTitle,
    company: pageMetadata?.company,
    fields,
    customQuestions,
    requiresResume,
    requiresCoverLetter,
  };
}

/**
 * Returns default expected form fields for a platform when DOM is pre-analyzed
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
    default:
      return [
        { id: "full_name", name: "full_name", label: "Full Name", type: "text", required: true },
        { id: "email", name: "email", label: "Email", type: "email", required: true },
        { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
        { id: "resume", name: "resume", label: "Resume", type: "file", required: true },
        { id: "linkedin_url", name: "linkedin_url", label: "LinkedIn Profile", type: "text", required: false },
      ];
  }
}
