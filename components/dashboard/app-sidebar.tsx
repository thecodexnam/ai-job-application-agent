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
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  File02Icon,
  UserIcon,
  Task01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { CreditsWidget } from "@/components/dashboard/credits-widget";
import { NavUser } from "@/components/dashboard/nav-user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigationItems = [
  {
    title: "Jobs",
    url: "/dashboard/jobs",
    icon: Briefcase02Icon,
    matchExact: false,
    matchFallback: "/dashboard",
  },
  {
    title: "Resume",
    url: "/dashboard/resume",
    icon: File02Icon,
    matchExact: false,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserIcon,
    matchExact: false,
  },
  {
    title: "Application Status",
    url: "/dashboard/status",
    icon: Task01Icon,
    matchExact: false,
  },
];

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#27272A] bg-[#09090B] text-[#FAFAFA] transition-[width] duration-300 ease-in-out"
      {...props}
    >
      {/* Sidebar Header: Branding */}
      <SidebarHeader className="border-b border-[#27272A] py-3.5 px-3 bg-[#09090B]">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 w-full group/brand outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl p-1 transition-all"
            >
              {/* Brand Logo Icon */}
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A855F7] via-[#9333EA] to-[#6366F1] text-[#FAFAFA] shadow-md shadow-purple-500/30 ring-1 ring-white/20 transition-transform duration-300 group-hover/brand:scale-105">
                <HugeiconsIcon icon={SparklesIcon} className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#09090B]" />
              </div>

              {/* Brand Name & Tagline */}
              <div className="flex flex-col overflow-hidden text-left transition-opacity duration-200 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-[#FAFAFA]">
                    JobBuddy
                  </span>
                  <span className="rounded-md bg-purple-500/15 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-[#A1A1AA] font-medium truncate">
                  Career Copilot
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="py-2.5 px-2 bg-[#09090B]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-[#71717A] tracking-wider uppercase px-2 mb-1.5 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url)) ||
                  (item.matchFallback ? pathname === item.matchFallback : false);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.url}
                          className="flex items-center gap-3 w-full font-medium transition-all duration-200"
                        />
                      }
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-10 rounded-xl px-3 transition-all duration-150 ${
                        isActive
                          ? "bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-[#FAFAFA] shadow-md shadow-purple-500/25 font-semibold hover:from-[#9333EA] hover:to-[#6D28D9] hover:text-[#FAFAFA]"
                          : "text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#FAFAFA]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        className={`size-4.5 shrink-0 transition-transform duration-200 ${
                          isActive ? "text-[#FAFAFA]" : "text-[#A1A1AA]"
                        }`}
                      />
                      <span className="truncate text-xs tracking-tight">{item.title}</span>

                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-[#FAFAFA] shadow-xs shadow-white group-data-[collapsible=icon]:hidden" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Credits & Profile */}
      <SidebarFooter className="border-t border-[#27272A] p-2.5 space-y-2 bg-[#09090B]">
        {/* Credits Display */}
        <CreditsWidget current={75} max={100} />

        {/* Profile / Account Settings */}
        <NavUser user={user} />
      </SidebarFooter>

      {/* Sidebar Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
