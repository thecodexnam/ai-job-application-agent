"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

interface CreditsWidgetProps {
  current?: number;
  max?: number;
}

export function CreditsWidget({ current = 85, max = 100 }: CreditsWidgetProps) {
  const { state } = useSidebar();
  const percentage = Math.round((current / max) * 100);
  const isCollapsed = state === "collapsed";
  const remaining = Math.max(0, max - current);

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={{
              children: (
                <div className="flex flex-col gap-1 py-1 text-left">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-[#171914]">
                    <HugeiconsIcon icon={Coins01Icon} className="size-3.5 text-[#304019]" />
                    <span>AI Quota</span>
                  </div>
                  <div className="text-[11px] text-[#687064]">
                    {current} / {max} credits used ({remaining} left)
                  </div>
                </div>
              ),
            }}
            className="flex items-center justify-center hover:bg-[#DEDBD0] cursor-pointer rounded-md transition-colors"
          >
            <div className="relative flex size-7 items-center justify-center rounded-md bg-[#E9F2D1] text-[#304019] border border-[#1A1A1A]/10">
              <HugeiconsIcon icon={Coins01Icon} className="size-3.5" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#7B9E32]" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="rounded-lg border border-[#1A1A1A]/15 bg-white p-3 space-y-2.5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-[#E9F2D1] text-[#304019]">
            <HugeiconsIcon icon={Coins01Icon} className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-[#171914]">
            AI Credits
          </span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#DDF19B] text-[#1B2710] border border-[#9FB944]/40">
          Pro
        </span>
      </div>

      {/* Numerical Counter & Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between font-sans">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-[#171914] tabular-nums">
              {current}
            </span>
            <span className="text-[11px] text-[#687064] font-medium">
              / {max}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#171914] tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar matching Jobs Profile Readiness */}
        <div
          role="progressbar"
          aria-label="AI Credits used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E5DC]"
        >
          <div
            className="h-full rounded-full bg-[#7B9E32] transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-[#687064] font-medium pt-0.5">
        <span>Monthly quota</span>
        <span className="font-semibold text-[#171914] flex items-center gap-1">
          <HugeiconsIcon icon={SparklesIcon} className="size-2.5 text-[#304019]" />
          {remaining} left
        </span>
      </div>
    </div>
  );
}
