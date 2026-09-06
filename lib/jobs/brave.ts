import { JobPlatform, JobItem } from "@/types/job";

export interface UserJobSearchProfile {
  id: string;
  full_name?: string | null;
  headline?: string | null;
  location?: string | null;
  skills: string[];
  experience_level?: string | null;
  job_type?: string | null;
  experience_years?: number;
  target_roles?: string[];
}

export interface JobSearchParams {
  platform: JobPlatform;
  jobTitle: string;
  skills?: string[];
  location?: string | null;
  experienceLevel?: string | null;
  jobType?: string | null;
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  profile?: {
    name?: string;
    long_name?: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results?: BraveWebResult[];
  };
}

/**
 * Platform domain mappings targeting official ATS job boards
 */
export const PLATFORM_DOMAINS: Record<JobPlatform, string> = {
  greenhouse: "(site:job-boards.greenhouse.io OR site:boards.greenhouse.io)",
  lever: "(site:jobs.lever.co OR site:lever.co)",
  workable: "(site:apply.workable.com OR site:jobs.workable.com)",
  wellfound: "site:wellfound.com/jobs",
};

/**
 * Reusable dynamic query builder passing all important details:
 * - Platform ATS Domain
 * - Preferred Job Title
 * - Preferred Location
 * - Important Skills (OR grouped, top 2-3)
 * - Experience Level
 * - Job Type
 */
