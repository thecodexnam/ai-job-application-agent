import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  detectJobPlatform,
  detectJobPlatformFromPage,
} from "../lib/application/platform-detector";
import { validateJobApplicationUrl } from "../lib/application/validate-url";
import {
  APPLICATION_WORKFLOW_STATUS,
  normalizeApplicationStatus,
  isActiveAutomationStatus,
  retryBackoffMs,
  isTransientAutomationError,
} from "../lib/application/status";
import {
  inferProfileMapping,
  resolveCandidateNames,
  matchProfileToForm,
  CandidateDataSources,
} from "../lib/application/profile-matcher";
import { FormField } from "../lib/application/types";
import { normalizeFormAnalysis } from "../lib/application/form-analyzer";
import { getMockFormFields } from "../lib/application/mock-form";

// ==============================================================================
// 1. Platform Detection Tests
// ==============================================================================
describe("Platform Detector", () => {
  it("detects Greenhouse URLs accurately", () => {
    const res1 = detectJobPlatform("https://boards.greenhouse.io/stripe/jobs/5544332");
    assert.equal(res1.platform, "greenhouse");
    assert.equal(res1.displayName, "Greenhouse");
    assert.equal(res1.identifier, "5544332");
    assert.equal(res1.isSupported, true);

    const res2 = detectJobPlatform("https://careers.company.com/openings?gh_jid=12345");
    assert.equal(res2.platform, "greenhouse");
    assert.equal(res2.identifier, "12345");
  });

  it("detects Lever URLs accurately", () => {
    const res = detectJobPlatform("https://jobs.lever.co/netflix/9d2f2113-1a2b-4c3d-8e4f");
    assert.equal(res.platform, "lever");
    assert.equal(res.displayName, "Lever");
    assert.equal(res.identifier, "9d2f2113-1a2b-4c3d-8e4f");
    assert.equal(res.isSupported, true);
  });

  it("detects Workable URLs accurately", () => {
    const res = detectJobPlatform("https://apply.workable.com/tech-corp/j/82B61B789C/");
    assert.equal(res.platform, "workable");
    assert.equal(res.displayName, "Workable");
    assert.equal(res.identifier, "82B61B789C");
    assert.equal(res.isSupported, true);
  });

  it("detects Ashby URLs accurately", () => {
    const res = detectJobPlatform("https://jobs.ashbyhq.com/linear/5d1a8e9b-001");
    assert.equal(res.platform, "ashby");
    assert.equal(res.displayName, "Ashby");
    assert.equal(res.isSupported, true);
  });

  it("detects Wellfound and AngelList URLs accurately", () => {
    const res1 = detectJobPlatform("https://wellfound.com/jobs/2849182-senior-full-stack");
    assert.equal(res1.platform, "wellfound");
    assert.equal(res1.displayName, "Wellfound");
    assert.equal(res1.isSupported, true);

    const res2 = detectJobPlatform("https://angel.co/company/cool-startup/jobs/123");
    assert.equal(res2.platform, "wellfound");
  });

  it("falls back to generic platform for unknown job boards", () => {
    const res = detectJobPlatform("https://careers.acme-corp.com/jobs/12345");
    assert.equal(res.platform, "generic");
    assert.equal(res.isSupported, true);
  });

  it("gracefully handles invalid, null, or empty URLs", () => {
    const resEmpty = detectJobPlatform("");
    assert.equal(resEmpty.platform, "generic");
    assert.equal(resEmpty.isSupported, false);

    const resNull = detectJobPlatform(null);
    assert.equal(resNull.platform, "generic");
    assert.equal(resNull.isSupported, false);
  });

  it("refines detection using in-page HTML markers", () => {
    const res = detectJobPlatformFromPage(
      "https://custom-careers-portal.example.com/apply",
      '<div id="grnhse_app"><form action="/embed/job_app"></form></div>'
    );
    assert.equal(res.platform, "greenhouse");

    const resLever = detectJobPlatformFromPage(
      "https://custom-careers-portal.example.com/apply",
      '<div class="lever-apply-form"></div>'
    );
    assert.equal(resLever.platform, "lever");
  });
});

