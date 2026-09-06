"use client";

import React from "react";
import { JobItem, PLATFORMS_CONFIG } from "@/types/job";
import { PlatformLogo } from "./platform-logo";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  Bookmark02Icon,
  Location01Icon,
  Coins01Icon,
  Briefcase02Icon,
  Clock01Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";

interface JobCardProps {
  job: JobItem;
  onViewDetails: (job: JobItem) => void;
  onToggleSave: (jobId: string, currentSaved: boolean) => void;
}

export function JobCard({ job, onViewDetails, onToggleSave }: JobCardProps) {
  const platformConfig = PLATFORMS_CONFIG[job.platform] || PLATFORMS_CONFIG.greenhouse;

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatPostedTime = (dateString?: string) => {
    if (!dateString) return "Posted recently";
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Posted just now";
      if (diffMins < 60) return `Posted ${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Posted ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Posted yesterday";
      return `Posted ${diffDays} days ago`;
    } catch {
      return "Posted recently";
    }
  };

  // Match score info — using app's purple/indigo theme
  const getMatchInfo = (score: number) => {
    if (score >= 85) {
      return {
        label: "Top match",
        textColor: "text-violet-400",
        barGradient: "bg-gradient-to-r from-violet-500 to-purple-500",
      };
    }
    if (score >= 75) {
      return {
        label: "Great match",
        textColor: "text-indigo-400",
        barGradient: "bg-gradient-to-r from-indigo-500 to-violet-500",
      };
    }
    if (score >= 60) {
      return {
        label: "Potential match",
        textColor: "text-purple-400",
        barGradient: "bg-gradient-to-r from-purple-500 to-indigo-400",
      };
    }
    return {
      label: "Fair match",
      textColor: "text-zinc-400",
      barGradient: "bg-zinc-600",
    };
  };

  const matchInfo = getMatchInfo(job.match_score);

  return (
    <div className="group relative bg-[#18181B] hover:bg-[#1a1924] border border-zinc-800/80 hover:border-purple-500/20 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-purple-500/5">
      {/* Subtle top accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">

        {/* ==================================================================== */}
        {/* LEFT SECTION: Company Logo + Job Details & Metadata                  */}
        {/* ==================================================================== */}
        <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">

          {/* Company Logo Box */}
          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="size-16 sm:size-[72px] rounded-2xl bg-zinc-900/90 border border-zinc-800 group-hover:border-zinc-700 p-2 flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:border-purple-500/30 transition-colors"
          >
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
                className="size-full object-contain rounded-xl"
              />
            ) : (
              <div
                className="size-full rounded-xl flex items-center justify-center font-bold text-base border"
                style={{
                  backgroundColor: `${platformConfig.accentColor}15`,
                  color: platformConfig.accentColor,
                  borderColor: `${platformConfig.accentColor}30`,
                }}
              >
                {getInitials(job.company)}
              </div>
            )}
          </button>

          {/* Details */}
          <div className="space-y-2 min-w-0 flex-1">
            {/* Company + Platform badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-violet-400 tracking-tight">
                {job.company}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 text-[11px] font-medium text-zinc-300">
                <PlatformLogo platform={job.platform} size="xs" />
                <span>{platformConfig.name}</span>
              </span>
            </div>

            {/* Job Title */}
            <h3
              onClick={() => onViewDetails(job)}
              className="text-base sm:text-lg font-bold text-[#FAFAFA] tracking-tight hover:text-violet-300 transition-colors cursor-pointer line-clamp-1"
            >
              {job.title}
            </h3>

            {/* Metadata row */}
            <div className="flex items-center gap-3.5 sm:gap-4 text-xs text-zinc-400 flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Wifi01Icon} className="size-3.5 text-zinc-500 shrink-0" />
                <span>{job.job_type || "On-site"}</span>
              </span>

              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5 text-zinc-500 shrink-0" />
                <span>{job.experience_level || "Mid-level"}</span>
              </span>

              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-zinc-500 shrink-0" />
                <span>{job.location || "Remote"}</span>
              </span>

              {job.salary && (
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <HugeiconsIcon icon={Coins01Icon} className="size-3.5 shrink-0" />
                  <span>{job.salary}</span>
                </span>
              )}
            </div>

            {/* Skill Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {job.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:border-zinc-700/80 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
                {job.tags.length > 4 && (
                  <span className="text-[11px] text-zinc-500 font-medium pl-1">
                    +{job.tags.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT SECTION: Match Score + Action Buttons                          */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center justify-between lg:justify-end gap-5 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">

          {/* Match Score Block */}
          <div className="space-y-1.5 shrink-0 min-w-[150px]">
            <div className={`text-sm sm:text-base font-bold ${matchInfo.textColor}`}>
              {job.match_score}% Match
            </div>

            {/* Progress bar */}
            <div className="w-36 sm:w-40 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${matchInfo.barGradient}`}
                style={{ width: `${Math.min(100, Math.max(8, job.match_score))}%` }}
              />
            </div>

            <div className={`text-xs font-semibold ${matchInfo.textColor}`}>
              {matchInfo.label}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-0.5">
              <HugeiconsIcon icon={Clock01Icon} className="size-3 shrink-0" />
              <span>{formatPostedTime(job.fetched_at || job.created_at)}</span>
            </div>
          </div>

          {/* Action Buttons: Apply Now (purple) + Save */}
          <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0">
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial w-full sm:w-36 h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-center select-none"
            >
              <span>Apply Now</span>
            </a>

            <button
              type="button"
              onClick={() => onToggleSave(job.id, job.saved_status)}
              className={`flex-1 sm:flex-initial w-full sm:w-36 h-10 px-5 rounded-xl border font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                job.saved_status
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <HugeiconsIcon
                icon={job.saved_status ? Bookmark02Icon : Bookmark01Icon}
                className={`size-4 ${job.saved_status ? "text-amber-400" : "text-zinc-400"}`}
              />
              <span>{job.saved_status ? "Saved" : "Save"}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
