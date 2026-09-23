import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Fetch profile if exists
  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch {
    // Fallback if needed
  }

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Job Hunter";

  const userEmail = user.email || "";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || "";

  return (
    <TooltipProvider delay={150}>
      <SidebarProvider defaultOpen={true}>
        <div
          className="flex min-h-screen w-full bg-[#EDEBE0] text-[#0F0F0F]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
            backgroundSize: "2.5rem 2.5rem",
          }}
        >
          {/* Lavender frame border */}
          <div className="pointer-events-none fixed inset-0 z-50 border-4 border-[#B8AEF5]" />

          {/* Collapsible Left Sidebar */}
          <AppSidebar
            user={{
              name: displayName,
              email: userEmail,
              avatar: avatarUrl,
            }}
          />

          {/* Main Content Viewport */}
          <SidebarInset className="flex flex-1 flex-col min-w-0 bg-transparent">
            <DashboardHeader displayName={displayName} />
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-6xl w-full">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
