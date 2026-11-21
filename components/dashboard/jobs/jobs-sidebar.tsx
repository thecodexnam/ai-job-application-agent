"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Bookmark02Icon,
  Clock01Icon,
  UserIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { getCompletenessLevel } from "@/lib/profile-completeness";

interface JobsSidebarProps {
  completeness: number;
  savedCount: number;
  lastFetchedAt?: string | null;
  loadedCount: number;
  visibleCount: number;
  isCached: boolean;
}

export function JobsSidebar({
  completeness,
  savedCount,
  lastFetchedAt,
  loadedCount,
  visibleCount,
  isCached,
}: JobsSidebarProps) {
  const tier = getCompletenessLevel(completeness);

  return (
    <aside className="space-y-4">
      {/* Profile Readiness Card */}
      <div className="rounded-lg border border-[#1A1A1A]/15 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#E9F2D1] text-[#304019] border border-[#1A1A1A]/10">
              <HugeiconsIcon icon={UserIcon} className="size-3.5" />
            </span>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#171914]">
              Profile Readiness
            </h2>
          </div>
          <span className="text-xs font-bold text-[#171914] bg-[#F2F0E8] px-2 py-0.5 rounded border border-[#1A1A1A]/15">
            {completeness}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Profile completeness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completeness}
          className="h-2 w-full overflow-hidden rounded-full bg-[#E7E5DC]"
        >
          <div
            className="h-full bg-[#7B9E32] transition-all duration-500 rounded-full"
            style={{ width: `${completeness}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="font-medium text-[#5A5D55] text-[11px]">{tier.label}</span>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#171914] hover:underline"
          >
            <span>Edit Profile</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
          </Link>
        </div>
      </div>

      {/* Search Snapshot Card */}
      <div className="rounded-lg border border-[#1A1A1A]/15 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1A1A1A]/10">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#F2F0E8] text-[#171914]">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#171914]">
            Search Snapshot
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="p-3 rounded-md border border-[#1A1A1A]/10 bg-[#F7F6F0]">
            <span className="text-[10px] font-semibold uppercase text-[#687064] block">Loaded Roles</span>
            <span className="text-2xl font-bold text-[#171914] tabular-nums">
              {loadedCount}
            </span>
          </div>

          <div className="p-3 rounded-md border border-[#1A1A1A]/10 bg-[#F7F6F0]">
            <span className="text-[10px] font-semibold uppercase text-[#687064] block flex items-center gap-1">
              <HugeiconsIcon icon={Bookmark02Icon} className="size-2.5 text-[#171914]" /> Saved
            </span>
            <span className="text-2xl font-bold text-[#171914] tabular-nums">
              {savedCount}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-[#1A1A1A]/10 text-[10px] text-[#5A5D55] font-medium">
          <p className="flex items-center justify-between">
            <span>Filtered View:</span>
            <span className="font-semibold text-[#171914]">{visibleCount} roles</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Source Status:</span>
            <span className="font-semibold text-emerald-800">
              {isCached ? "Verified Cache" : "Live Fetched"}
            </span>
          </p>
          {lastFetchedAt && (
            <p className="text-[9px] text-[#687064] truncate pt-0.5">
              Updated: {new Date(lastFetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Pro Matching Tip Card */}
      <div className="rounded-lg border border-[#9FB944]/40 bg-[#F3F8E2] p-4 space-y-1.5 text-[#26320E]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B2710]">
          <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-[#7B9E32]" />
          <span>Match Score Algorithm</span>
        </div>
        <p className="text-[11px] text-[#3A4A20] leading-relaxed">
          Matches are computed by comparing job skills and title keywords against your Candidate Profile and uploaded master resume.
        </p>
      </div>
    </aside>
  );
}
