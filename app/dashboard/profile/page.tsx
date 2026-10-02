import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { FullUserProfile } from "@/types/resume";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  // Fetch full profile and related relational tables
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const [
    { data: skills },
    { data: work_experiences },
    { data: educations },
    { data: projects },
    { data: certifications },
    { data: additional_info },
  ] = await Promise.all([
    supabase
      .from("profile_skills")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("work_experiences")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("educations")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("certifications")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("additional_info")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true }),
  ]);

  const fullProfile: FullUserProfile = {
    id: user.id,
    full_name: profile?.full_name || "",
    email: profile?.email || user.email || "",
    avatar_url: profile?.avatar_url || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    headline: profile?.headline || "",
    summary: profile?.summary || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    portfolio_url: profile?.portfolio_url || "",
    target_roles: profile?.target_roles || [],
    skills: profile?.skills || [],
    additional_links: profile?.additional_links || [],
    categorized_skills: skills || [],
    work_experiences: work_experiences || [],
    educations: educations || [],
    projects: projects || [],
    certifications: certifications || [],
    additional_info: additional_info || [],
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1A1A1A]/15">
        <div>
          <p className="text-[11px] font-semibold uppercase text-[#687064]">Candidate Data</p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171914]">
              Candidate Profile
            </h1>
            <Badge className="border border-[#9FB944] bg-[#DDF19B] text-[#1B2710] gap-1 text-[10px] py-0.5 px-2 font-semibold rounded-md">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-[#7B9E32]" />
              Auto-Filled & Editable
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5D55] max-w-2xl mt-1">
            Review and fine-tune your personal information, technical skills, work history, education, and portfolio projects.
          </p>
        </div>
      </header>

      {/* Complete Editable Profile Form */}
      <ProfileEditor initialProfile={fullProfile} />
    </div>
  );
}
