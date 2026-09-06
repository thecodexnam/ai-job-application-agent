"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Settings02Icon,
  CreditCardIcon,
  Logout03Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { signOut } from "@/app/actions/auth";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, state } = useSidebar();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "JB";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={{
                  children: (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-xs text-[#FAFAFA]">{user.name}</span>
                      <span className="text-[10px] text-[#A1A1AA]">{user.email}</span>
                    </div>
                  ),
                }}
                className="data-open:bg-[#27272A] hover:bg-[#27272A] rounded-xl cursor-pointer transition-colors"
              />
            }
          >
            <Avatar size="sm" className="size-8 rounded-lg border border-[#3F3F46]">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-[#FAFAFA]">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-[#A1A1AA]">
                {user.email}
              </span>
            </div>

            <HugeiconsIcon
              icon={MoreVerticalIcon}
              className="ml-auto size-4 text-[#A1A1AA] group-data-[collapsible=icon]:hidden"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-2xl p-1.5 shadow-2xl border-[#3F3F46] bg-[#18181B] text-[#FAFAFA]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="p-2">
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" className="size-8 rounded-lg border border-[#3F3F46]">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#A855F7] to-[#6366F1] text-white font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 truncate text-left">
                  <span className="text-xs font-semibold text-[#FAFAFA] truncate">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-[#27272A]" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#27272A] rounded-lg px-2 py-1.5 text-xs text-[#FAFAFA]"
                  />
                }
              >
                <HugeiconsIcon icon={UserIcon} className="size-4 text-purple-400" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                render={
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#27272A] rounded-lg px-2 py-1.5 text-xs text-[#FAFAFA]"
                  />
                }
              >
                <HugeiconsIcon icon={Settings02Icon} className="size-4 text-[#A1A1AA]" />
                <span>Preferences</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center justify-between cursor-pointer hover:bg-[#27272A] rounded-lg px-2 py-1.5 text-xs text-[#FAFAFA]"
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={CreditCardIcon} className="size-4 text-indigo-400" />
                  <span>Billing & Quota</span>
                </div>
                <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                  75 Left
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[#27272A]" />

            <DropdownMenuGroup>
              <form action={signOut} className="w-full">
                <DropdownMenuItem
                  variant="destructive"
                  className="w-full cursor-pointer text-red-400 hover:bg-red-500/10 rounded-lg px-2 py-1.5 text-xs"
                  render={<button type="submit" className="flex items-center gap-2 w-full text-left" />}
                >
                  <HugeiconsIcon icon={Logout03Icon} className="size-4 text-red-400" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
