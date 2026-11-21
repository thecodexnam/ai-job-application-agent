import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobsManager } from "@/components/dashboard/jobs/jobs-manager";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

export const metadata = {
  title: "Job Search | JobBuddy AI",
  description: "Search and manage active job matches from your selected job sources.",
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
  const [profileRes, skillsRes, expRes, eduRes, projRes, certRes, additRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("profile_skills")
      .select("id, name, category, level")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase.from("work_experiences").select("*").eq("user_id", user.id),
    supabase.from("educations").select("*").eq("user_id", user.id),
    supabase.from("projects").select("*").eq("user_id", user.id),
    supabase.from("certifications").select("*").eq("user_id", user.id),
    supabase.from("additional_info").select("*").eq("user_id", user.id),
  ]);

  const profile = profileRes.data || {};
  const skillsList = (skillsRes.data || [])
    .map((skill) => skill.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (Array.isArray(profile.skills)) {
    for (const s of profile.skills) {
      const trimmed = (s || "").trim();
      if (trimmed && !skillsList.includes(trimmed)) skillsList.push(trimmed);
    }
  }

  // Deterministic, fair profile completeness calculation
  const completenessResult = calculateProfileCompleteness({
    ...profile,
    categorized_skills: skillsRes.data || [],
    work_experiences: expRes.data || [],
    educations: eduRes.data || [],
    projects: projRes.data || [],
    certifications: certRes.data || [],
    additional_info: additRes.data || [],
  });

  const completeness = completenessResult.completionPercentage;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JobsManager
        profileHeadline={profile.headline}
        profileLocation={profile.location}
        profileSkills={skillsList}
        completeness={completeness}
      />
    </div>
  );
}
