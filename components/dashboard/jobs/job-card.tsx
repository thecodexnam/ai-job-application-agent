"use client";

import React from "react";
import { JobItem, PLATFORMS_CONFIG } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformLogo } from "./platform-logo";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  Bookmark02Icon,
  ArrowUpRight01Icon,
  EyeIcon,
  Location01Icon,
  Coins01Icon,
  Briefcase02Icon,
  Clock01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface JobCardProps {
  job: JobItem;
  onViewDetails: (job: JobItem) => void;
  onToggleSave: (jobId: string, currentSaved: boolean) => void;
  onApply?: (job: JobItem) => void;
}

export function JobCard({ job, onViewDetails, onToggleSave, onApply }: JobCardProps) {
  const platformConfig = PLATFORMS_CONFIG[job.platform] || PLATFORMS_CONFIG.greenhouse;

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <article className="group rounded-lg border border-[#1A1A1A]/15 bg-white p-4 sm:p-5 hover:border-[#1A1A1A]/35 transition-colors">
      <div className="space-y-3.5">
        {/* Top row: Logo, Company, Title, Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            {job.company_logo ? (
              <div className="relative shrink-0">
                <img
                  src={job.company_logo}
                  alt={job.company}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  className="size-11 rounded-lg border border-[#1A1A1A]/15 bg-white p-1 object-contain"
                />
                <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                  <PlatformLogo platform={job.platform} size="xs" />
                </div>
              </div>
            ) : (
              <div className="relative shrink-0">
                <div
                  className="flex size-11 items-center justify-center rounded-lg border border-[#1A1A1A]/15 text-sm font-bold"
                  style={{
                    backgroundColor: `${platformConfig.accentColor}20`,
                    color: "#171914",
                  }}
                >
                  {getInitials(job.company)}
                </div>
                <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                  <PlatformLogo platform={job.platform} size="xs" />
                </div>
              </div>
            )}

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate text-xs font-semibold text-[#5A5D55]">
                  {job.company}
                </span>

                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold border ${platformConfig.badgeBorder} ${platformConfig.badgeBg} ${platformConfig.badgeText}`}
                >
                  <PlatformLogo platform={job.platform} size="xs" />
                  <span>{platformConfig.name}</span>
                </Badge>
              </div>

              <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#171914]">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Match score & save toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold ${
                job.match_score >= 90
                  ? "bg-[#DDF19B] border border-[#9FB944] text-[#1B2710]"
                  : job.match_score >= 80
                  ? "bg-[#EEF2FF] border border-indigo-200 text-[#4338CA]"
                  : "bg-[#EDEBE0] border border-[#1A1A1A]/15 text-[#171914]"
              }`}
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-3" />
              <span>{job.match_score}% Match</span>
            </Badge>

            <button
              type="button"
              onClick={() => onToggleSave(job.id, job.saved_status)}
              title={job.saved_status ? "Remove from saved" : "Save job"}
              className={`flex size-8 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                job.saved_status
                  ? "border-[#9FB944] bg-[#DDF19B] text-[#1B2710]"
                  : "border-[#1A1A1A]/20 bg-white text-[#5A5D55] hover:bg-[#F2F0E8] hover:text-[#171914]"
              }`}
            >
              <HugeiconsIcon
                icon={job.saved_status ? Bookmark02Icon : Bookmark01Icon}
                className="size-4"
              />
            </button>
          </div>
        </div>

        {/* Role metadata pills */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#5A5D55]">
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-[#687064]" />
            <span className="text-[#171914]">{job.location || "Remote / Disclosed on site"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
            <HugeiconsIcon icon={Coins01Icon} className="size-3.5 text-emerald-700" />
            <span>{job.salary || "Salary on site"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5 text-[#687064]" />
            <span>{job.job_type || "Full-time"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-[#687064]" />
            <span>{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Recently active"}</span>
          </span>
        </div>

        {/* Description snippet */}
        {job.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[#5A5D55]">
            {job.description}
          </p>
        )}

        {/* Skill tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {job.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#1A1A1A]/10 bg-[#F7F6F0] px-2 py-0.5 text-[10px] font-medium text-[#171914]"
              >
                {tag}
              </span>
            ))}
            {job.tags.length > 6 && (
              <span className="text-[10px] text-[#687064] font-medium px-1">
                +{job.tags.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons: View Job, Apply Now, Save */}
      <div className="flex items-center justify-between gap-3 border-t border-[#1A1A1A]/10 pt-3 mt-3.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(job)}
          className="h-8.5 gap-1.5 rounded-md border border-[#1A1A1A]/20 bg-white px-3 text-xs font-semibold text-[#171914] hover:bg-[#F2F0E8] cursor-pointer"
        >
          <HugeiconsIcon icon={EyeIcon} className="size-3.5 text-[#687064]" />
          <span>View Details</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleSave(job.id, job.saved_status)}
            className={`h-8.5 gap-1.5 rounded-md border px-2.5 text-xs font-semibold cursor-pointer ${
              job.saved_status
                ? "bg-[#DDF19B] border-[#9FB944] text-[#1B2710]"
                : "bg-white border-[#1A1A1A]/20 text-[#5A5D55] hover:bg-[#F2F0E8] hover:text-[#171914]"
            }`}
          >
            <HugeiconsIcon
              icon={job.saved_status ? Bookmark02Icon : Bookmark01Icon}
              className={`size-3.5 ${job.saved_status ? "text-[#1B2710]" : "text-[#5A5D55]"}`}
            />
            <span>{job.saved_status ? "Saved" : "Save"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => (onApply ? onApply(job) : window.open(job.job_url, "_blank"))}
            className="h-8.5 gap-1.5 rounded-md border border-[#9FB944] bg-[#DDF19B] px-3.5 text-xs font-bold text-[#1B2710] hover:bg-[#CFEA78] transition-colors cursor-pointer"
          >
            <span>Open Job URL to Apply</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
