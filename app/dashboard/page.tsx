import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  File02Icon,
  Calendar03Icon,
  Briefcase02Icon,
  Task01Icon,
  FlashIcon,
  ArrowRight01Icon,
  UserIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import type { Tables } from "@/types/database.types";

export const metadata = {
  title: "Dashboard Overview | JobBuddy AI",
  description: "Your autonomous career copilot dashboard. Search roles, manage resumes, and track applications.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  let profile = null;
  let resumesCount = 0;
  let applications: Tables<"job_applications">[] = [];
  let skillsCount = 0;

  try {
    const [profileRes, resumesRes, appsRes, skillsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("resumes").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profile_skills").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

    profile = profileRes.data;
    resumesCount = resumesRes.count || 0;
    applications = appsRes.data || [];
    skillsCount = skillsRes.count || 0;
  } catch {}

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Job Hunter";

  const totalCount = applications.length;
  const interviewingCount = applications.filter((a) => a.status === "interviewing").length;
  const offerCount = applications.filter((a) => a.status === "offer").length;
  const appliedCount = applications.filter((a) => a.status === "applied").length;

  const activityDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      count: applications.filter((application) => application.created_at.slice(0, 10) === key).length,
    };
  });
  const peakActivity = Math.max(1, ...activityDays.map((day) => day.count));

  // Checklist items
  const checklist = [
    {
      title: "Upload master resume",
      desc: "Auto-extract skills & work history",
      href: "/dashboard/resume",
      isComplete: resumesCount > 0,
      actionText: resumesCount > 0 ? "Manage" : "Upload",
    },
    {
      title: "Candidate profile",
      desc: "Add skills, experience & target roles",
      href: "/dashboard/profile",
      isComplete: Boolean(profile?.full_name && skillsCount > 0),
      actionText: "Edit",
    },
    {
      title: "Discover job matches",
      desc: "Scan Greenhouse, Lever & Workable",
      href: "/dashboard/jobs",
      isComplete: totalCount > 0,
      actionText: "Search",
    },
    {
      title: "Track applications",
      desc: "Organize applications by stage",
      href: "/dashboard/status",
      isComplete: appliedCount > 0 || interviewingCount > 0 || offerCount > 0,
      actionText: "View",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 border-b border-[#1A1A1A]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-[#687064]">Workspace overview</p>
          <h1 className="text-2xl font-bold leading-tight text-[#171914] sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-[#5A5D55]">
            Search verified openings, prepare your resume, and track applications in one workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            render={<Link href="/dashboard/jobs" />}
            className="h-9 gap-2 rounded-md bg-[#172013] px-3.5 text-xs font-semibold text-white hover:bg-[#26321E] cursor-pointer"
          >
            <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
            Discover Jobs
          </Button>

          <Button
            render={<Link href="/dashboard/resume" />}
            variant="outline"
            className="h-9 gap-2 rounded-md border border-[#1A1A1A]/25 bg-white px-3.5 text-xs font-semibold text-[#171914] hover:bg-[#F2F0E8] cursor-pointer"
          >
            <HugeiconsIcon icon={File02Icon} className="size-3.5 text-[#687064]" />
            Resume Studio
          </Button>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="rounded-lg border border-[#1A1A1A]/15 bg-[#172013] text-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-sm border border-[#DDF19B]/30 bg-[#DDF19B]/10 px-2 py-0.5 text-[10px] font-semibold text-[#DDF19B] uppercase tracking-wider">
              <HugeiconsIcon icon={SparklesIcon} className="size-3" />
              Autonomous Career Agent
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Accelerate your job search
            </h2>

            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Scan Greenhouse, Lever, Workable, Wellfound, Indeed, and Remotive with direct verified ATS apply links and candidate profile matching.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button
                render={<Link href="/dashboard/jobs" />}
                className="h-8.5 gap-1.5 rounded-md border border-[#9FB944] bg-[#DDF19B] px-3 text-xs font-bold text-[#1B2710] hover:bg-[#CFEA78] cursor-pointer"
              >
                <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
                Browse Matches
              </Button>

              <Button
                render={<Link href="/dashboard/status" />}
                variant="outline"
                className="h-8.5 gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
              >
                <HugeiconsIcon icon={Task01Icon} className="size-3.5 text-[#A1A1AA]" />
                Application Pipeline
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0">
            <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-[#A1A1AA] tracking-wider">
                ATS Sources
              </span>
              <p className="text-lg font-bold text-[#DDF19B]">7 Portals</p>
              <span className="text-[10px] text-[#A1A1AA]">Greenhouse, Lever & more</span>
            </div>
            <div className="p-3.5 rounded-md bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-[#A1A1AA] tracking-wider">
                Monthly AI Quota
              </span>
              <p className="text-lg font-bold text-white">Pro Plan</p>
              <span className="text-[10px] text-[#A1A1AA]">Unlimited Search</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Tracked",
            value: totalCount,
            unit: "roles",
            note: "Saved & in pipeline",
            icon: Briefcase02Icon,
            iconBg: "bg-[#E9F2D1] text-[#304019]",
          },
          {
            label: "Applied",
            value: appliedCount,
            unit: "sent",
            note: "Active submissions",
            icon: Task01Icon,
            iconBg: "bg-[#EEF2FF] text-[#4338CA]",
          },
          {
            label: "Interviews",
            value: interviewingCount,
            unit: "roles",
            note: "In progress",
            icon: Calendar03Icon,
            iconBg: "bg-[#F2F0E8] text-[#171914]",
          },
          {
            label: "Offers",
            value: offerCount,
            unit: "roles",
            note: "Offers received",
            icon: SparklesIcon,
            iconBg: "bg-emerald-50 text-emerald-800",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-[#1A1A1A]/15 bg-white p-4 rounded-lg hover:border-[#1A1A1A]/35 transition-colors"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-[10px] font-semibold text-[#687064] uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`flex size-6 items-center justify-center rounded-md ${stat.iconBg}`}>
                <HugeiconsIcon icon={stat.icon} className="size-3" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-[#171914] tracking-tight tabular-nums">
                {stat.value}
              </span>
              <span className="text-[10px] text-[#687064] font-medium">{stat.unit}</span>
            </div>
            <p className="text-[10px] text-[#5A5D55] mt-1.5 font-medium flex items-center gap-1">
              <HugeiconsIcon icon={FlashIcon} className="size-2.5 text-[#304019]" />
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      {/* ── Middle Row: Velocity + Checklist ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity Velocity */}
        <div className="lg:col-span-2 border border-[#1A1A1A]/15 bg-white p-5 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#1A1A1A]/10 gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#171914] flex items-center gap-1.5">
                  <HugeiconsIcon icon={FlashIcon} className="size-3.5 text-[#304019]" />
                  Application Velocity
                </h3>
                <p className="text-[11px] text-[#687064]">
                  Activity over the past 14 days
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-2 text-[10px] text-[#687064]">
                <span>0</span>
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-xs bg-[#E8E5D4]" />
                  <span className="size-2 rounded-xs bg-[#DDF19B]" />
                  <span className="size-2 rounded-xs bg-[#7B9E32]" />
                  <span className="size-2 rounded-xs bg-[#172013]" />
                </div>
                <span>Peak</span>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex h-28 items-end gap-1.5 sm:gap-2" role="img" aria-label="Applications added each day over the last 14 days">
                {activityDays.map((day) => (
                  <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[10px] font-medium tabular-nums text-[#687064]">{day.count || ""}</span>
                    <div
                      className={`w-full max-w-8 rounded-xs border border-[#1A1A1A]/15 transition-all ${
                        day.count ? "bg-[#7B9E32]" : "bg-[#E8E5D4]"
                      }`}
                      style={{ height: `${Math.max(6, (day.count / peakActivity) * 64)}px` }}
                      title={`${day.count} ${day.count === 1 ? "application" : "applications"} added on ${day.key}`}
                    />
                    <span className="text-[9px] text-[#687064]">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="pt-3 border-t border-[#1A1A1A]/10 text-[10px] text-[#687064]">
            Applications added per day · last 14 days
          </p>
        </div>

        {/* Action Checklist */}
        <div className="border border-[#1A1A1A]/15 bg-white p-5 rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1A1A1A]/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#687064]">
                Getting Started
              </span>
              <span className="text-[10px] text-[#304019] font-bold">Launchpad</span>
            </div>

            <div className="space-y-2 pt-3">
              {checklist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-2 rounded-md border border-[#1A1A1A]/10 bg-[#FBFAF6] hover:bg-[#F2F0E8] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                        item.isComplete
                          ? "border-[#7B9E32] bg-[#E9F2D1] text-[#304019]"
                          : "border-[#A7A596] bg-white"
                      }`}
                    >
                      {item.isComplete && <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#171914] truncate">{item.title}</h4>
                      <p className="text-[10px] text-[#687064] truncate">{item.desc}</p>
                    </div>
                  </div>

                  <Link
                    href={item.href}
                    className="shrink-0 text-[10px] font-semibold text-[#304019] hover:underline px-1.5"
                  >
                    {item.actionText} →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#1A1A1A]/10 bg-[#FBFAF6] p-2.5 flex items-center justify-between">
            <span className="text-[10px] text-[#687064] font-medium">Pipeline Count</span>
            <span className="text-xs font-bold tabular-nums text-[#171914]">{totalCount} roles</span>
          </div>
        </div>
      </section>

      {/* ── Applications Pipeline Preview ── */}
      <div className="rounded-lg border border-[#1A1A1A]/15 bg-white overflow-hidden">
        <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#171914]">
              Recent Pipeline Activity
            </h3>
            <p className="text-xs text-[#687064]">Your latest saved roles and submissions</p>
          </div>

          <Button
            render={<Link href="/dashboard/status" />}
            size="sm"
            className="text-xs font-semibold rounded-md border border-[#1A1A1A]/20 bg-white text-[#171914] hover:bg-[#F2F0E8] px-3 h-8 cursor-pointer"
          >
            Open Pipeline
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
          </Button>
        </div>

        <div className="p-4">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1A1A1A]/20 py-10 px-4 text-center bg-[#FBFAF6]">
              <div className="flex size-10 items-center justify-center rounded-md bg-[#E9F2D1] text-[#304019] mb-3">
                <HugeiconsIcon icon={Calendar03Icon} className="size-5" />
              </div>
              <h3 className="text-xs font-bold text-[#171914]">
                No tracked applications yet
              </h3>
              <p className="text-[11px] text-[#687064] mt-1 max-w-sm">
                Browse verified job openings and start an application to build your pipeline.
              </p>
              <div className="mt-3.5">
                <Button
                  render={<Link href="/dashboard/jobs" />}
                  size="sm"
                  className="gap-1.5 text-xs font-semibold rounded-md bg-[#172013] text-white hover:bg-[#26321E] px-3 h-8"
                >
                  <HugeiconsIcon icon={Briefcase02Icon} className="size-3" />
                  Browse Jobs
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]/10">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3 hover:bg-[#FBFAF6] px-2 rounded-md transition-colors">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-[#171914] truncate">
                      {app.job_title}
                    </h4>
                    <p className="text-[11px] text-[#687064] truncate mt-0.5">
                      {app.company_name} · {app.location || "Remote"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] border border-[#A7A395]/30 bg-[#F2F0E8] text-[#383B35] font-semibold shrink-0"
                  >
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
