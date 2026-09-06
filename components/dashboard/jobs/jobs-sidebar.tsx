"use client";

import React from "react";
import Link from "next/link";
import { JobPlatform } from "@/types/job";
import { PlatformLogo } from "./platform-logo";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Bookmark02Icon,
  ArrowRight01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: string;
  type: "search" | "save" | "apply" | "match";
  title: string;
  time: string;
  detail?: string;
  platforms?: JobPlatform[];
}

interface JobsSidebarProps {
  completeness: number;
  profileName?: string | null;
  savedCount: number;
  lastFetchedAt?: string | null;
}

export function JobsSidebar({
  completeness,
  profileName,
  savedCount,
  lastFetchedAt,
}: JobsSidebarProps) {
  const activities: ActivityItem[] = [
    {
      id: "act-1",
      type: "match",
      title: "Auto-matched live jobs",
      detail: "Greenhouse, Lever, Workable, Wellfound",
      platforms: ["greenhouse", "lever", "workable", "wellfound"],
      time: lastFetchedAt ? "Recently" : "Just now",
    },
    {
      id: "act-2",
      type: "save",
      title: `${savedCount} role${savedCount === 1 ? "" : "s"} bookmarked`,
      detail: "Ready for customized application tailoring",
      time: "Active list",
    },
    {
      id: "act-3",
      type: "search",
      title: "Brave Search ATS Index scanned",
      detail: "Filtered for target role & top skills",
      time: "6h auto-cache",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. PROFILE COMPLETENESS CARD                                          */}
      {/* ==================================================================== */}
      <div className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <HugeiconsIcon icon={UserIcon} className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">
              Profile Completeness
            </h3>
          </div>

          <span className="text-xs font-bold text-indigo-400">{completeness}%</span>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex items-center gap-4 py-1">
          <div className="relative flex flex-col items-center justify-center size-[76px] shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-zinc-800/90"
                strokeWidth="8"
                fill="none"
              />
              <defs>
                <linearGradient id="sidebarCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#sidebarCircleGrad)"
                strokeWidth="8"
                strokeDasharray={251.3}
                strokeDashoffset={251.3 - (completeness / 100) * 251.3}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-extrabold text-[#FAFAFA]">
                {completeness}%
              </span>
              <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-400 -mt-0.5">
                Ready
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-zinc-200">
              {completeness >= 80
                ? "Profile matches ATS requirements"
                : "Boost your match accuracy"}
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {completeness >= 80
                ? "Your skills, headline, and experience give high precision match scoring."
                : "Add more skills and work experience to discover higher-paying roles."}
            </p>
          </div>
        </div>

        {/* Dynamic Checklist preview */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-400" />
              <span>Contact & Headline</span>
            </span>
            <span className="text-emerald-400 font-semibold">Done</span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className={`size-3.5 ${completeness > 40 ? "text-emerald-400" : "text-zinc-600"}`}
              />
              <span>Skills & Technologies</span>
            </span>
            <span className={completeness > 40 ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
              {completeness > 40 ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className={`size-3.5 ${completeness >= 75 ? "text-emerald-400" : "text-zinc-600"}`}
              />
              <span>Work Experience & Projects</span>
            </span>
            <span className={completeness >= 75 ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
              {completeness >= 75 ? "Added" : "Pending"}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="w-full h-9 flex items-center justify-center border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white rounded-xl gap-1.5 transition-colors cursor-pointer"
        >
          <span>Edit Profile Details</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </Link>
      </div>

      {/* ==================================================================== */}
      {/* 2. RECENT ACTIVITY CARD (NO STATS)                                   */}
      {/* ==================================================================== */}
      <div className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">
              Recent Activity
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            Live Feed
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 text-xs p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
            >
              <div className="size-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold text-zinc-200 truncate">{act.title}</p>
                {act.platforms && (
                  <div className="flex items-center gap-1.5 py-0.5">
                    {act.platforms.map((p) => (
                      <PlatformLogo key={p} platform={p} size="xs" />
                    ))}
                  </div>
                )}
                {act.detail && (
                  <p className="text-[11px] text-zinc-400 truncate">{act.detail}</p>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 shrink-0">{act.time}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed text-center">
          Activity updates automatically as you save roles or perform searches.
        </p>
      </div>
    </div>
  );
}
