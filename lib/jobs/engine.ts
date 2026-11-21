import { JobItem, JobPlatform } from "@/types/job";
import { GREENHOUSE_BOARDS, LEVER_BOARDS, WORKABLE_ACCOUNTS } from "./boards";
import {
  getGreenhouseBoardName,
  hydrateFromAtsIdentity,
  hydrateGreenhouseJob,
  listGreenhouseJobs,
  listLeverJobs,
  listWorkableJobs,
  mapLeverPosting,
  mapWorkableWidgetJob,
  NormalizedJob,
} from "./ats";
import {
  hydrateJsonLdJobPosting,
  searchArbeitnowJobs,
  searchJSearchJobs,
  searchJsonLdJobs,
  searchRemotiveJobs,
} from "./structured";
import { isLikelyDeadOrSpam, parseAtsIdentity } from "./metadata";
import { filterLiveJobs } from "./verify";
import {
  PLATFORM_DOMAINS,
  UserJobSearchProfile,
  extractTargetJobTitles,
  isValidJobResultUrl,
} from "./query";

const PER_PLATFORM_LIMIT = 18;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "our",
  "you",
  "your",
  "job",
  "role",
  "jobs",
]);

function uniqueJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of jobs) {
    const key = job.job_url.split("?")[0].replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(key);
  }
  return out;
}

function skillTags(description: string, title: string, skills: string[]): string[] {
  const hay = `${title} ${description}`.toLowerCase();
  return skills.filter((skill) => skill.length > 1 && hay.includes(skill.toLowerCase())).slice(0, 8);
}

function calculateMatchScore(
  jobTitle: string,
  description: string,
  tags: string[],
  userSkills: string[]
): number {
  let score = 55;
  const hay = `${jobTitle} ${description} ${tags.join(" ")}`.toLowerCase();
  let matched = 0;
  for (const skill of userSkills) {
    if (skill.length > 1 && hay.includes(skill.toLowerCase())) matched++;
  }
  score += Math.min(35, matched * 5);
  if (/\bremote\b/.test(hay)) score += 3;
  return Math.min(98, Math.max(50, score));
}

