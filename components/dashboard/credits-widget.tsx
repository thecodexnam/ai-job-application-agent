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

export function CreditsWidget({ current = 75, max = 100 }: CreditsWidgetProps) {
  const { state } = useSidebar();
  const percentage = Math.round((current / max) * 100);
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={{
              children: (
                <div className="flex flex-col gap-1 py-0.5">
                  <div className="font-semibold text-[11px] flex items-center gap-1.5 text-[#FAFAFA]">
                    <HugeiconsIcon icon={Coins01Icon} className="size-3 text-purple-400" />
                    <span>Credits Remaining</span>
                  </div>
                  <div className="text-[10px] text-[#A1A1AA]">
                    {current} / {max} Credits ({percentage}%)
                  </div>
                </div>
              ),
            }}
            className="flex items-center justify-center hover:bg-[#27272A] cursor-pointer rounded-xl"
          >
            <div className="relative flex items-center justify-center">
              <HugeiconsIcon icon={Coins01Icon} className="size-4 text-purple-400" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-purple-500 ring-2 ring-[#09090B]" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <div className="rounded-2xl border border-[#3F3F46] bg-[#18181B] p-3.5 space-y-3 transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <HugeiconsIcon icon={Coins01Icon} className="size-3.5" />
          </div>
          <span className="text-xs font-semibold text-[#FAFAFA] tracking-tight">
            Credits Remaining
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
          Pro Plan
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-[#FAFAFA] tracking-tight tabular-nums">
            {current}
            <span className="text-xs font-normal text-[#A1A1AA] ml-1">
              / {max} Credits
            </span>
          </span>
          <span className="text-[11px] font-semibold text-purple-400 tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#27272A]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#A855F7] via-[#9333EA] to-[#6366F1] shadow-xs shadow-purple-500/40 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5 text-[11px]">
        <span className="text-[#A1A1AA] text-[10px]">Monthly AI quota</span>
        <span className="text-[11px] font-medium text-purple-400 flex items-center gap-1">
          <HugeiconsIcon icon={SparklesIcon} className="size-2.5" />
          {percentage}% Used
        </span>
      </div>
    </div>
  );
}
