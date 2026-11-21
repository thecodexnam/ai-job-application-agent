import { JobPlatform } from "@/types/job";

export const UNDISCLOSED_SALARY = "Not Disclosed";

const COMPANY_SLUG_OVERRIDES: Record<string, string> = {
  mongodb: "MongoDB",
  github: "GitHub",
  gitlab: "GitLab",
  linkedin: "LinkedIn",
  paypal: "PayPal",
  pinterest: "Pinterest",
  tripadvisor: "Tripadvisor",
  nytimes: "The New York Times",
  nyt: "The New York Times",
  bmwgroup: "BMW Group",
  jpmorganchase: "JPMorgan Chase",
  goldmansachs: "Goldman Sachs",
  morganstanley: "Morgan Stanley",
  wellsfargo: "Wells Fargo",
  capitalone: "Capital One",
  americanexpress: "American Express",
  mcdonalds: "McDonald's",
  walmart: "Walmart",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  anthropic: "Anthropic",
  huggingface: "Hugging Face",
  databricks: "Databricks",
  elasticsearch: "Elastic",
  elastic: "Elastic",
  cloudflare: "Cloudflare",
  hashicorp: "HashiCorp",
  digitalocean: "DigitalOcean",
  duckduckgo: "DuckDuckGo",
  mozilla: "Mozilla",
  reddit: "Reddit",
  discord: "Discord",
  figma: "Figma",
  notion: "Notion",
  airbnb: "Airbnb",
  doordash: "DoorDash",
  instacart: "Instacart",
  robinhood: "Robinhood",
  coinbase: "Coinbase",
  stripe: "Stripe",
  twilio: "Twilio",
  snowflake: "Snowflake",
  datadog: "Datadog",
  palantir: "Palantir",
  duolingo: "Duolingo",
  grammarly: "Grammarly",
  calendly: "Calendly",
  webflow: "Webflow",
  zapier: "Zapier",
  rover: "Rover",
  postman: "Postman",
  canva: "Canva",
  shopify: "Shopify",
  hubspot: "HubSpot",
  intercom: "Intercom",
  asana: "Asana",
  airtable: "Airtable",
  mixpanel: "Mixpanel",
  amplitude: "Amplitude",
  sentry: "Sentry",
  pagerduty: "PagerDuty",
  braze: "Braze",
  iterable: "Iterable",
  coursera: "Coursera",
  khanacademy: "Khan Academy",
  etsy: "Etsy",
  zillow: "Zillow",
  twitch: "Twitch",
  lyft: "Lyft",
  rivian: "Rivian",
  wayfair: "Wayfair",
  dropbox: "Dropbox",
  boxinc: "Box",
  wealthsimple: "Wealthsimple",
  affirm: "Affirm",
  brex: "Brex",
  ramp: "Ramp",
  mercury: "Mercury",
  loom: "Loom",
  rippling: "Rippling",
};

const INVALID_COMPANY_EXACT = new Set(
  [
    "tech company",
    "hiring partner",
    "company",
    "employer",
    "careers",
    "jobs",
    "job",
    "greenhouse",
    "lever",
    "workable",
    "wellfound",
    "indeed",
    "angellist",
    "remote",
    "hybrid",
    "full time",
    "full-time",
    "contract",
    "php",
    "react",
    "python",
    "java",
    "javascript",
    "typescript",
    "node",
    "nodejs",
    "node.js",
    "ruby",
    "golang",
    "go",
    "rust",
    "kotlin",
    "swift",
    "sql",
    "html",
    "css",
    "aws",
    "azure",
    "gcp",
    "devops",
    "backend",
    "frontend",
    "fullstack",
    "full stack",
  ].map((s) => s.toLowerCase())
);

const LOCATIONISH_COMPANY =
  /^(remote|hybrid|worldwide|global|united states|usa|uk|india|canada|germany|netherlands|australia)([,\s].*)?$/i;

const CITY_STATE = /^[A-Za-z .'-]+,\s*([A-Z]{2}|[A-Za-z .'-]+)$/;

