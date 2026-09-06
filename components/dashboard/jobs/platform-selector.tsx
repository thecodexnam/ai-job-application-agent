"use client";

import React from "react";
import { JobPlatform, PLATFORMS_CONFIG } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { PlatformLogo } from "./platform-logo";

interface PlatformSelectorProps {
  selectedPlatforms: JobPlatform[];
  onTogglePlatform: (platform: JobPlatform) => void;
  onSelectAll: () => void;
  platformCounts: Record<JobPlatform, number>;
}

export function PlatformSelector({
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  platformCounts,
}: PlatformSelectorProps) {
  const allPlatforms: JobPlatform[] = ["greenhouse", "lever", "workable", "wellfound"];
  const isAllSelected = selectedPlatforms.length === allPlatforms.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">
            Target Job Platforms
          </h3>
          <p className="text-xs text-zinc-400">
            Select ATS career boards to scan and auto-match against your profile
          </p>
        </div>

        <button
          onClick={onSelectAll}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        >
          {isAllSelected ? "Deselect All" : "Select All (4)"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allPlatforms.map((platformKey) => {
          const config = PLATFORMS_CONFIG[platformKey];
          const isSelected = selectedPlatforms.includes(platformKey);
          const count = platformCounts[platformKey] || 0;

          return (
            <button
              key={platformKey}
              type="button"
              onClick={() => onTogglePlatform(platformKey)}
              className={`relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group ${
                isSelected
                  ? "bg-[#18181B] border-indigo-500/70 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                  : "bg-[#141416] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#18181B]/60 opacity-70 hover:opacity-100"
              }`}
            >
              {/* Subtle platform glow */}
              {isSelected && (
                <div
                  className="absolute -right-8 -top-8 size-20 rounded-full blur-2xl pointer-events-none opacity-20"
                  style={{ backgroundColor: config.accentColor }}
                />
              )}

              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <PlatformLogo
                    platform={platformKey}
                    size="lg"
                    showBorder
                    className="transition-transform group-hover:scale-105 shadow-md shadow-black/40"
                  />

                  <div>
                    <h4 className="text-sm font-bold text-[#FAFAFA] tracking-tight group-hover:text-white">
                      {config.name}
                    </h4>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {config.domain}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {count > 0 && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2 py-0.5 border ${config.badgeBorder} ${config.badgeBg} ${config.badgeText}`}
                    >
                      {count} {count === 1 ? "role" : "roles"}
                    </Badge>
                  )}

                  <div
                    className={`size-4 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-zinc-700 bg-zinc-900 text-transparent"
                    }`}
                  >
                    <svg
                      className="size-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {config.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
