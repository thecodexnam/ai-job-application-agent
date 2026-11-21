import { JobItem, JobPlatform } from "@/types/job";
import {
  AtsIdentity,
  UNDISCLOSED_SALARY,
  cleanHtmlText,
  excerptDescription,
  extractSalaryFromText,
  formatCompanyFromSlug,
  formatStructuredSalary,
  inferExperienceLevel,
  inferJobType,
  isInvalidCompanyName,
  isLikelyDeadOrSpam,
  isLikelyGeneratedDescription,
  normalizePostedAt,
  parseJobLocation,
} from "./metadata";

export type NormalizedJob = Omit<JobItem, "id" | "user_id" | "saved_status">;

const FETCH_TIMEOUT_MS = 8000;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "JobBuddyAI/1.0 (verified-job-search)",
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

const greenhouseBoardNames = new Map<string, string | null>();

export async function getGreenhouseBoardName(boardToken: string): Promise<string | null> {
  const key = boardToken.toLowerCase();
  if (greenhouseBoardNames.has(key)) return greenhouseBoardNames.get(key) || null;

  const data = await fetchJson<{ name?: string }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}`
  );
  const name = data?.name?.trim() || null;
  const verifiedName = name && !isInvalidCompanyName(name) ? name : null;
  greenhouseBoardNames.set(key, verifiedName);
  return verifiedName;
}

interface GreenhouseJob {
  id: number | string;
  title?: string;
  absolute_url?: string;
  location?: { name?: string };
  updated_at?: string;
  content?: string;
  departments?: { name?: string }[];
  offices?: { name?: string; location?: string }[];
  metadata?: { name?: string; value?: string | number | null }[];
  pay_input_ranges?: {
    min_cents?: number;
    max_cents?: number;
    currency_type?: string;
    title?: string;
    interval?: string;
  }[];
}

interface LeverPosting {
  id?: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
  categories?: {
    location?: string;
    commitment?: string;
    team?: string;
    department?: string;
  };
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  };
  salaryDescription?: string;
}

interface WorkableWidgetJob {
  title?: string;
  shortcode?: string;
  url?: string;
  description?: string;
  descriptionPlain?: string;
  description_plain?: string;
  location?: { city?: string; country?: string; region?: string; telecommuting?: boolean };
  department?: string;
  created_at?: string;
}

function greenhouseSalary(job: GreenhouseJob, description: string): string {
  const range = job.pay_input_ranges?.[0];
  if (range && (range.min_cents || range.max_cents)) {
    const formatted = formatStructuredSalary({
      min: range.min_cents ? range.min_cents / 100 : null,
      max: range.max_cents ? range.max_cents / 100 : null,
      currency: range.currency_type,
      period: range.interval,
    });
    if (formatted) return formatted;
  }

  const metaPay = (job.metadata || []).find((m) =>
    /salary|compensation|pay/i.test(m.name || "")
  );
  if (metaPay?.value) {
    const fromMeta = extractSalaryFromText(String(metaPay.value));
    if (fromMeta) return fromMeta;
  }

  return extractSalaryFromText(description) || UNDISCLOSED_SALARY;
}

export function toNormalizedJob(input: {
  platform: JobPlatform;
  title: string;
  company: string;
  jobUrl: string;
  description: string;
  location?: string | null;
  salary?: string | null;
  postedAt?: string | number | null;
  jobType?: string | null;
  tags?: string[];
  matchScore: number;
  logo?: string | null;
}): NormalizedJob | null {
  const title = cleanHtmlText(input.title);
  const company = cleanHtmlText(input.company);
  if (!title || isInvalidCompanyName(company) || !input.jobUrl) return null;

  const description = excerptDescription(input.description);
  if (
    !description ||
    description.length < 24 ||
    isLikelyDeadOrSpam(title, description) ||
    isLikelyGeneratedDescription(description)
  ) {
    return null;
  }

  const nowIso = new Date().toISOString();
  return {
    platform: input.platform,
    title,
    company,
    company_logo: input.logo || null,
    location: parseJobLocation(title, description, input.location),
    salary: input.salary || UNDISCLOSED_SALARY,
    job_type: inferJobType(title, description, input.jobType),
    experience_level: inferExperienceLevel(title, description),
    description,
    tags: input.tags || [],
    match_score: input.matchScore,
    job_url: input.jobUrl,
    source_url: input.jobUrl,
    application_status: "not_applied",
    fetched_at: nowIso,
    posted_at: normalizePostedAt(input.postedAt),
    created_at: nowIso,
  };
}

export async function hydrateGreenhouseJob(
  boardToken: string,
  jobId: string
): Promise<NormalizedJob | null> {
  const job = await fetchJson<GreenhouseJob>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}`
  );
  if (!job?.title || !job.absolute_url) return null;

  const company = await getGreenhouseBoardName(boardToken);
  if (!company) return null;
  const description = cleanHtmlText(job.content || "");
  return toNormalizedJob({
    platform: "greenhouse",
    title: job.title,
    company,
    jobUrl: job.absolute_url,
    description,
    location: job.location?.name || job.offices?.[0]?.location || job.offices?.[0]?.name,
    salary: greenhouseSalary(job, description),
    tags: (job.departments || []).map((d) => d.name).filter((n): n is string => Boolean(n)),
    matchScore: 0,
  });
}

