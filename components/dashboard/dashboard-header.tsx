"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Coins01Icon } from "@hugeicons/core-free-icons";

const routeNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/jobs": "Jobs",
  "/dashboard/resume": "Resume",
  "/dashboard/profile": "Profile",
  "/dashboard/status": "Application Status",
};

interface DashboardHeaderProps {
  displayName: string;
}

export function DashboardHeader({ displayName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const currentTitle = routeNames[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#27272A] bg-[#09090B]/90 px-4 sm:px-6 backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle for Desktop and Mobile Sheet */}
        <SidebarTrigger className="-ml-1 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-lg cursor-pointer transition-colors" />
        <Separator orientation="vertical" className="h-4 bg-[#27272A]" />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink
                render={<Link href="/dashboard" className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors" />}
              >
                JobBuddy AI
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex text-[#71717A]" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-[#FAFAFA]">
                {currentTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Quick Status Badges */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] text-xs font-semibold shadow-xs">
          <HugeiconsIcon icon={Coins01Icon} className="size-3.5 text-purple-400" />
          <span>75 Credits</span>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 border-purple-500/30 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-300 text-[11px] py-1 px-3 font-semibold shadow-xs"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-purple-500"></span>
          </span>
          <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
          AI Copilot Ready
        </Badge>
      </div>
    </header>
  );
}
