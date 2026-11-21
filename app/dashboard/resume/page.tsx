import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumeManager } from "@/components/dashboard/resume-manager";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { ResumeRecord } from "@/types/resume";

export const metadata = {
  title: "Resume Studio | JobBuddy AI",
  description: "Upload and manage your master resumes. AI automatically parses skills and experiences into your candidate profile.",
};

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
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1A1A1A]/15">
        <div>
          <p className="text-[11px] font-semibold uppercase text-[#687064]">Document Studio</p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171914]">
              Resume Studio
            </h1>
            <Badge className="border border-[#9FB944] bg-[#DDF19B] text-[#1B2710] gap-1 text-[10px] py-0.5 px-2 font-semibold rounded-md">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-[#7B9E32]" />
              AI Parser
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5D55] max-w-2xl mt-1">
            Upload your master resume in PDF or DOCX format. JobBuddy AI extracts your skills, work history, and automatically populates your profile.
          </p>
        </div>
      </header>

      {/* Interactive Resume Manager */}
      <ResumeManager initialResumes={(resumes as ResumeRecord[]) || []} />
    </div>
  );
}