export function matchesSearchIntent(
  title: string,
  description: string,
  profile: UserJobSearchProfile
): boolean {
  const hay = `${title}\n${description}`.toLowerCase();
  const titles = extractTargetJobTitles(profile.headline, profile.target_roles);
  const tokens = new Set<string>();
  for (const t of titles) {
    for (const word of t.toLowerCase().split(/[^a-z0-9+#]+/)) {
      if (word.length > 2 && !STOP_WORDS.has(word)) tokens.add(word);
    }
  }

  const titleLower = title.toLowerCase();
  const titleHit = [...tokens].some((tok) => titleLower.includes(tok));
  if (titleHit) return true;

  const skillHits = (profile.skills || []).filter(
    (s) => s.length > 2 && hay.includes(s.toLowerCase())
  ).length;
  return skillHits >= 2;
}

function finalize(jobs: NormalizedJob[], profile: UserJobSearchProfile): NormalizedJob[] {
  const skills = profile.skills || [];
  return uniqueJobs(jobs)
    .filter((job) => matchesSearchIntent(job.title, job.description || "", profile))
    .map((job) => {
      const tags = uniqueStrings([
        ...skillTags(job.description || "", job.title, skills),
        ...job.tags.filter((t) => !isLikelyDeadOrSpam(t, "")),
      ]).slice(0, 8);
      return {
        ...job,
        tags,
        match_score: calculateMatchScore(job.title, job.description || "", tags, skills),
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, PER_PLATFORM_LIMIT);
}

async function searchGreenhouseStructured(profile: UserJobSearchProfile): Promise<NormalizedJob[]> {
  const collected: NormalizedJob[] = [];
  const results = await Promise.allSettled(
    GREENHOUSE_BOARDS.map(async (board) => {
      const [company, jobs] = await Promise.all([
        getGreenhouseBoardName(board),
        listGreenhouseJobs(board),
      ]);
      if (!company) return [] as NormalizedJob[];

      const matching = jobs
        .filter((job) => job.title && matchesSearchIntent(job.title, "", profile))
        .slice(0, 5);

      const hydrated = await Promise.all(
        matching.map(async (job) => hydrateGreenhouseJob(board, String(job.id)))
      );
      return hydrated.filter((j): j is NormalizedJob => Boolean(j));
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") collected.push(...result.value);
  }
  return collected;
}

async function searchLeverStructured(profile: UserJobSearchProfile): Promise<NormalizedJob[]> {
  const collected: NormalizedJob[] = [];
  const results = await Promise.allSettled(
    LEVER_BOARDS.map(async (board) => {
      const jobs = await listLeverJobs(board);
      return jobs
        .filter((job) => job.text && matchesSearchIntent(job.text, job.descriptionPlain || "", profile))
        .slice(0, 8)
        .map((job) => mapLeverPosting(board, job))
        .filter((j): j is NormalizedJob => Boolean(j));
    })
  );
  for (const result of results) {
    if (result.status === "fulfilled") collected.push(...result.value);
  }
  return collected;
}

async function searchWorkableStructured(profile: UserJobSearchProfile): Promise<NormalizedJob[]> {
  const collected: NormalizedJob[] = [];
  const results = await Promise.allSettled(
    WORKABLE_ACCOUNTS.map(async (account) => {
      const jobs = await listWorkableJobs(account);
      return jobs
        .filter((job) => job.title && matchesSearchIntent(job.title, job.department || "", profile))
        .map((job) => mapWorkableWidgetJob(account, job))
        .filter((j): j is NormalizedJob => Boolean(j));
    })
  );
  for (const result of results) {
    if (result.status === "fulfilled") collected.push(...result.value);
  }
  return collected;
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

async function discoverAtsUrls(
  platform: JobPlatform,
  profile: UserJobSearchProfile,
  apiKey: string
): Promise<string[]> {
  const titles = extractTargetJobTitles(profile.headline, profile.target_roles);
  const jobTitle = titles[0] || "Software Engineer";
  const domain = PLATFORM_DOMAINS[platform];
  if (!domain) return [];

  const query = `${domain} "${jobTitle}"`;
  const params = new URLSearchParams({
    q: query,
    count: "12",
    freshness: "pm",
    text_decorations: "0",
    search_lang: "en",
  });

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        cache: "no-store",
      }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { web?: { results?: BraveWebResult[] } };
    return (data.web?.results || [])
      .filter(
        (r) =>
          isValidJobResultUrl(r.url, platform) &&
          !isLikelyDeadOrSpam(r.title, r.description || "")
      )
      .map((r) => r.url);
  } catch {
    return [];
  }
}

async function hydrateDiscoveredUrls(urls: string[]): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const hydrated = await Promise.all(
      batch.map(async (url) => {
        const identity = parseAtsIdentity(url);
        if (!identity) return null;
        return (
          (await hydrateFromAtsIdentity(identity)) ||
          (await hydrateJsonLdJobPosting(url, identity.platform))
        );
      })
    );
    for (const job of hydrated) {
      if (job) jobs.push(job);
    }
  }
  return jobs;
}

export async function searchVerifiedJobs(
  platform: JobPlatform,
  profile: UserJobSearchProfile,
  braveApiKey?: string
): Promise<Omit<JobItem, "id" | "user_id" | "saved_status">[]> {
  const query = extractTargetJobTitles(profile.headline, profile.target_roles)[0] || "Software Engineer";
  const collected: NormalizedJob[] = [];

  if (platform === "greenhouse") {
    collected.push(...(await searchGreenhouseStructured(profile)));
  } else if (platform === "lever") {
    collected.push(...(await searchLeverStructured(profile)));
  } else if (platform === "workable") {
    collected.push(...(await searchWorkableStructured(profile)));
  } else if (platform === "remotive") {
    collected.push(
      ...(await searchRemotiveJobs(query)).map((job) => ({ ...job, platform: "remotive" as const }))
    );
  } else if (platform === "arbeitnow") {
    collected.push(
      ...(await searchArbeitnowJobs(query)).map((job) => ({ ...job, platform: "arbeitnow" as const }))
    );
  } else if (platform === "indeed") {
    collected.push(...(await searchJSearchJobs(`${query} jobs`)));
    if (braveApiKey) {
      collected.push(...(await searchJsonLdJobs(platform, query, braveApiKey)));
    }
  } else if (platform === "wellfound") {
    if (!braveApiKey) {
      throw new Error("Wellfound search requires BRAVE_SEARCH_API_KEY for verified listing discovery.");
    }
    collected.push(...(await searchJsonLdJobs(platform, query, braveApiKey)));
  }

  if (braveApiKey && ["greenhouse", "lever", "workable"].includes(platform)) {
    const urls = await discoverAtsUrls(platform, profile, braveApiKey);
    collected.push(...(await hydrateDiscoveredUrls(urls)));
  }

  if (["greenhouse", "lever", "workable"].includes(platform)) {
    const extra = await searchRemotiveJobs(query);
    collected.push(...extra.filter((job) => job.platform === platform));
  }

  const scoped = collected.filter((job) => job.platform === platform);
  const ranked = finalize(scoped, profile);

  const live = await filterLiveJobs(ranked);
  if (live.length === 0 && platform === "workable") {
    throw new Error("No matching active Workable postings with real descriptions were found in the configured public boards.");
  }
  if (live.length === 0 && platform === "wellfound") {
    throw new Error("Brave Search found no active Wellfound postings with structured employer and description metadata.");
  }
  if (live.length === 0 && platform === "indeed") {
    const hasJSearchKey = Boolean(
      process.env.JSEARCH_API_KEY?.trim() ||
        process.env.RAPIDAPI_KEY?.trim() ||
        process.env.RAPID_API_KEY?.trim()
    );
    throw new Error(
      hasJSearchKey
        ? "No matching active Indeed postings were returned by the configured search sources."
        : "Indeed needs JSEARCH_API_KEY or RAPIDAPI_KEY; Brave Search found no structured active postings."
    );
  }
  return uniqueJobs(live).sort((a, b) => b.match_score - a.match_score);
}

export type { UserJobSearchProfile };