export async function listGreenhouseJobs(boardToken: string): Promise<GreenhouseJob[]> {
  const data = await fetchJson<{ jobs?: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs`
  );
  return data?.jobs || [];
}

export function mapGreenhouseListJob(
  boardToken: string,
  company: string,
  job: GreenhouseJob
): NormalizedJob | null {
  if (!job.title || !job.absolute_url) return null;
  const description = cleanHtmlText(job.content || "");
  return toNormalizedJob({
    platform: "greenhouse",
    title: job.title,
    company,
    jobUrl: job.absolute_url,
    description,
    location: job.location?.name,
    salary: greenhouseSalary(job, description),
    tags: (job.departments || []).map((d) => d.name).filter((n): n is string => Boolean(n)),
    matchScore: 0,
  });
}

export async function listLeverJobs(boardToken: string): Promise<LeverPosting[]> {
  const data = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(boardToken)}?mode=json`
  );
  return Array.isArray(data) ? data : [];
}

export function mapLeverPosting(boardToken: string, posting: LeverPosting): NormalizedJob | null {
  const title = posting.text || "";
  const url = posting.hostedUrl || posting.applyUrl;
  const description = posting.descriptionPlain || cleanHtmlText(posting.description || "");
  const salary =
    formatStructuredSalary({
      min: posting.salaryRange?.min,
      max: posting.salaryRange?.max,
      currency: posting.salaryRange?.currency,
      period: posting.salaryRange?.interval,
      display: posting.salaryDescription,
    }) ||
    extractSalaryFromText(description) ||
    UNDISCLOSED_SALARY;

  return toNormalizedJob({
    platform: "lever",
    title,
    company: formatCompanyFromSlug(boardToken),
    jobUrl: url || "",
    description,
    location: posting.categories?.location,
    salary,
    postedAt: posting.createdAt,
    jobType: posting.categories?.commitment,
    tags: [posting.categories?.team, posting.categories?.department].filter(
      (v): v is string => Boolean(v)
    ),
    matchScore: 0,
  });
}

export async function listWorkableJobs(account: string): Promise<WorkableWidgetJob[]> {
  const data = await fetchJson<{ jobs?: WorkableWidgetJob[] }>(
    `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(account)}`
  );
  return data?.jobs || [];
}

export function mapWorkableWidgetJob(account: string, job: WorkableWidgetJob): NormalizedJob | null {
  const locParts = [job.location?.city, job.location?.region, job.location?.country].filter(Boolean);
  const location = job.location?.telecommuting
    ? locParts.length
      ? `Remote (${locParts.join(", ")})`
      : "Remote"
    : locParts.join(", ");
  const url =
    job.url ||
    (job.shortcode ? `https://apply.workable.com/${account}/j/${job.shortcode}/` : "");

  const description =
    job.descriptionPlain || job.description_plain || cleanHtmlText(job.description || "");
  return toNormalizedJob({
    platform: "workable",
    title: job.title || "",
    company: formatCompanyFromSlug(account),
    jobUrl: url,
    description,
    location,
    salary: UNDISCLOSED_SALARY,
    postedAt: job.created_at,
    tags: job.department ? [job.department] : [],
    matchScore: 0,
  });
}

export async function hydrateFromAtsIdentity(identity: AtsIdentity): Promise<NormalizedJob | null> {
  if (identity.platform === "greenhouse") {
    return hydrateGreenhouseJob(identity.boardToken, identity.jobId);
  }
  if (identity.platform === "lever") {
    const postings = await listLeverJobs(identity.boardToken);
    const match = postings.find((p) => p.id === identity.jobId || p.hostedUrl?.includes(identity.jobId));
    return match ? mapLeverPosting(identity.boardToken, match) : null;
  }
  if (identity.platform === "workable") {
    const jobs = await listWorkableJobs(identity.boardToken);
    const match = jobs.find(
      (j) => j.shortcode === identity.jobId || j.url?.includes(`/j/${identity.jobId}`)
    );
    return match ? mapWorkableWidgetJob(identity.boardToken, match) : null;
  }
  return null;
}
