import React from "react";
import { redirect } from "next/navigation";
import { ApplicationTracker } from "@/components/dashboard/application-tracker";
import { createClient } from "@/lib/supabase/server";
import type { TrackedApplication } from "@/components/dashboard/application-tracker";

export const metadata = {
  title: "Application Status | JobBuddy AI",
  description: "Track your job applications, stages, notes, and interviews in real time.",
};

export default async function StatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/status");

  const { data, error } = await supabase
    .from("job_applications")
    .select("id, job_title, company_name, job_url, location, status, created_at, applied_at, notes, platform, application_mode, application_status, browser_session_id, live_debug_url, missing_fields, current_step, error_message, confirmation_details, retry_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const applications: TrackedApplication[] = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {error && (
        <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 rounded-md">
          Applications could not be loaded. Refresh the page to try again.
        </p>
      )}
      <ApplicationTracker initialApplications={applications} />
    </div>
  );
}
