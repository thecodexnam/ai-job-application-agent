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
        <div className="flex min-h-screen w-full bg-[#f1f0e8] text-[#20231a]">

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
