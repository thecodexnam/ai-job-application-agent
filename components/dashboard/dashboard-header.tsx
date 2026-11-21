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

const routeNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/jobs": "Job Discovery",
  "/dashboard/resume": "Resume Studio",
  "/dashboard/profile": "Candidate Profile",
  "/dashboard/status": "Application Status",
};

interface DashboardHeaderProps {
  displayName: string;
}

export function DashboardHeader({ displayName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const currentTitle = routeNames[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#1A1A1A]/15 bg-[#E8E5D4]/95 px-4 sm:px-6 backdrop-blur-sm transition-[width,height] ease-linear">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-1 text-[#5A5D55] hover:text-[#171914] hover:bg-[#DEDBD0] rounded-md cursor-pointer transition-colors border border-transparent hover:border-[#1A1A1A]/15" />
        <Separator orientation="vertical" className="h-4 bg-[#1A1A1A]/15" />

        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink
                render={
                  <Link
                    href="/dashboard"
                    className="text-[#687064] hover:text-[#171914] transition-colors font-medium text-xs"
                  />
                }
              >
                JobBuddy AI
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex text-[#687064]/50" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-xs text-[#171914]">
                {currentTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#1A1A1A]/15 bg-white/70 text-[11px] font-medium text-[#5A5D55]">
          <span className="size-1.5 rounded-full bg-[#7B9E32]" />
          <span>Signed in as <strong className="text-[#171914]">{displayName}</strong></span>
        </div>
      </div>
    </header>
  );
}
