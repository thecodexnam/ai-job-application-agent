import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobsManager } from "@/components/dashboard/jobs/jobs-manager";

export const metadata = {
  title: "AI Job Search & Discovery | JobBuddy AI",
  description:
    "Discover and auto-match job opportunities across Greenhouse, Lever, Workable, and Wellfound tailored to your skills.",
};

export default async function JobsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/jobs");
  }

  // Fetch candidate profile and related skills server-side
  const [profileRes, skillsRes, expRes, eduRes, projRes, certRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("profile_skills")
      .select("name, category, level")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase.from("work_experiences").select("id").eq("user_id", user.id),
    supabase.from("educations").select("id").eq("user_id", user.id),
    supabase.from("projects").select("id").eq("user_id", user.id),
    supabase.from("certifications").select("id").eq("user_id", user.id),
  ]);

  const profile = profileRes.data || {};
  const skillsList: string[] = (skillsRes.data || []).map((s: any) => s.name);
  if (Array.isArray(profile.skills)) {
    for (const s of profile.skills) {
      if (s && !skillsList.includes(s)) skillsList.push(s);
    }
  }

  // Calculate dynamic profile completeness
  let completeness = 0;
  if (profile.full_name && profile.full_name.trim().length > 0) completeness += 10;
  if (profile.email && profile.email.trim().length > 0) completeness += 5;
  if (profile.phone && profile.phone.trim().length > 0) completeness += 5;
  if (profile.headline && profile.headline.trim().length > 0) completeness += 10;
  if (profile.location && profile.location.trim().length > 0) completeness += 5;
  if (profile.summary && profile.summary.trim().length > 15) completeness += 15;
  if (skillsList.length >= 3) completeness += 15;
  else if (skillsList.length > 0) completeness += 8;
  if ((expRes.data || []).length > 0) completeness += 15;
  if ((eduRes.data || []).length > 0) completeness += 10;
  if ((projRes.data || []).length > 0) completeness += 10;
  if ((certRes.data || []).length > 0) completeness += 5;
  completeness = Math.min(100, Math.max(0, completeness));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JobsManager
        profileName={profile.full_name}
        profileHeadline={profile.headline}
        profileLocation={profile.location}
        profileSkills={skillsList}
        completeness={completeness}
      />
    </div>
  );
}
