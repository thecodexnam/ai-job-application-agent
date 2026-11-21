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
  const { isMobile } = useSidebar();
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
                    <div className="flex flex-col gap-0.5 py-0.5 text-left">
                      <span className="font-semibold text-xs text-[#171914]">{user.name}</span>
                      <span className="text-[10px] text-[#687064]">{user.email}</span>
                    </div>
                  ),
                }}
                className="data-[state=open]:bg-white data-[state=open]:border-[#1A1A1A]/20 hover:bg-white/80 rounded-md cursor-pointer transition-colors border border-transparent hover:border-[#1A1A1A]/15 p-2"
              />
            }
          >
            <Avatar size="sm" className="size-7 rounded-md border border-[#1A1A1A]/15 shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />}
              <AvatarFallback className="rounded-md bg-[#172013] text-[#DDF19B] font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden min-w-0">
              <span className="truncate font-semibold text-[#171914]">
                {user.name}
              </span>
              <span className="truncate text-[10px] text-[#687064]">
                {user.email}
              </span>
            </div>

            <HugeiconsIcon
              icon={MoreVerticalIcon}
              className="ml-auto size-4 text-[#687064] group-data-[collapsible=icon]:hidden shrink-0"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-lg p-1.5 border border-[#1A1A1A]/15 bg-[#F7F6F0] text-[#171914] shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="p-2">
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" className="size-7 rounded-md border border-[#1A1A1A]/15">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="rounded-md bg-[#172013] text-[#DDF19B] font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 truncate text-left">
                  <span className="text-xs font-semibold text-[#171914] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#687064] truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-[#1A1A1A]/10 h-px" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 w-full cursor-pointer hover:bg-[#E8E5D4] rounded-md px-2 py-1.5 text-xs font-medium text-[#171914]"
                  />
                }
              >
                <HugeiconsIcon icon={UserIcon} className="size-3.5 text-[#171914]" />
                <span>Candidate Profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[#1A1A1A]/10 h-px" />

            <DropdownMenuGroup>
              <form action={signOut} className="w-full">
                <DropdownMenuItem
                  className="w-full cursor-pointer text-rose-700 font-medium hover:bg-rose-50 rounded-md px-2 py-1.5 text-xs"
                  render={<button type="submit" className="flex items-center gap-2 w-full text-left" />}
                >
                  <HugeiconsIcon icon={Logout03Icon} className="size-3.5 text-rose-700" />
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