// ==============================================================================
// 2. Job Application URL Validation Tests
// ==============================================================================
describe("Job Application URL Validation", () => {
  it("validates standard HTTPS URLs", () => {
    const res = validateJobApplicationUrl("https://boards.greenhouse.io/figma/jobs/101");
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.url, "https://boards.greenhouse.io/figma/jobs/101");
    }
  });

  it("prepends https protocol when omitted", () => {
    const res = validateJobApplicationUrl("jobs.lever.co/databricks/12345");
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.url, "https://jobs.lever.co/databricks/12345");
    }
  });

  it("rejects empty or whitespace-only inputs", () => {
    const res1 = validateJobApplicationUrl("");
    assert.equal(res1.ok, false);

    const res2 = validateJobApplicationUrl("   ");
    assert.equal(res2.ok, false);

    const res3 = validateJobApplicationUrl(null);
    assert.equal(res3.ok, false);
  });

  it("rejects non-HTTP protocols", () => {
    const res = validateJobApplicationUrl("ftp://files.example.com/job.pdf");
    assert.equal(res.ok, false);
  });
});

// ==============================================================================
// 3. Workflow Status Normalization & Error Handling Tests
// ==============================================================================
describe("Status Normalization & Retry Logic", () => {
  it("normalizes legacy database statuses to standardized workflow statuses", () => {
    assert.equal(normalizeApplicationStatus("pending"), APPLICATION_WORKFLOW_STATUS.PENDING);
    assert.equal(normalizeApplicationStatus("Preparing"), APPLICATION_WORKFLOW_STATUS.IN_PROGRESS);
    assert.equal(normalizeApplicationStatus("in_progress"), APPLICATION_WORKFLOW_STATUS.IN_PROGRESS);
    assert.equal(normalizeApplicationStatus("Missing Profile Info"), APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO);
    assert.equal(normalizeApplicationStatus("Resume Required"), APPLICATION_WORKFLOW_STATUS.MISSING_PROFILE_INFO);
    assert.equal(normalizeApplicationStatus("needs_user_input"), APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION);
    assert.equal(normalizeApplicationStatus("Ready for Review"), APPLICATION_WORKFLOW_STATUS.NEEDS_USER_ACTION);
    assert.equal(normalizeApplicationStatus("submitted"), APPLICATION_WORKFLOW_STATUS.SUBMITTED);
    assert.equal(normalizeApplicationStatus("Failed"), APPLICATION_WORKFLOW_STATUS.FAILED);
  });

  it("identifies active automation statuses", () => {
    assert.equal(isActiveAutomationStatus("PENDING"), true);
    assert.equal(isActiveAutomationStatus("IN_PROGRESS"), true);
    assert.equal(isActiveAutomationStatus("MISSING_PROFILE_INFO"), true);
    assert.equal(isActiveAutomationStatus("NEEDS_USER_ACTION"), true);

    // Terminal statuses are NOT active
    assert.equal(isActiveAutomationStatus("SUBMITTED"), false);
    assert.equal(isActiveAutomationStatus("FAILED"), false);
  });

  it("calculates exponential backoff with a cap", () => {
    assert.equal(retryBackoffMs(0), 2000);
    assert.equal(retryBackoffMs(1), 4000);
    assert.equal(retryBackoffMs(2), 8000);
    assert.equal(retryBackoffMs(3), 16000);
    assert.equal(retryBackoffMs(10), 60000); // capped at 60s
  });

  it("distinguishes transient errors from non-recoverable errors", () => {
    assert.equal(isTransientAutomationError("Navigation timeout of 30000ms exceeded"), true);
    assert.equal(isTransientAutomationError("HTTP 429 Too Many Requests"), true);
    assert.equal(isTransientAutomationError("Service Unavailable 503"), true);
    assert.equal(isTransientAutomationError("ECONNRESET: connection reset by peer"), true);

    // Non-recoverable errors
    assert.equal(isTransientAutomationError("Job posting has been closed by employer"), false);
    assert.equal(isTransientAutomationError("Missing required candidate profile fields"), false);
    assert.equal(isTransientAutomationError("Invalid form field selector"), false);
  });
});

