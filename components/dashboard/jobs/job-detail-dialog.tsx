"use client";

import React from "react";
import { JobItem, PLATFORMS_CONFIG } from "@/types/job";
import { PlatformLogo } from "./platform-logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  Bookmark01Icon,
  ArrowUpRight01Icon,
  Location01Icon,
  Coins01Icon,
  Briefcase02Icon,
  Clock01Icon,
  SparklesIcon,
  Building02Icon,
} from "@hugeicons/core-free-icons";

interface JobDetailDialogProps {
  job: JobItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (jobId: string, currentSaved: boolean) => void;
}

export function JobDetailDialog({
  job,
  isOpen,
  onClose,
  onToggleSave,
}: JobDetailDialogProps) {
  if (!job) return null;

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#141416] border border-zinc-800 text-[#FAFAFA] p-0 overflow-hidden rounded-3xl sm:rounded-3xl shadow-2xl">
        {/* Header with platform accent */}
        <div className="relative p-6 sm:p-7 border-b border-zinc-800/80 bg-gradient-to-br from-[#18181B] via-[#16151e] to-[#12111d]">
          <div
            className="absolute -right-10 -top-10 size-48 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: platformConfig.accentColor }}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {job.company_logo ? (
                <div className="relative shrink-0">
                  <img
                    src={job.company_logo}
                    alt={job.company}
                    onError={(e) => {
                      // Fallback to initials if image fails
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    className="size-14 rounded-2xl object-cover bg-zinc-900 border border-zinc-800 p-1"
                  />
                  <div className="absolute -bottom-1 -right-1 ring-2 ring-[#18181B] rounded-full">
                    <PlatformLogo platform={job.platform} size="xs" />
                  </div>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div
                    className="size-14 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-inner"
                    style={{
                      backgroundColor: `${platformConfig.accentColor}15`,
                      color: platformConfig.accentColor,
                      borderColor: `${platformConfig.accentColor}30`,
                    }}
                  >
                    {getInitials(job.company)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 ring-2 ring-[#18181B] rounded-full">
                    <PlatformLogo platform={job.platform} size="xs" />
                  </div>
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-semibold px-2.5 py-0.5 border flex items-center gap-1.5 ${platformConfig.badgeBorder} ${platformConfig.badgeBg} ${platformConfig.badgeText}`}
                  >
                    <PlatformLogo platform={job.platform} size="xs" />
                    <span>{platformConfig.name}</span>
                  </Badge>

                  <Badge
                    className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                    {job.match_score}% AI Match
                  </Badge>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA]">
                  {job.title}
                </DialogTitle>

                <DialogDescription className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building02Icon} className="size-4 text-zinc-400" />
                  {job.company}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-zinc-400" />
                Location
              </span>
              <p className="font-semibold text-zinc-200 truncate">{job.location || "Remote"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <HugeiconsIcon icon={Coins01Icon} className="size-3.5 text-zinc-400" />
                Salary
              </span>
              <p className="font-semibold text-emerald-400 truncate">{job.salary || "Competitive"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5 text-zinc-400" />
                Job Type
              </span>
              <p className="font-semibold text-zinc-200 truncate">{job.job_type || "Full-time"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-zinc-400" />
                Experience
              </span>
              <p className="font-semibold text-zinc-200 truncate">{job.experience_level || "Mid Level"}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* Matched Skills & Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Key Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Role Overview
            </h4>
            <div className="text-sm text-zinc-300 leading-relaxed space-y-3 bg-[#18181B] p-4 rounded-2xl border border-zinc-800">
              <p>{job.description || "No full description snippet provided by the platform search index."}</p>
              <p className="text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                Click <strong>Apply on {platformConfig.name}</strong> to view the official company job listing, complete qualifications, and submit your application.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#18181B] border-t border-zinc-800 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onToggleSave(job.id, job.saved_status)}
            className={`border-zinc-700 h-10 px-4 text-xs font-medium rounded-xl gap-2 cursor-pointer ${
              job.saved_status
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <HugeiconsIcon
              icon={job.saved_status ? Bookmark02Icon : Bookmark01Icon}
              className="size-4 text-amber-400"
            />
            {job.saved_status ? "Saved in Bookmarks" : "Save Job"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              Close
            </Button>

            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 text-xs font-semibold h-10 px-5 rounded-xl transition-all"
            >
              <PlatformLogo platform={job.platform} size="xs" />
              <span>Apply on {platformConfig.name}</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
