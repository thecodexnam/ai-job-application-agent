"use client";

import React from "react";
import { JobPlatform, PLATFORMS_CONFIG, ALL_JOB_PLATFORMS } from "@/types/job";
import { PlatformLogo } from "./platform-logo";

interface PlatformSelectorProps {
  selectedPlatforms: JobPlatform[];
  onTogglePlatform: (platform: JobPlatform) => void;
  onSelectAll: () => void;
  platformCounts: Record<JobPlatform, number>;
  sourceErrors: string[];
}

export function PlatformSelector({
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  platformCounts,
  sourceErrors,
}: PlatformSelectorProps) {
  const allPlatforms: JobPlatform[] = ALL_JOB_PLATFORMS;
  const isAllSelected = selectedPlatforms.length === allPlatforms.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#171914] tracking-tight">
            Target Job Platforms
          </h3>
          <p className="text-xs text-[#5A5D55]">
            Select ATS career boards and job portals to scan and auto-match against your profile
          </p>
        </div>

        <button
          type="button"
          onClick={onSelectAll}
          className="self-start sm:self-auto text-xs font-semibold text-[#171914] bg-white hover:bg-[#F2F0E8] px-3 py-1.5 rounded-md border border-[#1A1A1A]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171914]"
        >
          {isAllSelected ? "Greenhouse only" : `Select all ${allPlatforms.length}`}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {allPlatforms.map((platformKey) => {
          const config = PLATFORMS_CONFIG[platformKey];
          const isSelected = selectedPlatforms.includes(platformKey);
          const count = platformCounts[platformKey] || 0;
          const sourceError = sourceErrors.find((error) =>
            error.toLowerCase().startsWith(`${platformKey}:`)
          );

          return (
            <button
              key={platformKey}
              type="button"
              onClick={() => onTogglePlatform(platformKey)}
              aria-pressed={isSelected}
              className={`relative text-left p-3 rounded-lg border transition-colors cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171914] ${
                isSelected
                  ? "bg-white border-[#1A1A1A]/35 shadow-xs"
                  : "bg-[#F7F6F0] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlatformLogo
                    platform={platformKey}
                    size="sm"
                    className="shrink-0"
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#171914] leading-tight">
                      {config.name}
                    </h4>
                    <span className="text-[10px] text-[#687064] block truncate">
                      {config.domain}
                    </span>
                  </div>
                </div>

                <span
                  className={`mt-0.5 size-4 shrink-0 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-[#172013] bg-[#172013] text-white" : "border-[#1A1A1A]/25 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <span className="size-1.5 rounded-full bg-[#DDF19B]" />}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                {sourceError ? (
                  <span className="text-[10px] font-semibold text-rose-700">Source issue</span>
                ) : count > 0 ? (
                  <span className="text-[10px] font-semibold text-emerald-800">
                    {count} {count === 1 ? "result" : "results"}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#687064]">
                    {isSelected ? "No results loaded" : "Not selected"}
                  </span>
                )}
                {isSelected && <span className="text-[9px] font-semibold uppercase tracking-wider text-[#687064]">Active</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