const JOB_TITLE_HINT =
  /developer|engineer|designer|manager|architect|analyst|scientist|consultant|specialist|intern|coordinator|director|lead|staff|principal|product|marketing|sales|recruiter|accountant|nurse|teacher/i;

export function cleanHtmlText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatCompanyFromSlug(slug: string): string {
  const key = slug.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (COMPANY_SLUG_OVERRIDES[key]) return COMPANY_SLUG_OVERRIDES[key];
  const collapsed = key.replace(/-/g, "");
  if (COMPANY_SLUG_OVERRIDES[collapsed]) return COMPANY_SLUG_OVERRIDES[collapsed];

  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function isInvalidCompanyName(name: string | null | undefined): boolean {
  if (!name) return true;
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (trimmed.length < 2 || trimmed.length > 80) return true;

  const lower = trimmed.toLowerCase();
  if (INVALID_COMPANY_EXACT.has(lower)) return true;
  if (LOCATIONISH_COMPANY.test(trimmed)) return true;
  if (CITY_STATE.test(trimmed)) return true;
  if (/hiring partner/i.test(trimmed)) return true;
  if (/^tech company$/i.test(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (JOB_TITLE_HINT.test(trimmed) && trimmed.split(/\s+/).length <= 4) {
    // "Senior Software Engineer" is a title, not a company
    if (!/inc\.?|llc|ltd|corp|labs|studio|systems|technologies|software$/i.test(trimmed)) {
      return true;
    }
  }
  return false;
}

export function extractSalaryFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const source = text.replace(/\u00a0/g, " ");

  const patterns = [
    /\$\s*[\d,]+k?\s*[-–—to]+\s*\$?\s*[\d,]+k?(\s*\/\s*(yr|year|hr|hour|mo|month))?/i,
    /[€£]\s*[\d,]+k?\s*[-–—to]+\s*[€£]?\s*[\d,]+k?/i,
    /(₹|rs\.?|inr)\s*[\d,.]+\s*[-–—to]+\s*(₹|rs\.?|inr)?\s*[\d,.]+\s*(lpa|lakhs?|cr)?/i,
    /[\d.]+\s*[-–—to]+\s*[\d.]+\s*lpa/i,
    /\$\s*[\d,]{5,7}(\s*\/\s*(yr|year))?/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[0]) return match[0].replace(/\s+/g, " ").trim();
  }
  return null;
}

export function normalizePostedAt(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const timestamp =
    typeof value === "number"
      ? value < 1_000_000_000_000
        ? value * 1000
        : value
      : Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function formatStructuredSalary(input: {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  period?: string | null;
  display?: string | null;
}): string | null {
  if (input.display && extractSalaryFromText(input.display)) {
    return input.display.trim();
  }

  const currency = (input.currency || "USD").toUpperCase();
  const symbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;

  const min = typeof input.min === "number" && input.min > 0 ? input.min : null;
  const max = typeof input.max === "number" && input.max > 0 ? input.max : null;
  if (!min && !max) return null;

  const period = (input.period || "").toLowerCase();
  const suffix = period.includes("hour")
    ? " / hr"
    : period.includes("month")
      ? " / mo"
      : period.includes("year") || period.includes("annual") || period.includes("yr")
        ? " / yr"
        : "";

  if (min && max && min !== max) {
    return `${symbol}${Math.round(min).toLocaleString()} - ${symbol}${Math.round(max).toLocaleString()}${suffix}`;
  }
  return `${symbol}${Math.round((min || max) as number).toLocaleString()}${suffix}`;
}

export function inferExperienceLevel(title: string, description: string): string {
  const combined = `${title} ${description}`.toLowerCase();
  if (/\b(intern|internship|junior|entry[- ]level|associate|graduate)\b/.test(combined)) {
    return "Entry Level";
  }
  if (/\b(staff|principal|director|architect|head of)\b/.test(combined)) {
    return "Lead / Staff";
  }
  if (/\b(senior|sr\.|lead)\b/.test(combined)) {
    return "Senior";
  }
  return "Mid Level";
}

export function inferJobType(title: string, description: string, structured?: string | null): string {
  if (structured && structured.trim()) {
    const normalized = structured.toLowerCase();
    if (normalized.includes("part")) return "Part-time";
    if (normalized.includes("contract") || normalized.includes("temp")) return "Contract";
    if (normalized.includes("intern")) return "Internship";
    if (normalized.includes("full")) return "Full-time";
  }

  const combined = `${title} ${description}`.toLowerCase();
  if (/\bpart[- ]time\b/.test(combined)) return "Part-time";
  if (/\b(contract|freelance|contractor)\b/.test(combined)) return "Contract";
  if (/\bintern(ship)?\b/.test(combined)) return "Internship";
  return "Full-time";
}

export function parseJobLocation(
  title: string,
  snippet: string,
  structuredLocation?: string | null
): string {
  const structured = (structuredLocation || "").replace(/\s+/g, " ").trim();
  if (structured && structured.toLowerCase() !== "n/a") {
    return structured;
  }

  const combined = `${title} ${snippet}`.toLowerCase();
  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(combined)) {
    return "Remote";
  }
  if (/\bhybrid\b/.test(combined)) {
    return "Hybrid";
  }
  return "Not Disclosed";
}

export interface AtsIdentity {
  platform: "greenhouse" | "lever" | "workable";
  boardToken: string;
  jobId: string;
}

export function parseAtsIdentity(url: string): AtsIdentity | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (host.includes("greenhouse.io")) {
      const jobsIdx = segments.findIndex((s) => s === "jobs" || s === "job_postings");
      if (jobsIdx > 0 && segments[jobsIdx + 1] && /^\d+$/.test(segments[jobsIdx + 1])) {
        return {
          platform: "greenhouse",
          boardToken: decodeURIComponent(segments[jobsIdx - 1]),
          jobId: segments[jobsIdx + 1].split("#")[0],
        };
      }
      const ghJid = parsed.searchParams.get("gh_jid") || parsed.searchParams.get("token");
      if (ghJid && segments[0]) {
        return {
          platform: "greenhouse",
          boardToken: decodeURIComponent(segments[0]),
          jobId: ghJid,
        };
      }
      return null;
    }

    if (host.includes("lever.co")) {
      if (segments.length >= 2 && /[0-9a-f-]{12,}/i.test(segments[1])) {
        return {
          platform: "lever",
          boardToken: decodeURIComponent(segments[0]),
          jobId: segments[1].split("?")[0],
        };
      }
      return null;
    }

    if (host.includes("workable.com")) {
      const jIndex = segments.findIndex((s) => s === "j");
      if (jIndex > 0 && segments[jIndex + 1]) {
        return {
          platform: "workable",
          boardToken: decodeURIComponent(segments[0]),
          jobId: segments[jIndex + 1],
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function detectPlatformFromUrl(url: string): JobPlatform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("greenhouse.io")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("workable.com")) return "workable";
    if (host.includes("wellfound.com") || host.includes("angel.co")) return "wellfound";
    if (host.includes("indeed.com")) return "indeed";
    if (host.includes("remotive.com")) return "remotive";
    if (host.includes("arbeitnow.com")) return "arbeitnow";
    return null;
  } catch {
    return null;
  }
}

export function excerptDescription(text: string, max = 900): string {
  const cleaned = cleanHtmlText(text);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trim()}…`;
}

export function isLikelyGeneratedDescription(description: string | null | undefined): boolean {
  if (!description) return true;
  const cleaned = cleanHtmlText(description);
  const firstSentence = cleaned.split(/[.!?]/, 1)[0] || "";
  return cleaned.length < 300 && /\brole at\b/i.test(firstSentence);
}

export function isLikelyDeadOrSpam(title: string, description: string): boolean {
  const combined = `${title} ${description}`.toLowerCase();
  const deadSignals = [
    "(closed)",
    "[closed]",
    "closed:",
    "position closed",
    "job closed",
    "(expired)",
    "[expired]",
    "expired:",
    "job expired",
    "(archived)",
    "[archived]",
    "no longer accepting applications",
    "position has been filled",
    "this opening has been filled",
    "how to become a",
    "salary for",
    "interview questions for",
    "job description template",
    "reviews and salaries",
  ];
  return deadSignals.some((signal) => combined.includes(signal));
}
