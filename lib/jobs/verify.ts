const REQUEST_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 64_000;
const CONCURRENCY = 8;
const REMOTIVE_FEED_FRESH_MS = 45 * 60 * 1000;

interface LiveJobCandidate {
  job_url: string;
  platform?: string;
  fetched_at?: string | null;
}

const CLOSED_SIGNALS = [
  "this job is no longer available",
  "this position is no longer available",
  "this job is no longer accepting applications",
  "no longer accepting applications",
  "this job has expired",
  "this position has been filled",
  "this job has been filled",
  "job posting has been closed",
  "this posting is closed",
];

function isPublicWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      (url.port && url.port !== "80" && url.port !== "443") ||
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.includes(":")
    ) {
      return false;
    }

    const octets = host.split(".").map(Number);
    if (octets.length === 4 && octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)) {
      const [first, second] = octets;
      if (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function readBodyPrefix(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (bytesRead < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = MAX_BODY_BYTES - bytesRead;
      const chunk = value.subarray(0, remaining);
      chunks.push(chunk);
      bytesRead += chunk.byteLength;
      if (chunk.byteLength < value.byteLength) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body).toLowerCase();
}

async function isLivePosting(
  value: string,
  platform?: string,
  fetchedAt?: string | null
): Promise<boolean> {
  const fetchedAtMs = fetchedAt ? Date.parse(fetchedAt) : NaN;
  const feedAge = Date.now() - fetchedAtMs;
  if (
    platform === "remotive" &&
    Number.isFinite(fetchedAtMs) &&
    feedAge >= -60_000 &&
    feedAge <= REMOTIVE_FEED_FRESH_MS
  ) {
    return true;
  }
  if (!isPublicWebUrl(value)) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let currentUrl = value;
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      if (!isPublicWebUrl(currentUrl)) return false;
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          Range: `bytes=0-${MAX_BODY_BYTES - 1}`,
          "User-Agent": "JobBuddyAI/1.0 (live job verification)",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_REDIRECTS) return false;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      if (!response.ok) return false;

      const body = await readBodyPrefix(response);
      return !CLOSED_SIGNALS.some((signal) => body.includes(signal));
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function verifyLiveJobPosting(jobUrl: string): Promise<boolean> {
  return isLivePosting(jobUrl);
}

export async function filterLiveJobs<T extends LiveJobCandidate>(jobs: T[]): Promise<T[]> {
  const verified: T[] = [];
  for (let index = 0; index < jobs.length; index += CONCURRENCY) {
    const batch = jobs.slice(index, index + CONCURRENCY);
    const results = await Promise.all(
      batch.map((job) => isLivePosting(job.job_url, job.platform, job.fetched_at))
    );
    batch.forEach((job, batchIndex) => {
      if (results[batchIndex]) verified.push(job);
    });
  }
  return verified;
}