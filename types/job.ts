export type JobPlatform = "greenhouse" | "lever" | "workable" | "wellfound";

export interface JobItem {
  id: string;
  user_id: string;
  platform: JobPlatform;
  title: string;
  company: string;
  company_logo?: string | null;
  location?: string | null;
  salary?: string | null;
  job_type: string;
  experience_level: string;
  description?: string | null;
  tags: string[];
  match_score: number;
  job_url: string;
  source_url?: string | null;
  application_status: string;
  saved_status: boolean;
  fetched_at: string;
  created_at: string;
}

export interface PlatformConfig {
  id: JobPlatform;
  name: string;
  domain: string;
  siteQuery: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconBg: string;
  accentColor: string;
  description: string;
  logoUrl: string;
}

export const PLATFORMS_CONFIG: Record<JobPlatform, PlatformConfig> = {
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse",
    domain: "greenhouse.io",
    siteQuery: "site:boards.greenhouse.io OR site:greenhouse.io/jobs",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/25",
    badgeText: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    accentColor: "#10B981",
    description: "Top modern tech companies & startups hiring directly via Greenhouse boards.",
    logoUrl: "/platforms/greenhouse.svg",
  },
  lever: {
    id: "lever",
    name: "Lever",
    domain: "lever.co",
    siteQuery: "site:jobs.lever.co OR site:lever.co/jobs",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/25",
    badgeText: "text-blue-400",
    iconBg: "bg-blue-500/20",
    accentColor: "#3B82F6",
    description: "High-growth software teams and innovators using Lever ATS.",
    logoUrl: "/platforms/lever.svg",
  },
  workable: {
    id: "workable",
    name: "Workable",
    domain: "workable.com",
    siteQuery: "site:apply.workable.com OR site:workable.com/jobs",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/25",
    badgeText: "text-teal-400",
    iconBg: "bg-teal-500/20",
    accentColor: "#14B8A6",
    description: "Global enterprise and remote opportunities posted on Workable.",
    logoUrl: "/platforms/workable.svg",
  },
  wellfound: {
    id: "wellfound",
    name: "Wellfound",
    domain: "wellfound.com",
    siteQuery: "site:wellfound.com/jobs",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/25",
    badgeText: "text-rose-400",
    iconBg: "bg-rose-500/20",
    accentColor: "#F43F5E",
    description: "Venture-backed startups, early-stage equity roles & tech teams.",
    logoUrl: "/platforms/wellfound.svg",
  },
};
