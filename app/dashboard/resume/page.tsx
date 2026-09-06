import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumeManager } from "@/components/dashboard/resume-manager";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { ResumeRecord } from "@/types/resume";

export default async function ResumePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/resume");
  }

  // Fetch initial resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <HugeiconsIcon icon={File02Icon} className="size-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
              Resume Studio
            </h1>
            <Badge className="border-purple-500/30 bg-purple-500/15 text-purple-300 gap-1.5 text-xs py-0.5 px-2.5 font-semibold">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
              AI Parser
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Upload your master resume in PDF or DOCX format. JobBuddy AI extracts your skills, work history, and automatically populates your profile.
          </p>
        </div>
      </div>

      {/* Interactive Resume Manager */}
      <ResumeManager initialResumes={(resumes as ResumeRecord[]) || []} />
    </div>
  );
}
