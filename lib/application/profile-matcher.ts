// ==============================================================================
// lib/application/profile-matcher.ts
// Maps job application form fields to Supabase profile & resumes
// Identifies missing required candidate data
// ==============================================================================

import { FormField, MissingField, ProfileMatchResult } from "./types";

export interface CandidateDataSources {
  profile: {
    id: string;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    headline?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    work_authorization?: string | null;
    requires_sponsorship?: boolean | null;
    salary_expectation?: string | null;
    notice_period?: string | null;
    summary?: string | null;
    skills?: string[] | null;
    additional_links?: Array<{ title?: string; url?: string }> | null;
  };
  skills?: Array<{ name: string; category?: string; level?: string }>;
  workExperiences?: Array<any>;
  educations?: Array<any>;
  primaryResume?: {
    id: string;
    file_name: string;
    storage_path?: string | null;
    file_url?: string | null;
  } | null;
}

/**
 * Normalizes label/name text to lower case alphanumeric for flexible matching
 */
export function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function inferProfileMapping(field: FormField): string | null {
  const normLabel = normalizeKey(field.label || field.name || field.id || "");
  const fieldType = field.type;

  if (
    normLabel.includes("firstname") ||
    normLabel === "fname" ||
    normLabel === "givenname" ||
    normLabel === "first"
  ) {
    return "first_name";
  }
  if (
    normLabel.includes("lastname") ||
    normLabel === "lname" ||
    normLabel === "surname" ||
    normLabel === "familyname" ||
    normLabel === "last"
  ) {
    return "last_name";
  }
  if (
    normLabel.includes("fullname") ||
    normLabel === "name" ||
    normLabel === "candidate" ||
    normLabel === "candidatename"
  ) {
    return "full_name";
  }
  if (fieldType === "email" || normLabel.includes("email") || normLabel.includes("e-mail")) {
    return "email";
  }
  if (
    fieldType === "tel" ||
    normLabel.includes("phone") ||
    normLabel.includes("mobile") ||
    normLabel.includes("cell") ||
    normLabel.includes("contactnumber")
  ) {
    return "phone";
  }
  if (normLabel.includes("linkedin")) return "linkedin_url";
  if (normLabel.includes("github")) return "github_url";
  if (
    normLabel.includes("portfolio") ||
    normLabel.includes("website") ||
    normLabel.includes("personalurl") ||
    normLabel.includes("homepage")
  ) {
    return "portfolio_url";
  }
  if (
    normLabel.includes("location") ||
    normLabel.includes("city") ||
    normLabel.includes("address") ||
    normLabel.includes("residence")
  ) {
    return "location";
  }
  if (
    normLabel.includes("authorizedtowork") ||
    normLabel.includes("workauthorization") ||
    normLabel.includes("legallyauthorized") ||
    normLabel.includes("eligibletowork")
  ) {
    return "work_authorization";
  }
  if (
    normLabel.includes("sponsorship") ||
    normLabel.includes("visasponsorship") ||
    normLabel.includes("requiresponsorship")
  ) {
    return "requires_sponsorship";
  }
  if (
    fieldType === "file" ||
    normLabel.includes("resume") ||
    normLabel.includes("cv") ||
    normLabel.includes("curriculumvitae")
  ) {
    return "resume";
  }
  if (
    normLabel.includes("noticeperiod") ||
    normLabel.includes("earlieststart") ||
    normLabel.includes("availability")
  ) {
    return "notice_period";
  }
  if (
    normLabel.includes("salary") ||
    normLabel.includes("compensation") ||
    normLabel.includes("expectedpay")
  ) {
    return "salary_expectation";
  }
  if (normLabel.includes("coverletter") || normLabel.includes("cover_letter")) return "cover_letter";
  if (
    normLabel.includes("currentcompany") ||
    normLabel === "company" ||
    normLabel.includes("currentemployer") ||
    normLabel === "employer"
  ) {
    return "current_company";
  }
  if (
    normLabel.includes("currenttitle") ||
    normLabel.includes("currentrole") ||
    normLabel === "jobtitle" ||
    normLabel === "headline"
  ) {
    return "current_title";
  }
  if (
    normLabel.includes("school") ||
    normLabel.includes("university") ||
    normLabel.includes("college") ||
    normLabel.includes("institution")
  ) {
    return "school";
  }
  if (
    normLabel.includes("degree") ||
    normLabel.includes("fieldofstudy") ||
    normLabel.includes("major")
  ) {
    return "degree";
  }
  if (
    normLabel.includes("skills") ||
    normLabel.includes("technologies") ||
    normLabel.includes("techstack")
  ) {
    return "skills";
  }
  return null;
}

/**
 * Extracts first and last name from full name or dedicated fields
 */
