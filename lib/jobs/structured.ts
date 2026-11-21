import { JobPlatform } from "@/types/job";
import { NormalizedJob, fetchJson, toNormalizedJob } from "./ats";
import {
  UNDISCLOSED_SALARY,
  cleanHtmlText,
  detectPlatformFromUrl,
  extractSalaryFromText,
  formatCompanyFromSlug,
  formatStructuredSalary,
  isLikelyDeadOrSpam,
  parseAtsIdentity,
} from "./metadata";
import { PLATFORM_DOMAINS, isValidJobResultUrl } from "./query";

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
  tags?: string[];
}

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
}

interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_logo?: string;
  job_apply_link?: string;
  job_description?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_period?: string | null;
  job_employment_type?: string;
  job_posted_at_datetime_utc?: string;
}

interface JsonLdJobPosting {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  datePosted?: string;
  employmentType?: string | string[];
  jobLocationType?: string;
  jobLocation?: unknown;
  hiringOrganization?: { name?: string; logo?: string | { url?: string } };
  baseSalary?: {
    currency?: string;
    value?: number | string | { minValue?: number; maxValue?: number; value?: number; unitText?: string };
  };
  skills?: string | string[];
  occupationalCategory?: string;
  "@graph"?: unknown[];
}

function mapPlatform(url: string, fallback: JobPlatform): JobPlatform {
  return detectPlatformFromUrl(url) || fallback;
}

function collectJsonLdPostings(value: unknown): JsonLdJobPosting[] {
  if (Array.isArray(value)) return value.flatMap(collectJsonLdPostings);
  if (!value || typeof value !== "object") return [];

  const node = value as JsonLdJobPosting;
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return [
    ...(types.includes("JobPosting") ? [node] : []),
    ...collectJsonLdPostings(node["@graph"]),
  ];
}

function getMetaContent(html: string, property: string): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== property.toLowerCase()) continue;
    return tag.match(/content=["']([^"']*)["']/i)?.[1] || "";
  }
  return "";
}

function jsonLdLocation(posting: JsonLdJobPosting): string | undefined {
  if (posting.jobLocationType?.toUpperCase() === "TELECOMMUTE") return "Remote";
  const locations = Array.isArray(posting.jobLocation)
    ? posting.jobLocation
    : [posting.jobLocation];
  const parts = locations.flatMap((location) => {
    if (!location || typeof location !== "object") return [];
    const address = (location as { address?: unknown }).address;
    if (!address || typeof address !== "object") return [];
    const value = address as {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string | { name?: string };
    };
    const country = typeof value.addressCountry === "string"
      ? value.addressCountry
      : value.addressCountry?.name;
    return [[value.addressLocality, value.addressRegion, country].filter(Boolean).join(", ")];
  });
  return parts.find(Boolean);
}

function jsonLdSalary(posting: JsonLdJobPosting): string | null {
  const baseSalary = posting.baseSalary;
  if (!baseSalary) return null;
  const value = baseSalary.value;
  if (typeof value === "number") {
    return formatStructuredSalary({ min: value, currency: baseSalary.currency });
  }
  if (typeof value === "string") {
    return extractSalaryFromText(value);
  }
  if (value && typeof value === "object") {
    return formatStructuredSalary({
      min: value.minValue ?? value.value,
      max: value.maxValue,
      currency: baseSalary.currency,
      period: value.unitText,
    });
  }
  return null;
}

