"use client";

import React from "react";
import { JobItem, PLATFORMS_CONFIG } from "@/types/job";
import { PlatformLogo } from "./platform-logo";
import {
  Dialog,
  DialogContent,
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
  onApply?: (job: JobItem) => void;
}

export function JobDetailDialog({
  job,
  isOpen,
  onClose,
  onToggleSave,
  onApply,
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden rounded-lg border border-[#1A1A1A]/20 bg-[#F7F6F0] p-0 text-[#171914] shadow-xl">
        {/* Header with platform accent */}
        <div className="border-b border-[#1A1A1A]/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {job.company_logo ? (
                <div className="relative shrink-0">
                  <img
                    src={job.company_logo}
                    alt={job.company}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    className="size-12 rounded-lg border border-[#1A1A1A]/15 bg-white p-1 object-contain"
                  />
                  <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                    <PlatformLogo platform={job.platform} size="xs" />
                  </div>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div
                    className="flex size-12 items-center justify-center rounded-lg border border-[#1A1A1A]/15 text-base font-bold"
                    style={{
                      backgroundColor: `${platformConfig.accentColor}20`,
                      color: "#0F0F0F",
                    }}
                  >
                    {getInitials(job.company)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                    <PlatformLogo platform={job.platform} size="xs" />
                  </div>
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold px-2.5 py-0.5 border flex items-center gap-1.5 ${platformConfig.badgeBorder} ${platformConfig.badgeBg} ${platformConfig.badgeText}`}
                  >
                    <PlatformLogo platform={job.platform} size="xs" />
                    <span>{platformConfig.name}</span>
                  </Badge>

                  <Badge className="flex items-center gap-1 rounded-sm border border-emerald-700/20 bg-emerald-50 text-[10px] font-semibold text-emerald-900">
                    <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                    {job.match_score}% match
                  </Badge>
                </div>

                <DialogTitle
                  className="text-lg font-bold leading-snug text-[#171914] sm:text-xl"
                >
                  {job.title}
                </DialogTitle>

                <DialogDescription className="flex items-center gap-1.5 text-xs font-semibold text-[#53564F]">
                  <HugeiconsIcon icon={Building02Icon} className="size-4 text-[#5A5A5A]" />
                  {job.company}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick metadata grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#1A1A1A]/10 pt-4 text-xs sm:grid-cols-3">
            <div className="space-y-1">
              <span className="text-[11px] text-[#5A5A5A] font-medium flex items-center gap-1">
                <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-[#5A5A5A]" />
                Location
              </span>
              <p className="truncate font-semibold text-[#171914]">{job.location || "Not disclosed"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#5A5A5A] font-medium flex items-center gap-1">
                <HugeiconsIcon icon={Coins01Icon} className="size-3.5 text-[#5A5A5A]" />
                Salary
              </span>
              <p className="truncate font-semibold text-[#171914]">{job.salary || "Not disclosed"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#5A5A5A] font-medium flex items-center gap-1">
                <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5 text-[#5A5A5A]" />
                Job Type
              </span>
              <p className="truncate font-semibold text-[#171914]">{job.job_type || "Not disclosed"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#5A5A5A] font-medium flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-[#5A5A5A]" />
                Experience
              </span>
              <p className="truncate font-semibold text-[#171914]">{job.experience_level || "Not disclosed"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-[#5A5A5A]">Date Posted</span>
              <p className="truncate font-semibold text-[#171914]">
                {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Not disclosed"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="max-h-[52vh] space-y-5 overflow-y-auto bg-[#F7F6F0] p-5 sm:p-6">
          {/* Matched Skills & Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase text-[#687064]">
                Key Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-[#1A1A1A]/10 bg-white px-2 py-1 text-[10px] font-medium text-[#383B35]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase text-[#687064]">
              Role Overview
            </h4>
            <div className="whitespace-pre-line text-sm leading-relaxed text-[#30332D]">
              {job.description || "Description not provided by the source."}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-[#1A1A1A]/10 bg-white p-4 sm:px-5">
          <Button
            variant="outline"
            onClick={() => onToggleSave(job.id, job.saved_status)}
            className={`h-9 gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${
              job.saved_status
                ? "border-[#B0CC58] bg-[#F3F8E2] text-[#26320E]"
                : "border-[#1A1A1A]/20 bg-white text-[#30332D] hover:bg-[#F2F0E8]"
            }`}
          >
            <HugeiconsIcon
              icon={job.saved_status ? Bookmark02Icon : Bookmark01Icon}
              className="size-4 text-[#0F0F0F]"
            />
            {job.saved_status ? "Saved in Bookmarks" : "Save Job"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-9 rounded-md px-3 text-xs font-medium text-[#53564F] hover:bg-[#F2F0E8] hover:text-[#171914]"
            >
              Close
            </Button>

            <Button
              onClick={() => {
                onClose();
                if (onApply) onApply(job);
                else window.open(job.job_url, "_blank");
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#9FB944] bg-[#DDF19B] px-3.5 text-xs font-bold text-[#1B2710] hover:bg-[#CFEA78] cursor-pointer"
            >
              <PlatformLogo platform={job.platform} size="xs" />
              <span>Open Job URL to Apply</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
