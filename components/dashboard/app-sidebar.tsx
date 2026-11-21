"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  File02Icon,
  UserIcon,
  Task01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";
import { NavUser } from "@/components/dashboard/nav-user";
import { CreditsWidget } from "@/components/dashboard/credits-widget";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigationItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: DashboardSquare01Icon,
    exact: true,
  },
  {
    title: "Jobs",
    url: "/dashboard/jobs",
    icon: Briefcase02Icon,
    exact: false,
  },
  {
    title: "Resume Studio",
    url: "/dashboard/resume",
    icon: File02Icon,
    exact: false,
  },
  {
    title: "Candidate Profile",
    url: "/dashboard/profile",
    icon: UserIcon,
    exact: false,
  },
  {
    title: "Application Status",
    url: "/dashboard/status",
    icon: Task01Icon,
    exact: false,
  },
];

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#1A1A1A]/15 bg-[#E8E5D4] text-[#171914] transition-[width] duration-300 ease-in-out"
      {...props}
    >
      {/* Sidebar Header: Branding */}
      <SidebarHeader className="border-b border-[#1A1A1A]/15 py-3.5 px-3 bg-[#E8E5D4]">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 w-full group/brand outline-none focus-visible:ring-2 focus-visible:ring-[#172013] rounded-md p-1 transition-all"
            >
              {/* Brand Logo Icon */}
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-[#172013] text-[#DDF19B] border border-[#172013] transition-transform duration-200 group-hover/brand:scale-105">
                <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[#7B9E32] ring-2 ring-[#E8E5D4]" />
              </div>

              {/* Brand Name & Tagline */}
              <div className="flex flex-col overflow-hidden text-left transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-[#171914]">
                    JobBuddy
                  </span>
                  <span className="rounded-sm bg-[#172013] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#DDF19B]">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-[#687064] font-medium truncate">
                  Career Copilot
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="py-3 px-2 bg-[#E8E5D4]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-[#687064] tracking-widest uppercase px-2 mb-2 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigationItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.url
                  : pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.url}
                          className="flex items-center gap-2.5 w-full font-medium transition-colors"
                        />
                      }
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-9 rounded-md px-2.5 border transition-colors ${
                        isActive
                          ? "bg-[#DDF19B] border-[#9FB944] text-[#1B2710] font-bold"
                          : "border-transparent text-[#5A5D55] hover:bg-[#DEDBD0] hover:text-[#171914]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        className={`size-4 shrink-0 ${
                          isActive ? "text-[#1B2710]" : "text-[#687064]"
                        }`}
                      />
                      <span className="truncate text-xs tracking-tight">{item.title}</span>

                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-[#1B2710] group-data-[collapsible=icon]:hidden" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-[#1A1A1A]/15 p-2.5 space-y-2 bg-[#E8E5D4]">
        <CreditsWidget current={85} max={100} />
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