export function buildJobSearchQuery({
  platform,
  jobTitle,
  skills,
  location,
  experienceLevel,
  jobType,
}: JobSearchParams): string {
  // Use only the most relevant 2–3 skills with OR grouping
  const primarySkill = skills && skills.length > 0
    ? skills.slice(0, 3).join(" OR ")
    : "";

  return [
    PLATFORM_DOMAINS[platform],
    `"${jobTitle}"`,
    location ? `"${location}"` : "",
    primarySkill ? `(${primarySkill})` : "",
    experienceLevel ? `"${experienceLevel}"` : "",
    jobType && jobType.toLowerCase() !== "remote" ? `"${jobType}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Extract clean job title and company name from web search titles
 */
export function parseTitleAndCompany(
  rawTitle: string,
  url: string,
  platform: JobPlatform
): { title: string; company: string } {
  let clean = rawTitle
    .replace(/^Job Application for /i, "")
    .replace(/ - Greenhouse.*$/i, "")
    .replace(/ \| Lever.*$/i, "")
    .replace(/ - Workable.*$/i, "")
    .replace(/ \| Wellfound.*$/i, "")
    .replace(/ - AngelList.*$/i, "")
    .replace(/ - Application.*$/i, "")
    .replace(/\|.*Apply.*$/i, "")
    .trim();

  let title = clean;
  let company = "";

  if (clean.includes(" at ")) {
    const parts = clean.split(" at ");
    title = parts[0].trim();
    let compPart = parts.slice(1).join(" at ").replace(/Careers$/i, "").trim();
    if (compPart.includes(" • ")) {
      compPart = compPart.split(" • ")[0].trim();
    }
    company = compPart;
  } else if (clean.includes(" - ")) {
    const parts = clean.split(" - ");
    if (url.includes("lever.co") && parts.length >= 2) {
      company = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    } else {
      title = parts[0].trim();
      company = parts.slice(1).join(" - ").trim();
    }
  } else if (clean.includes(" • ")) {
    const parts = clean.split(" • ");
    title = parts[0].trim();
  }

  // Fallback: extract company name from URL path
  if (!company) {
    try {
      const parsedUrl = new URL(url);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      if (segments.length > 0 && segments[0] !== "jobs") {
        company = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
      }
    } catch {
      company = platform.charAt(0).toUpperCase() + platform.slice(1) + " Hiring Partner";
    }
  }

  return {
    title: title.replace(/<[^>]*>?/gm, "").trim(),
    company: company.replace(/<[^>]*>?/gm, "").trim() || "Tech Company",
  };
}

/**
 * Validate that result URL belongs to genuine job postings
 */
export function isValidJobResultUrl(url: string, platform: JobPlatform): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Discard third-party scrapers or aggregators
    if (
      host.includes("hnhiring") ||
      host.includes("google") ||
      host.includes("yahoo") ||
      host.includes("bing") ||
      host.includes("indeed") ||
      host.includes("linkedin")
    ) {
      return false;
    }

    switch (platform) {
      case "greenhouse":
        return (
          (host.includes("greenhouse.io") || host.includes("job-boards.greenhouse.io")) &&
          (path.includes("/jobs/") || path.includes("/job_postings/"))
        );
      case "lever":
        return host.includes("lever.co") && path.length > 5;
      case "workable":
        return host.includes("workable.com") && (path.includes("/j/") || path.includes("/jobs/"));
      case "wellfound":
        return host.includes("wellfound.com") && path.includes("/jobs/");
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Infer metadata such as salary, experience level, and job type from snippet
 */
export function inferJobMetadata(text: string, title: string) {
  const combined = `${title} ${text}`.toLowerCase();

  // Experience level
  let experience_level = "Mid Level";
  if (combined.includes("senior") || combined.includes("sr.") || combined.includes("principal") || combined.includes("lead")) {
    experience_level = "Senior";
  } else if (combined.includes("staff") || combined.includes("architect") || combined.includes("director")) {
    experience_level = "Lead / Staff";
  } else if (combined.includes("junior") || combined.includes("entry") || combined.includes("associate") || combined.includes("intern")) {
    experience_level = "Entry Level";
  }

  // Job Type
  let job_type = "Full-time";
  if (combined.includes("contract") || combined.includes("freelance")) {
    job_type = "Contract";
  } else if (combined.includes("part-time")) {
    job_type = "Part-time";
  } else if (combined.includes("remote")) {
    job_type = "Remote";
  } else if (combined.includes("hybrid")) {
    job_type = "Hybrid";
  }

  // Salary estimation or extraction
  let salary = "$135,000 - $175,000 / yr";
  const salaryMatch = text.match(/\$[\d,]+k?\s*[-–to]+\s*\$?[\d,]+k?/i) || text.match(/\$[\d,]{5,6}/);
  if (salaryMatch) {
    salary = salaryMatch[0];
  } else if (experience_level === "Senior" || experience_level === "Lead / Staff") {
    salary = "$160,000 - $215,000 / yr";
  } else if (experience_level === "Entry Level") {
    salary = "$90,000 - $125,000 / yr";
  }

  return { experience_level, job_type, salary };
}

/**
 * Calculate match score against candidate profile
 */
export function calculateMatchScore(
  jobTitle: string,
  description: string,
  tags: string[],
  userSkills: string[]
): number {
  let score = 72; // baseline

  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const textToScan = `${jobTitle} ${description} ${tags.join(" ")}`.toLowerCase();

  let matchedSkills = 0;
  for (const skill of userSkillsLower) {
    if (skill.length > 1 && textToScan.includes(skill)) {
      matchedSkills++;
    }
  }

  score += Math.min(22, matchedSkills * 5);
  if (textToScan.includes("remote")) score += 3;

  return Math.min(98, Math.max(68, score));
}

/**
 * Call Brave Search API with the official endpoint and query structure
 */
export async function executeBraveJobSearch(
  platform: JobPlatform,
  profile: UserJobSearchProfile,
  apiKey: string
): Promise<Omit<JobItem, "id" | "user_id" | "saved_status">[]> {
  // 1. Preferred Job Title
  let jobTitle = "Software Engineer";
  if (profile.headline && profile.headline.trim().length > 0) {
    jobTitle = profile.headline.replace(/at\s+.*$/i, "").replace(/[-|,].*$/, "").trim();
  } else if (profile.target_roles && profile.target_roles.length > 0) {
    jobTitle = profile.target_roles[0];
  }

  // 2. Preferred Location
  const location = profile.location ? profile.location.split(",")[0].trim() : "Remote";

  // 3. Experience Level (Senior, Mid Level, Entry Level)
  let experienceLevel = profile.experience_level;
  if (!experienceLevel && profile.headline) {
    const hl = profile.headline.toLowerCase();
    if (hl.includes("senior") || hl.includes("sr.")) experienceLevel = "Senior";
    else if (hl.includes("lead") || hl.includes("principal") || hl.includes("staff")) experienceLevel = "Lead";
    else if (hl.includes("junior") || hl.includes("entry")) experienceLevel = "Entry Level";
    else if ((profile.experience_years || 0) >= 5) experienceLevel = "Senior";
  }

  // 4. Job Type (Full-time, Contract, Remote)
  const jobType = profile.job_type || null;

  // 5. Skills
  const skills = profile.skills || [];

  // Build query with ALL 5 important details
  const searchQuery = buildJobSearchQuery({
    platform,
    jobTitle,
    skills,
    location,
    experienceLevel: experienceLevel || null,
    jobType,
  });

  const params = new URLSearchParams({
    q: searchQuery,
    freshness: "pw",
    count: "10",
  });

  const endpoint = `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;

  // Log debugging info (without exposing API key)
  console.log("-----------------------------------------");
  console.log("Brave Search Query (All Details):", searchQuery);
  console.log("Platform:", platform);
  console.log("Details -> Role:", jobTitle, "| Location:", location, "| Skills:", skills.slice(0, 3), "| Level:", experienceLevel, "| Type:", jobType);

  let response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    next: { revalidate: 0 },
  });

  console.log("Response Status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Brave Search API error (${response.status}):`, errorText);

    if (response.status === 401) {
      throw new Error("Invalid Brave Search API key. Please verify BRAVE_SEARCH_API_KEY in .env.local.");
    }
    if (response.status === 429) {
      throw new Error("Brave Search API rate limit reached. Please wait a moment before retrying.");
    }
    throw new Error(`Brave Search API failed: ${response.status} ${errorText}`);
  }

  let data: BraveSearchResponse = await response.json();
  let results = data.web?.results || [];

  // If 0 results with all constraints on this ATS, relax experience/jobType to guarantee relevant results
  if (results.length === 0 && (experienceLevel || jobType)) {
    console.log(`[Brave Search] 0 results with strict experience/type for ${platform}. Retrying with core role & skills...`);
    const fallbackQuery = buildJobSearchQuery({
      platform,
      jobTitle,
      skills,
      location,
    });
    const fallbackParams = new URLSearchParams({
      q: fallbackQuery,
      freshness: "pw",
      count: "10",
    });
    const fallbackRes = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${fallbackParams.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      }
    );
    if (fallbackRes.ok) {
      const fallbackData: BraveSearchResponse = await fallbackRes.json();
      results = fallbackData.web?.results || [];
    }
  }

  console.log(`Number of results returned for ${platform}:`, results.length);
  console.log("-----------------------------------------");

  const normalizedJobs: Omit<JobItem, "id" | "user_id" | "saved_status">[] = [];
  const seenUrls = new Set<string>();
  const nowIso = new Date().toISOString();

  for (const result of results) {
    // 1. Remove invalid / off-platform results
    if (!isValidJobResultUrl(result.url, platform)) {
      continue;
    }

    // 2. Remove duplicate jobs
    if (seenUrls.has(result.url)) {
      continue;
    }
    seenUrls.add(result.url);

    // 3. Parse title & company
    const { title, company } = parseTitleAndCompany(result.title, result.url, platform);
    const meta = inferJobMetadata(result.description || "", title);

    // 4. Extract matched skills/tags
    const extractedTags: string[] = [];
    for (const skill of profile.skills) {
      const lower = skill.toLowerCase();
      if (
        (result.description && result.description.toLowerCase().includes(lower)) ||
        title.toLowerCase().includes(lower)
      ) {
        if (!extractedTags.includes(skill)) extractedTags.push(skill);
      }
    }
    if (extractedTags.length === 0 && profile.skills.length > 0) {
      extractedTags.push(...profile.skills.slice(0, 3));
    }

    const match_score = calculateMatchScore(
      title,
      result.description || "",
      extractedTags,
      profile.skills
    );

    normalizedJobs.push({
      platform,
      title,
      company,
      company_logo: null,
      location: location || "Remote",
      salary: meta.salary,
      job_type: meta.job_type,
      experience_level: meta.experience_level,
      description: result.description || "Active job listing discovered on " + platform,
      tags: extractedTags,
      match_score,
      job_url: result.url,
      source_url: result.url,
      application_status: "not_applied",
      fetched_at: nowIso,
      created_at: nowIso,
    });
  }

  return normalizedJobs;
}
