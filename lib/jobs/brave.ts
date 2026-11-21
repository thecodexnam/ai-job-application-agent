export {
  PLATFORM_DOMAINS,
  buildJobSearchQuery,
  extractTargetJobTitles,
  isValidJobResultUrl,
  type JobSearchParams,
  type UserJobSearchProfile,
} from "./query";
export { cleanHtmlText, isLikelyDeadOrSpam, parseJobLocation } from "./metadata";
export { verifyLiveJobPosting } from "./verify";
export { searchVerifiedJobs as executeBraveJobSearch } from "./engine";

import { JobPlatform } from "@/types/job";
import {
  UNDISCLOSED_SALARY,
  extractSalaryFromText,
  formatCompanyFromSlug,
  isInvalidCompanyName,
  parseAtsIdentity,
} from "./metadata";

/**
 * Extract a job title and real employer name. Never invent a company.
 */
export function parseTitleAndCompany(
  rawTitle: string,
  url: string,
  platform: JobPlatform
): { title: string; company: string } {
  const identity = parseAtsIdentity(url);
  const companyFromAts = identity ? formatCompanyFromSlug(identity.boardToken) : "";

  const clean = rawTitle
    .replace(/<[^>]*>/g, "")
    .replace(/^Job Application for\s+/i, "")
    .replace(/^Apply for\s+/i, "")
    .replace(/\s*-\s*Greenhouse.*$/i, "")
    .replace(/\s*\|\s*Lever.*$/i, "")
    .replace(/\s*-\s*Workable.*$/i, "")
    .replace(/\s*\|\s*Wellfound.*$/i, "")
    .replace(/\s*-\s*Indeed.*$/i, "")
    .replace(/\s*\|\s*Indeed.*$/i, "")
    .trim();

  let title = clean;
  let company = "";

  if (/\sat\s/i.test(clean)) {
    const parts = clean.split(/\sat\s/i);
    title = parts[0].trim();
    company = parts.slice(1).join(" at ").replace(/Careers$/i, "").split(" • ")[0].trim();
  } else if (clean.includes(" | ")) {
    const parts = clean.split(" | ");
    title = parts[0].trim();
    company = parts.slice(1).join(" | ").trim();
  } else if (clean.includes(" - ")) {
    const parts = clean.split(" - ");
    title = parts[0].trim();
    company = parts.slice(1).join(" - ").trim();
  }

  if (isInvalidCompanyName(company) && companyFromAts && !isInvalidCompanyName(companyFromAts)) {
    company = companyFromAts;
  }
  if (isInvalidCompanyName(company)) {
    company = "";
  }

  void platform;
  return { title: title.trim(), company };
}

export function inferJobMetadata(text: string, title: string, _location: string) {
  const combined = `${title} ${text}`.toLowerCase();
  let experience_level = "Mid Level";
  if (/\b(senior|sr\.|principal|lead)\b/.test(combined)) experience_level = "Senior";
  else if (/\b(staff|architect|director)\b/.test(combined)) experience_level = "Lead / Staff";
  else if (/\b(junior|entry|associate|intern)\b/.test(combined)) experience_level = "Entry Level";

  let job_type = "Full-time";
  if (/\b(contract|freelance)\b/.test(combined)) job_type = "Contract";
  else if (/\bpart[- ]time\b/.test(combined)) job_type = "Part-time";

  const salary = extractSalaryFromText(`${title} ${text}`) || UNDISCLOSED_SALARY;
  return { experience_level, job_type, salary };
}