export function resolveCandidateNames(profile: CandidateDataSources["profile"]): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const fullName = (profile.full_name || "").trim();
  let firstName = (profile.first_name || "").trim();
  let lastName = (profile.last_name || "").trim();

  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts[0] || "";
    if (!lastName && parts.length > 1) {
      lastName = parts.slice(1).join(" ");
    }
  }

  return { firstName, lastName, fullName };
}

/**
 * Matches extracted form fields against the candidate's Supabase profile.
 * Returns populated fields and a list of missing required fields.
 */
export function matchProfileToForm(
  fields: FormField[],
  candidate: CandidateDataSources,
  providedAnswers: Record<string, any> = {}
): ProfileMatchResult {
  const { profile, primaryResume } = candidate;
  const { firstName, lastName, fullName } = resolveCandidateNames(profile);

  const matchedFields: Record<string, any> = {};
  const missingFields: MissingField[] = [];
  let requiresResume = false;

  for (const field of fields) {
    const fieldType = field.type;
    let matchedVal: any = null;
    let standardKey = inferProfileMapping(field) || "";

    // 1. First Name
    const provided = providedAnswers[standardKey] ?? providedAnswers[field.id] ?? providedAnswers[field.name];

    if (standardKey === "first_name") {
      matchedVal = provided || firstName;
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "first_name",
          label: "First Name",
          type: "text",
          required: true,
          currentValue: firstName,
        });
      }
    }
    // 2. Last Name
    else if (standardKey === "last_name") {
      matchedVal = provided || lastName;
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "last_name",
          label: "Last Name",
          type: "text",
          required: true,
          currentValue: lastName,
        });
      }
    }
    // 3. Full Name
    else if (standardKey === "full_name") {
      matchedVal = provided || fullName || `${firstName} ${lastName}`.trim();
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "full_name",
          label: "Full Name",
          type: "text",
          required: true,
          currentValue: fullName,
        });
      }
    }
    // 4. Email
    else if (standardKey === "email") {
      matchedVal = provided || profile.email || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "email",
          label: "Email Address",
          type: "email",
          required: true,
          currentValue: profile.email,
        });
      }
    }
    // 5. Phone / Mobile Number
    else if (standardKey === "phone") {
      matchedVal = provided || profile.phone || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "phone",
          label: "Phone Number",
          type: "tel",
          required: true,
          description: "Required by the job poster for application contact.",
          currentValue: profile.phone,
        });
      }
    }
    // 6. LinkedIn URL
    else if (standardKey === "linkedin_url") {
      matchedVal = provided || profile.linkedin_url || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "linkedin_url",
          label: "LinkedIn Profile URL",
          type: "text",
          required: true,
          description: "e.g. https://linkedin.com/in/username",
          currentValue: profile.linkedin_url,
        });
      }
    }
    // 7. GitHub URL
    else if (standardKey === "github_url") {
      matchedVal = provided || profile.github_url || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "github_url",
          label: "GitHub Profile URL",
          type: "text",
          required: true,
          description: "e.g. https://github.com/username",
          currentValue: profile.github_url,
        });
      }
    }
    // 8. Portfolio / Personal Website
    else if (standardKey === "portfolio_url") {
      matchedVal = provided || profile.portfolio_url || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "portfolio_url",
          label: "Portfolio / Website URL",
          type: "text",
          required: true,
          currentValue: profile.portfolio_url,
        });
      }
    }
    // 9. Location / Address / City
    else if (standardKey === "location") {
      matchedVal = provided || profile.location || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "location",
          label: "Current Location / City",
          type: "text",
          required: true,
          currentValue: profile.location,
        });
      }
    }
    // 10. Work Authorization — never invent an eligibility answer
    else if (standardKey === "work_authorization") {
      matchedVal = provided || profile.work_authorization || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "work_authorization",
          label: "Work Authorization",
          type: "select",
          options: [
            "Yes, I am authorized to work in this location",
            "No, I require work authorization / sponsorship",
          ],
          required: true,
          description: "Are you legally authorized to work in this country?",
          currentValue: profile.work_authorization,
        });
      }
    }
    // 11. Visa Sponsorship — only use an explicit profile answer
    else if (standardKey === "requires_sponsorship") {
      matchedVal =
        provided ||
        (profile.requires_sponsorship === true
          ? "Yes"
          : profile.requires_sponsorship === false
            ? "No"
            : "");
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "requires_sponsorship",
          label: "Visa Sponsorship Requirement",
          type: "select",
          options: [
            "No, I do not require sponsorship now or in the future",
            "Yes, I require sponsorship",
          ],
          required: true,
          description: "Will you now or in the future require visa sponsorship?",
          currentValue: profile.requires_sponsorship ? "Yes" : "No",
        });
      }
    }
    // 12. Resume / CV Attachment Field
    else if (standardKey === "resume") {
      requiresResume = true;
      matchedVal = primaryResume ? primaryResume.file_name : null;
      if (!primaryResume) {
        missingFields.push({
          key: "resume",
          label: "Resume / CV Document",
          type: "file",
          required: true,
          description: "A primary resume is required for this application.",
        });
      }
    }
    // 13. Notice Period / Availability
    else if (standardKey === "notice_period") {
      matchedVal = provided || profile.notice_period || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "notice_period",
          label: "Notice Period / Availability",
          type: "text",
          required: true,
          currentValue: profile.notice_period,
        });
      }
    }
    // 14. Salary Expectation
    else if (standardKey === "salary_expectation") {
      matchedVal = provided || profile.salary_expectation || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "salary_expectation",
          label: "Salary Expectation",
          type: "text",
          required: true,
          description: "Expected annual or hourly compensation.",
          currentValue: profile.salary_expectation,
        });
      }
    }
    // 15. Current Company / Employer
    else if (standardKey === "current_company") {
      matchedVal = provided || candidate.workExperiences?.[0]?.company_name || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "current_company",
          label: "Current or Most Recent Company",
          type: "text",
          required: true,
          description: "Your current or most recent employer.",
          currentValue: candidate.workExperiences?.[0]?.company_name || null,
        });
      }
    }
    // 16. Current Title / Role
    else if (standardKey === "current_title") {
      matchedVal = provided || candidate.workExperiences?.[0]?.position || profile.headline || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "current_title",
          label: "Current Job Title / Headline",
          type: "text",
          required: true,
          description: "Your current or target role title.",
          currentValue: candidate.workExperiences?.[0]?.position || profile.headline || null,
        });
      }
    }
    // 17. School / University
    else if (standardKey === "school") {
      matchedVal = provided || candidate.educations?.[0]?.institution || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "school",
          label: "School / University",
          type: "text",
          required: true,
          description: "Your college or educational institution.",
          currentValue: candidate.educations?.[0]?.institution || null,
        });
      }
    }
    // 18. Degree / Major
    else if (standardKey === "degree") {
      matchedVal = provided || candidate.educations?.[0]?.degree || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "degree",
          label: "Degree / Highest Education",
          type: "text",
          required: true,
          description: "Your degree or area of study.",
          currentValue: candidate.educations?.[0]?.degree || null,
        });
      }
    }
    // 19. Skills / Technologies
    else if (standardKey === "skills") {
      const skillsStr =
        profile.skills && profile.skills.length > 0
          ? profile.skills.join(", ")
          : candidate.skills && candidate.skills.length > 0
          ? candidate.skills.map((s: any) => s.name).join(", ")
          : "";
      matchedVal = provided || skillsStr;
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "skills",
          label: "Technical Skills / Stack",
          type: "textarea",
          required: true,
          description: "Relevant skills and technologies for this role.",
          currentValue: skillsStr || null,
        });
      }
    }
    // 20. Cover Letter / Personal Statement
    else if (standardKey === "cover_letter") {
      matchedVal = provided || profile.summary || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: "cover_letter",
          label: "Cover Letter / Note to Hiring Manager",
          type: "textarea",
          required: true,
          description: "A short note or cover letter for this role.",
          currentValue: profile.summary || null,
        });
      }
    }
    // Custom question / generic field fallback — never guess
    else {
      standardKey = field.name || field.id;
      matchedVal = provided || "";
      if (field.required && !matchedVal) {
        missingFields.push({
          key: field.id || field.name,
          label: field.label || field.name,
          type:
            field.type === "textarea"
              ? "textarea"
              : field.type === "select"
                ? "select"
                : field.type === "email"
                  ? "email"
                  : field.type === "tel"
                    ? "tel"
                    : "text",
          required: true,
          description: field.description || "This question needs an answer from you before we can continue.",
          options: field.options,
        });
      }
    }

    if (matchedVal !== null && matchedVal !== undefined) {
      matchedFields[field.id || standardKey] = matchedVal;
    }
  }

  // Deduplicate missing fields by key
  const uniqueMissingFields: MissingField[] = [];
  const seenKeys = new Set<string>();
  for (const mf of missingFields) {
    if (!seenKeys.has(mf.key)) {
      seenKeys.add(mf.key);
      uniqueMissingFields.push(mf);
    }
  }

  return {
    isComplete: uniqueMissingFields.length === 0,
    matchedFields,
    missingFields: uniqueMissingFields,
    requiresResume,
    hasResume: Boolean(primaryResume),
    resumeStoragePath: primaryResume?.storage_path || undefined,
    resumeFileName: primaryResume?.file_name || undefined,
  };
}
