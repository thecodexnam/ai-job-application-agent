// ==============================================================================
// lib/application/platform-detector.ts
// Intelligent platform detection utility for JobBuddy AI
// ==============================================================================

import { JobPlatform } from "./types";

export interface PlatformDetectionResult {
  platform: JobPlatform;
  displayName: string;
  confidence: number;
  matchedHost?: string;
  identifier?: string;
  isSupported: boolean;
}

/**
 * Detects the ATS / job platform from an application URL.
 * Supports Greenhouse, Lever, Workable, Wellfound, Ashby, and generic job pages.
 */
export function detectJobPlatform(jobUrl: string | null): PlatformDetectionResult {
  if (!jobUrl || typeof jobUrl !== "string") {
    return {
      platform: "generic",
      displayName: "External Job Site",
      confidence: 0,
      isSupported: false,
    };
  }

  const rawUrl = jobUrl.trim();
  const cleanUrl = rawUrl.toLowerCase();
  const rawWithProtocol = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;

  try {
    const urlObj = new URL(rawWithProtocol);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // 1. Greenhouse Detection
    // e.g., boards.greenhouse.io/<company>/jobs/<id>, greenhouse.io, gh_jid= parameter
    if (
      hostname.includes("greenhouse.io") ||
      hostname.includes("boards.greenhouse.io") ||
      searchParams.has("gh_jid") ||
      cleanUrl.includes("gh_jid")
    ) {
      const match = pathname.match(/\/jobs\/(\d+)/i) || searchParams.get("gh_jid");
      return {
        platform: "greenhouse",
        displayName: "Greenhouse",
        confidence: 0.99,
        matchedHost: hostname,
        identifier: Array.isArray(match) ? match[1] : match || undefined,
        isSupported: true,
      };
    }

    // 2. Lever Detection
    // e.g., jobs.lever.co/<company>/<uuid>
    if (hostname.includes("lever.co") || hostname.includes("jobs.lever.co")) {
      const parts = pathname.split("/").filter(Boolean);
      return {
        platform: "lever",
        displayName: "Lever",
        confidence: 0.99,
        matchedHost: hostname,
        identifier: parts.length >= 2 ? parts[1] : undefined,
        isSupported: true,
      };
    }

    // 3. Workable Detection
    // e.g., apply.workable.com/<company>/j/<id>
    if (hostname.includes("workable.com") || hostname.includes("apply.workable.com")) {
      const parts = pathname.split("/").filter(Boolean);
      const jIndex = parts.indexOf("j");
      return {
        platform: "workable",
        displayName: "Workable",
        confidence: 0.98,
        matchedHost: hostname,
        identifier: jIndex !== -1 && parts[jIndex + 1] ? parts[jIndex + 1] : undefined,
        isSupported: true,
      };
    }

    // 4. Wellfound (AngelList) Detection
    // e.g., wellfound.com/jobs/..., angel.co/...
    if (
      hostname.includes("wellfound.com") ||
      hostname.includes("angel.co")
    ) {
      return {
        platform: "wellfound",
        displayName: "Wellfound",
        confidence: 0.95,
        matchedHost: hostname,
        isSupported: true,
      };
    }

    // 5. Ashby Detection
    // e.g., jobs.ashbyhq.com/<company>/<id>
    if (hostname.includes("ashbyhq.com")) {
      return {
        platform: "ashby",
        displayName: "Ashby",
        confidence: 0.95,
        matchedHost: hostname,
        isSupported: true,
      };
    }

    // Generic / Fallback
    return {
      platform: "generic",
      displayName: "External Webpage",
      confidence: 0.5,
      matchedHost: hostname,
      isSupported: true,
    };
  } catch {
    // If URL parsing fails, check string matches
    if (cleanUrl.includes("greenhouse")) {
      return { platform: "greenhouse", displayName: "Greenhouse", confidence: 0.8, isSupported: true };
    }
    if (cleanUrl.includes("lever")) {
      return { platform: "lever", displayName: "Lever", confidence: 0.8, isSupported: true };
    }
    if (cleanUrl.includes("workable")) {
      return { platform: "workable", displayName: "Workable", confidence: 0.8, isSupported: true };
    }
    if (cleanUrl.includes("wellfound") || cleanUrl.includes("angel.co")) {
      return { platform: "wellfound", displayName: "Wellfound", confidence: 0.8, isSupported: true };
    }

    return {
      platform: "generic",
      displayName: "External Webpage",
      confidence: 0.3,
      isSupported: false,
    };
  }
}

/**
 * Refines URL detection using the loaded page hostname and HTML markers.
 */
export function detectJobPlatformFromPage(
  pageUrl: string,
  pageHtml?: string
): PlatformDetectionResult {
  const fromUrl = detectJobPlatform(pageUrl);
  if (fromUrl.platform !== "generic") {
    return fromUrl;
  }

  const html = (pageHtml || "").toLowerCase();
  if (html.includes("greenhouse") || html.includes("grnhse_app") || html.includes("boards.greenhouse")) {
    return {
      platform: "greenhouse",
      displayName: "Greenhouse",
      confidence: 0.85,
      isSupported: true,
    };
  }
  if (html.includes("lever-apply") || html.includes("jobs.lever.co")) {
    return {
      platform: "lever",
      displayName: "Lever",
      confidence: 0.85,
      isSupported: true,
    };
  }
  if (html.includes("workable") || html.includes("apply.workable")) {
    return {
      platform: "workable",
      displayName: "Workable",
      confidence: 0.85,
      isSupported: true,
    };
  }
  if (html.includes("ashbyhq") || html.includes("ashby")) {
    return {
      platform: "ashby",
      displayName: "Ashby",
      confidence: 0.8,
      isSupported: true,
    };
  }
  if (html.includes("wellfound") || html.includes("angel.co")) {
    return {
      platform: "wellfound",
      displayName: "Wellfound",
      confidence: 0.8,
      isSupported: true,
    };
  }

  return fromUrl;
}
