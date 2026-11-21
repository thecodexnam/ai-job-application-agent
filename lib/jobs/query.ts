import { JobPlatform } from "@/types/job";

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

export const PLATFORM_DOMAINS: Partial<Record<JobPlatform, string>> = {
  greenhouse: "(site:boards.greenhouse.io OR site:job-boards.greenhouse.io)",
  lever: "site:jobs.lever.co",
  workable: "site:apply.workable.com",
  wellfound: "site:wellfound.com/jobs",
  indeed: "(site:indeed.com/viewjob OR site:in.indeed.com/viewjob)",
};

export function extractTargetJobTitles(
  headline?: string | null,
  targetRoles?: string[]
): string[] {
  if (targetRoles && targetRoles.length > 0) {
    return targetRoles.filter(Boolean);
  }
  if (!headline || headline.trim().length === 0) {
    return ["Software Engineer"];
  }

  const clean = headline
    .replace(/at\s+.*$/i, "")
    .replace(/[-|,].*$/, "")
    .trim();

  const lower = clean.toLowerCase();
  const titles: string[] = [];

  if (lower.includes("full stack") || lower.includes("fullstack") || lower.includes("mern")) {
    titles.push("Full Stack Developer", "Software Engineer");
  } else if (lower.includes("frontend") || lower.includes("front-end") || lower.includes("react")) {
    titles.push("Frontend Developer", "React Developer");
  } else if (lower.includes("backend") || lower.includes("back-end") || lower.includes("node")) {
    titles.push("Backend Developer", "Software Engineer");
  } else if (lower.includes("ai") || lower.includes("machine learning") || lower.includes("ml")) {
    titles.push("AI Engineer", "Machine Learning Engineer");
  } else if (lower.includes("software engineer") || lower.includes("software developer")) {
    titles.push("Software Engineer", "Developer");
  } else {
    const sanitized = clean.replace(/[+&/\\#@!]/g, " ").replace(/\s+/g, " ").trim();
    titles.push(sanitized || "Software Engineer");
  }

  return titles;
}

export function buildJobSearchQuery({
  platform,
  jobTitle,
  location,
}: JobSearchParams): string {
  const domain = PLATFORM_DOMAINS[platform];
  const parts = domain ? [domain, `"${jobTitle}"`] : [`"${jobTitle}"`];

  if (location && location.toLowerCase() !== "remote" && location.length > 2) {
    const city = location.split(",")[0].trim();
    if (city) parts.push(`"${city}"`);
  }

  return parts.join(" ");
}

export function isValidJobResultUrl(url: string, platform: JobPlatform): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (
      host.includes("hnhiring") ||
      host.includes("google") ||
      host.includes("yahoo") ||
      host.includes("bing") ||
      (platform !== "indeed" && host.includes("indeed")) ||
      host.includes("linkedin")
    ) {
      return false;
    }

    switch (platform) {
      case "greenhouse": {
        const isGhHost =
          host === "greenhouse.io" || host.endsWith(".greenhouse.io");
        const hasJobId =
          /\/jobs\/\d+/i.test(path) ||
          /\/job_postings\/\d+/i.test(path) ||
          parsed.searchParams.has("token") ||
          parsed.searchParams.has("gh_jid");
        return isGhHost && hasJobId && !path.endsWith("/jobs") && !path.endsWith("/jobs/");
      }
      case "lever": {
        const parts = path.split("/").filter(Boolean);
        return (host === "lever.co" || host.endsWith(".lever.co")) && parts.length >= 2 && /[0-9a-f-]{12,}/i.test(parts[1]);
      }
      case "workable": {
        return (host === "workable.com" || host.endsWith(".workable.com")) && /\/j\/[0-9a-z]+/i.test(path);
      }
      case "wellfound": {
        return (host === "wellfound.com" || host.endsWith(".wellfound.com")) && /\/jobs\/\d+/i.test(path);
      }
      case "indeed": {
        const hasJk = parsed.searchParams.has("jk") || /jk=[a-z0-9]+/i.test(parsed.search);
        return (
          (host === "indeed.com" || host.endsWith(".indeed.com")) &&
          (path.includes("/viewjob") || path.includes("/rc/clk")) &&
          hasJk &&
          !path.includes("/career-advice/") &&
          !path.includes("/salaries/") &&
          !path.includes("/cmp/") &&
          !path.includes("/companies/")
        );
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}