export async function hydrateJsonLdJobPosting(
  url: string,
  platform: JobPlatform
): Promise<NormalizedJob | null> {
  if (!isValidJobResultUrl(url, platform)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let currentUrl = url;
    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= 4; redirectCount++) {
      response = await fetch(currentUrl, {
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          Range: "bytes=0-199999",
          "User-Agent": "Mozilla/5.0 (compatible; JobBuddyAI/1.0)",
        },
      });

      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location || redirectCount === 4) return null;
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isValidJobResultUrl(nextUrl, platform)) return null;
      currentUrl = nextUrl;
    }

    if (!response?.ok) return null;
    const html = (await response.text()).slice(0, 200_000);
    const scripts = html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    const postings: JsonLdJobPosting[] = [];
    for (const match of scripts) {
      try {
        postings.push(...collectJsonLdPostings(JSON.parse(match[1])));
      } catch {
        continue;
      }
    }

    for (const posting of postings) {
      const company = posting.hiringOrganization?.name?.trim() || "";
      const description = cleanHtmlText(posting.description || "");
      if (!posting.title || !company || description.length < 24 || isLikelyDeadOrSpam(posting.title, description)) {
        continue;
      }

      const organizationLogo = posting.hiringOrganization?.logo;
      const logo = typeof organizationLogo === "string"
        ? organizationLogo
        : organizationLogo?.url;
      const tags = typeof posting.skills === "string"
        ? posting.skills.split(/[,;]/).map((skill) => skill.trim()).filter(Boolean)
        : posting.skills || (posting.occupationalCategory ? [posting.occupationalCategory] : []);

      const mapped = toNormalizedJob({
        platform,
        title: posting.title,
        company,
        jobUrl: url,
        description,
        location: jsonLdLocation(posting),
        salary: jsonLdSalary(posting) || extractSalaryFromText(description) || UNDISCLOSED_SALARY,
        postedAt: posting.datePosted,
        jobType: Array.isArray(posting.employmentType)
          ? posting.employmentType[0]
          : posting.employmentType,
        tags,
        matchScore: 0,
        logo,
      });
      if (mapped) return mapped;
    }

    if (platform === "workable" && postings.length === 0) {
      const identity = parseAtsIdentity(url);
      const pageTitle = cleanHtmlText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
      const description = cleanHtmlText(
        getMetaContent(html, "description") || getMetaContent(html, "og:description")
      );
      const titleParts = pageTitle.split(/\s+(?:-|–|—|\||•)\s+/);
      const companyFromTitle = titleParts.length > 1 ? titleParts.pop()?.trim() || "" : "";
      const title = titleParts.join(" - ").trim();
      const company = companyFromTitle || (identity ? formatCompanyFromSlug(identity.boardToken) : "");
      if (
        identity &&
        title &&
        title.toLowerCase() !== company.toLowerCase() &&
        company &&
        description.length >= 24
      ) {
        return toNormalizedJob({
          platform,
          title,
          company,
          jobUrl: url,
          description,
          salary: extractSalaryFromText(description) || UNDISCLOSED_SALARY,
          matchScore: 0,
        });
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchJsonLdJobs(
  platform: JobPlatform,
  query: string,
  apiKey: string
): Promise<NormalizedJob[]> {
  const domain = PLATFORM_DOMAINS[platform];
  if (!domain) return [];

  const params = new URLSearchParams({
    q: `${domain} "${query}"`,
    count: "10",
    freshness: "pm",
    text_decorations: "0",
    search_lang: "en",
  });
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
    {
      headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error(`Brave Search returned HTTP ${response.status}.`);

  const data = (await response.json()) as {
    web?: { results?: { url?: string; title?: string; description?: string }[] };
  };
  const urls = [...new Set((data.web?.results || [])
    .filter((result) => result.url && isValidJobResultUrl(result.url, platform))
    .filter((result) => !isLikelyDeadOrSpam(result.title || "", result.description || ""))
    .map((result) => result.url as string))].slice(0, 8);

  const jobs = await Promise.all(urls.map((url) => hydrateJsonLdJobPosting(url, platform)));
  return jobs.filter((job): job is NormalizedJob => Boolean(job));
}

const remotiveMemo = new Map<string, { at: number; jobs: NormalizedJob[] }>();

export async function searchRemotiveJobs(query: string): Promise<NormalizedJob[]> {
  const memoKey = query.toLowerCase().trim();
  const cached = remotiveMemo.get(memoKey);
  if (cached && Date.now() - cached.at < 60_000) return cached.jobs;

  const data = await fetchJson<{ jobs?: RemotiveJob[] }>(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`
  );
  const jobs = data?.jobs || [];
  const out: NormalizedJob[] = [];

  for (const job of jobs) {
    const url = job.url || "";
    const description = cleanHtmlText(job.description || "");
    const salary =
      extractSalaryFromText(job.salary || "") ||
      extractSalaryFromText(description) ||
      UNDISCLOSED_SALARY;

    const mapped = toNormalizedJob({
      platform: mapPlatform(url, "remotive"),
      title: job.title || "",
      company: job.company_name || "",
      jobUrl: url,
      description,
      location: job.candidate_required_location || "Remote",
      salary,
      postedAt: job.publication_date,
      jobType: job.job_type,
      tags: job.tags || (job.category ? [job.category] : []),
      matchScore: 0,
      logo: job.company_logo,
    });
    if (mapped) out.push(mapped);
  }
  remotiveMemo.set(memoKey, { at: Date.now(), jobs: out });
  return out;
}

export async function searchArbeitnowJobs(query: string): Promise<NormalizedJob[]> {
  const data = await fetchJson<{ data?: ArbeitnowJob[] }>(
    "https://www.arbeitnow.com/api/job-board-api"
  );
  const jobs = data?.data || [];
  const needles = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const out: NormalizedJob[] = [];

  for (const job of jobs) {
    const hay = `${job.title || ""} ${job.description || ""} ${(job.tags || []).join(" ")}`.toLowerCase();
    if (needles.length > 0 && !needles.some((n) => hay.includes(n))) continue;

    const url = job.url || "";
    const description = cleanHtmlText(job.description || "");
    const mapped = toNormalizedJob({
      platform: mapPlatform(url, "arbeitnow"),
      title: job.title || "",
      company: job.company_name || "",
      jobUrl: url,
      description,
      location: job.remote ? "Remote" : job.location,
      salary: extractSalaryFromText(description) || UNDISCLOSED_SALARY,
      postedAt: job.created_at,
      jobType: job.job_types?.[0],
      tags: job.tags || [],
      matchScore: 0,
    });
    if (mapped) out.push(mapped);
  }
  return out;
}

export async function searchJSearchJobs(query: string): Promise<NormalizedJob[]> {
  const apiKey =
    process.env.JSEARCH_API_KEY?.trim() ||
    process.env.RAPIDAPI_KEY?.trim() ||
    process.env.RAPID_API_KEY?.trim();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: "month",
  });

  const data = await fetchJson<{ data?: JSearchJob[] }>(
    `https://jsearch.p.rapidapi.com/search?${params.toString()}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    }
  );

  const jobs = data?.data || [];
  const out: NormalizedJob[] = [];

  for (const job of jobs) {
    const url = job.job_apply_link || "";
    const description = cleanHtmlText(job.job_description || "");
    const location = job.job_is_remote
      ? "Remote"
      : [job.job_city, job.job_state, job.job_country].filter(Boolean).join(", ");
    const salary =
      formatStructuredSalary({
        min: job.job_min_salary,
        max: job.job_max_salary,
        currency: job.job_salary_currency,
        period: job.job_salary_period,
      }) ||
      extractSalaryFromText(description) ||
      UNDISCLOSED_SALARY;

    const mapped = toNormalizedJob({
      platform: mapPlatform(url, "indeed"),
      title: job.job_title || "",
      company: job.employer_name || "",
      jobUrl: url,
      description,
      location,
      salary,
      postedAt: job.job_posted_at_datetime_utc,
      jobType: job.job_employment_type,
      matchScore: 0,
      logo: job.employer_logo,
    });
    if (mapped) out.push(mapped);
  }
  return out;
}