// ==============================================================================
// 4. Form Field Inference & Profile Matching Tests
// ==============================================================================
describe("Field Inference & Candidate Profile Matching", () => {
  it("infers canonical profile mappings from common ATS field names", () => {
    assert.equal(inferProfileMapping({ id: "f1", name: "first_name", label: "First Name", type: "text", required: true }), "first_name");
    assert.equal(inferProfileMapping({ id: "f2", name: "lname", label: "Family Name", type: "text", required: true }), "last_name");
    assert.equal(inferProfileMapping({ id: "f3", name: "email_address", label: "Work Email", type: "email", required: true }), "email");
    assert.equal(inferProfileMapping({ id: "f4", name: "phone_num", label: "Mobile Telephone", type: "tel", required: true }), "phone");
    assert.equal(inferProfileMapping({ id: "f5", name: "linkedin", label: "LinkedIn Profile URL", type: "text", required: false }), "linkedin_url");
    assert.equal(inferProfileMapping({ id: "f6", name: "resume_file", label: "Attach Resume / CV", type: "file", required: true }), "resume");
    assert.equal(inferProfileMapping({ id: "f7", name: "work_auth", label: "Are you authorized to work in this country?", type: "select", required: true }), "work_authorization");
    assert.equal(inferProfileMapping({ id: "f8", name: "visa", label: "Do you require visa sponsorship?", type: "select", required: true }), "requires_sponsorship");
  });

  it("resolves first and last names from profile full name", () => {
    const names = resolveCandidateNames({
      id: "u1",
      full_name: "Jane Alexandra Doe",
    });
    assert.equal(names.firstName, "Jane");
    assert.equal(names.lastName, "Alexandra Doe");
    assert.equal(names.fullName, "Jane Alexandra Doe");
  });

  it("completes matching successfully when all required candidate data is present", () => {
    const candidate: CandidateDataSources = {
      profile: {
        id: "usr_100",
        full_name: "Alex Morgan",
        email: "alex.morgan@example.com",
        phone: "+1-555-0199",
        location: "San Francisco, CA",
        linkedin_url: "https://linkedin.com/in/alexmorgan",
        work_authorization: "Yes, I am authorized to work in this location",
        requires_sponsorship: false,
      },
      primaryResume: {
        id: "res_1",
        file_name: "Alex_Morgan_Resume_2026.pdf",
        storage_path: "resumes/usr_100/Alex_Morgan_Resume_2026.pdf",
      },
    };

    const formFields: FormField[] = [
      { id: "first_name", name: "first_name", label: "First Name", type: "text", required: true },
      { id: "last_name", name: "last_name", label: "Last Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume", type: "file", required: true },
      { id: "work_auth", name: "work_auth", label: "Legally authorized to work?", type: "select", required: true },
    ];

    const match = matchProfileToForm(formFields, candidate);
    assert.equal(match.isComplete, true);
    assert.equal(match.missingFields.length, 0);
    assert.equal(match.matchedFields["first_name"], "Alex");
    assert.equal(match.matchedFields["last_name"], "Morgan");
    assert.equal(match.matchedFields["email"], "alex.morgan@example.com");
    assert.equal(match.hasResume, true);
    assert.equal(match.resumeFileName, "Alex_Morgan_Resume_2026.pdf");
  });

  it("detects missing required fields and NEVER invents eligibility answers", () => {
    const candidateWithoutAuth: CandidateDataSources = {
      profile: {
        id: "usr_200",
        full_name: "Sarah Connor",
        email: "sarah@resistance.org",
        // missing phone, work_authorization, requires_sponsorship
      },
      primaryResume: null, // missing resume
    };

    const formFields: FormField[] = [
      { id: "full_name", name: "full_name", label: "Full Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone Number", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
      { id: "work_auth", name: "work_auth", label: "Are you authorized to work?", type: "select", required: true },
      { id: "visa", name: "visa", label: "Will you require sponsorship?", type: "select", required: true },
    ];

    const match = matchProfileToForm(formFields, candidateWithoutAuth);
    assert.equal(match.isComplete, false);

    const missingKeys = match.missingFields.map((f) => f.key);
    assert.ok(missingKeys.includes("phone"), "Should require phone");
    assert.ok(missingKeys.includes("resume"), "Should require resume");
    assert.ok(missingKeys.includes("work_authorization"), "Should require verified work authorization");
    assert.ok(missingKeys.includes("requires_sponsorship"), "Should require verified visa sponsorship");

    // Verify it provides structured select options to user
    const authField = match.missingFields.find((f) => f.key === "work_authorization");
    assert.ok(authField?.options && authField.options.length > 0);
  });

  it("accepts user-provided answers to complete missing fields without guessing", () => {
    const candidateIncomplete: CandidateDataSources = {
      profile: {
        id: "usr_300",
        full_name: "Naman Developer",
        email: "naman@example.com",
      },
      primaryResume: {
        id: "res_300",
        file_name: "Naman_Resume.pdf",
        storage_path: "resumes/naman.pdf",
      },
    };

    const formFields: FormField[] = [
      { id: "full_name", name: "full_name", label: "Full Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone Number", type: "tel", required: true },
      { id: "custom_q1", name: "custom_q1", label: "Years of experience with React?", type: "text", required: true },
    ];

    // First attempt without answers
    const initialMatch = matchProfileToForm(formFields, candidateIncomplete);
    assert.equal(initialMatch.isComplete, false);
    assert.equal(initialMatch.missingFields.length, 2); // phone and custom_q1

    // Second attempt when user provides answers via the resume dialog
    const resumedMatch = matchProfileToForm(formFields, candidateIncomplete, {
      phone: "+1-415-555-0100",
      custom_q1: "5 years",
    });
    assert.equal(resumedMatch.isComplete, true);
    assert.equal(resumedMatch.matchedFields["phone"], "+1-415-555-0100");
    assert.equal(resumedMatch.matchedFields["custom_q1"], "5 years");
  });
});

// ==============================================================================
// 5. Form Analyzer & Normalizer Tests
// ==============================================================================
describe("Form Analyzer", () => {
  it("normalizes extracted form fields and detects resume requirement", () => {
    const rawFields: FormField[] = [
      { id: "f1", name: "first_name", label: "First Name", type: "text", required: true },
      { id: "f2", name: "last_name", label: "Last Name", type: "text", required: true },
      { id: "f3", name: "email", label: "Email Address", type: "email", required: true },
      { id: "f4", name: "resume", label: "Resume/CV", type: "file", required: true },
      { id: "f5", name: "cover_letter", label: "Cover Letter", type: "textarea", required: false },
    ];

    const analysis = normalizeFormAnalysis("greenhouse", rawFields, {
      jobTitle: "Staff Software Engineer",
      company: "Acme Cloud",
    });

    assert.equal(analysis.platform, "greenhouse");
    assert.equal(analysis.requiresResume, true);
    assert.equal(analysis.requiresCoverLetter, false); // not required
    assert.equal(analysis.fields.length, 5);
  });
});

// ==============================================================================
// 6. Mock Application Support for Tests & CI
// ==============================================================================
describe("Mock Automation Fixtures", () => {
  it("provides complete mock form schemas for all supported platforms", () => {
    const platforms = ["greenhouse", "lever", "workable", "wellfound", "ashby", "generic"] as const;
    for (const p of platforms) {
      const mockFields = getMockFormFields(p);
      assert.ok(Array.isArray(mockFields), `Mock fields for ${p} should be an array`);
      assert.ok(mockFields.length >= 4, `Mock form for ${p} should have at least 4 fields`);

      const hasEmail = mockFields.some((f) => f.type === "email" || f.id.includes("email"));
      assert.ok(hasEmail, `Mock form for ${p} must have an email field`);
    }
  });
});
