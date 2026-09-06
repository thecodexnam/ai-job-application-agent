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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <HugeiconsIcon icon={UserIcon} className="size-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
              Candidate Profile
            </h1>
            <Badge className="border-purple-500/30 bg-purple-500/15 text-purple-300 gap-1.5 text-xs py-0.5 px-2.5 font-semibold">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
              Auto-Filled & Editable
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Review and fine-tune your personal information, technical skills, work history, education, and portfolio projects.
          </p>
        </div>
      </div>

      {/* Complete Editable Profile Form */}
      <ProfileEditor initialProfile={fullProfile} />
    </div>
  );
}
