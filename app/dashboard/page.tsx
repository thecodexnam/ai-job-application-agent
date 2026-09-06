import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  PlusSignIcon,
  File02Icon,
  Calendar03Icon,
  Briefcase02Icon,
  Task01Icon,
  FlashIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Fetch user profile from Supabase
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

  // Fetch applications list from Supabase
  let applications: any[] = [];
  try {
    const { data } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    applications = data || [];
  } catch {
    // Fallback
  }

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Job Hunter";

  // Compute stat counters
  const totalCount = applications.length;
  const interviewingCount = applications.filter(
    (a) => a.status === "interviewing"
  ).length;
  const offerCount = applications.filter((a) => a.status === "offer").length;
  const appliedCount = applications.filter((a) => a.status === "applied").length;

  // Generate simulated activity grid columns for the weekly engagement heatmap (inspired by reference UI)
  const heatmapRows = ["Mon", "Wed", "Fri"];
  const heatmapCols = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            Hi, {displayName}!
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-0.5">
            What do you want to accomplish with your AI career agent today?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs py-1 px-3 font-semibold rounded-full"
          >
            <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
            AI Copilot Active
          </Badge>
        </div>
      </div>

      {/* Hero Bento Card (Inspired by PromptPal & Campus Intelligence in reference images) */}
      <Card className="relative overflow-hidden rounded-3xl border border-[#3F3F46] bg-gradient-to-br from-[#18181B] via-[#1c1926] to-[#12101d] shadow-xl">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 size-72 rounded-full bg-indigo-600/15 blur-3xl" />

        <CardContent className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
              <span>Autonomous Job Search & Matching</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FAFAFA] leading-tight">
              Your AI Career Companion
            </h2>

            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              JobBuddy continuously parses job postings, scores your resume for ATS match precision, and drafts tailored application packages in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                render={<Link href="/dashboard/status" />}
                className="gap-2 text-xs font-semibold cursor-pointer rounded-xl bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white shadow-lg shadow-purple-500/25 px-4 py-2"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                Track New Application
              </Button>

              <Button
                render={<Link href="/dashboard/resume" />}
                variant="outline"
                className="gap-2 text-xs font-medium cursor-pointer rounded-xl border border-[#3F3F46] bg-[#27272A]/70 text-[#FAFAFA] hover:bg-[#3F3F46] px-4 py-2"
              >
                <HugeiconsIcon icon={File02Icon} className="size-3.5 text-[#A1A1AA]" />
                Tailor Resume
              </Button>
            </div>
          </div>

          {/* Stylized AI Orb Preview (Inspired by reference Image 1 orb) */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="relative flex size-36 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 via-indigo-500/20 to-transparent p-1 shadow-2xl shadow-purple-500/20 ring-1 ring-purple-500/40">
              <div className="flex size-full items-center justify-center rounded-full bg-[#09090B]/90 backdrop-blur-md">
                <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#6366F1] shadow-lg shadow-purple-500/40 animate-pulse">
                  <HugeiconsIcon icon={SparklesIcon} className="size-10 text-white" />
                </div>
              </div>
            </div>
            <span className="mt-2 text-[11px] font-semibold text-purple-300">
              100% Match Engine
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4 Stat Bento Cards (Inspired by Sapphire UI stats in Image 2) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked */}
        <Card className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 shadow-sm transition-all hover:border-[#3F3F46]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#A1A1AA]">Total Tracked</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#27272A] text-[#FAFAFA]">
              <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-[#FAFAFA] tracking-tight tabular-nums">
              {totalCount}
            </span>
            <span className="text-[11px] font-medium text-[#A1A1AA]">jobs</span>
          </div>
          <p className="text-[11px] text-purple-400 mt-2 flex items-center gap-1 font-medium">
            <HugeiconsIcon icon={FlashIcon} className="size-3" />
            Active pipeline
          </p>
        </Card>

        {/* Submitted */}
        <Card className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 shadow-sm transition-all hover:border-[#3F3F46]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#A1A1AA]">Submitted</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <HugeiconsIcon icon={Task01Icon} className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight tabular-nums">
              {appliedCount}
            </span>
            <span className="text-[11px] font-medium text-[#A1A1AA]">sent</span>
          </div>
          <p className="text-[11px] text-indigo-300 mt-2 font-medium">
            Ready for follow-ups
          </p>
        </Card>

        {/* Interviews */}
        <Card className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 shadow-sm transition-all hover:border-[#3F3F46]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#A1A1AA]">Interviews</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-tight tabular-nums">
              {interviewingCount}
            </span>
            <span className="text-[11px] font-medium text-[#A1A1AA]">rounds</span>
          </div>
          <p className="text-[11px] text-purple-300 mt-2 font-medium">
            Scheduled stages
          </p>
        </Card>

        {/* Offers */}
        <Card className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 shadow-sm transition-all hover:border-[#3F3F46]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-medium text-[#A1A1AA]">Offers</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight tabular-nums">
              {offerCount}
            </span>
            <span className="text-[11px] font-medium text-[#A1A1AA]">received</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
            Top compensation
          </p>
        </Card>
      </section>

      {/* Middle Bento Row: AI Capabilities & Weekly Activity Grid (Inspired by reference images) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Engagement Heatmap (Inspired by Image 2 right side) */}
        <Card className="lg:col-span-2 rounded-3xl border border-[#27272A] bg-[#18181B] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#27272A] gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
                <HugeiconsIcon icon={FlashIcon} className="size-4 text-purple-400" />
                <span>Application Velocity & Engagement</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                AI application pacing and recruiter response frequency
              </CardDescription>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
              <span>Low</span>
              <div className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs bg-[#27272A]" />
                <span className="size-2.5 rounded-xs bg-indigo-900/60" />
                <span className="size-2.5 rounded-xs bg-[#6366F1]" />
                <span className="size-2.5 rounded-xs bg-[#A855F7]" />
              </div>
              <span>Peak</span>
            </div>
          </div>

          {/* Heatmap Grid Matrix */}
          <div className="pt-5 space-y-2 overflow-x-auto">
            {heatmapRows.map((rowLabel, rIdx) => (
              <div key={rowLabel} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-[11px] text-[#71717A]">{rowLabel}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  {heatmapCols.map((c) => {
                    const intensity = (rIdx + c) % 4;
                    const bgClass =
                      intensity === 3
                        ? "bg-[#A855F7] shadow-xs shadow-purple-500/50"
                        : intensity === 2
                        ? "bg-[#6366F1]"
                        : intensity === 1
                        ? "bg-[#27272A]"
                        : "bg-[#1f1f23]";

                    return (
                      <div
                        key={c}
                        className={`h-5 flex-1 rounded-sm ${bgClass} transition-transform hover:scale-110 cursor-pointer`}
                        title={`Day ${c}: Activity index ${intensity}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 text-[11px] text-[#71717A]">
              <span>14-day rolling window</span>
              <span className="text-purple-400 font-medium">Optimal consistency rate: 88%</span>
            </div>
          </div>
        </Card>

        {/* AI Copilot Tools (Inspired by PromptPal bento items in Image 1) */}
        <Card className="rounded-3xl border border-[#27272A] bg-[#18181B] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                AI Copilot Tools
              </span>
              <span className="text-[10px] text-[#A1A1AA]">Automations</span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Tool 1 */}
              <Link
                href="/dashboard/resume"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-[#27272A] bg-[#27272A]/40 hover:bg-[#27272A] hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <HugeiconsIcon icon={File02Icon} className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-purple-300 transition-colors">
                      ATS Keyword Matcher
                    </h4>
                    <p className="text-[10px] text-[#A1A1AA]">Instant resume score</p>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-3.5 text-[#71717A] group-hover:text-[#FAFAFA] transition-colors"
                />
              </Link>

              {/* Tool 2 */}
              <Link
                href="/dashboard/status"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-[#27272A] bg-[#27272A]/40 hover:bg-[#27272A] hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-indigo-300 transition-colors">
                      Smart Cover Letter
                    </h4>
                    <p className="text-[10px] text-[#A1A1AA]">Custom hiring pitch</p>
                  </div>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-3.5 text-[#71717A] group-hover:text-[#FAFAFA] transition-colors"
                />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 flex items-center justify-between">
            <span className="text-[11px] text-[#A1A1AA]">Available Credits</span>
            <span className="text-xs font-bold text-purple-400">75 / 100 Left</span>
          </div>
        </Card>
      </section>

      {/* Applications Pipeline Card */}
      <Card className="rounded-3xl border border-[#27272A] bg-[#18181B] shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#27272A] p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                Application Pipeline
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA]">
                Manage your active job applications and interview stages
              </CardDescription>
            </div>

            <Button
              render={<Link href="/dashboard/status" />}
              size="sm"
              variant="outline"
              className="text-xs font-medium cursor-pointer rounded-xl border border-[#3F3F46] bg-[#27272A] text-[#FAFAFA] hover:bg-[#3F3F46]"
            >
              View Pipeline
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#27272A] py-14 px-4 text-center bg-[#09090B]/50">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/25 mb-4 shadow-sm">
                <HugeiconsIcon icon={Calendar03Icon} className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">No active applications yet</h3>
              <p className="text-xs text-[#A1A1AA] mt-1.5 max-w-sm">
                Get started by clicking &ldquo;Track New Application&rdquo; or explore matched opportunities in the Jobs tab.
              </p>
              <div className="mt-5">
                <Button
                  render={<Link href="/dashboard/status" />}
                  size="sm"
                  className="gap-1.5 text-xs font-semibold cursor-pointer rounded-xl bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white shadow-md shadow-purple-500/20"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                  Track First Application
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-[#FAFAFA]">{app.job_title}</h4>
                    <p className="text-xs text-[#A1A1AA]">{app.company_name} • {app.location || "Remote"}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[11px] border-[#3F3F46] text-[#FAFAFA]">
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
