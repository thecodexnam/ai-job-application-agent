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
} from "@hugeicons/core-free-icons";
import type { Tables } from "@/types/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch {}

  let applications: Tables<"job_applications">[] = [];
  try {
    const { data } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    applications = data || [];
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

  return (
    <div className="space-y-6 pb-8">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F0F0F]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Hi, {displayName}!
          </h1>
          <p className="text-sm text-[#5A5A5A] mt-0.5 font-medium">
            Search roles, prepare your materials, and track applications in one workspace.
          </p>
        </div>
      </div>

      {/* ── Hero Bento ── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#1A1A1A] bg-[#0F0F0F] text-white shadow-[6px_6px_0px_#1A1A1A]">
        {/* Accent dots */}
        <div className="pointer-events-none absolute top-4 right-4 size-32 rounded-full bg-[#C5F135]/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-24 rounded-full bg-[#6366F1]/15 blur-2xl" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-sm border border-[#C5F135]/40 bg-[#C5F135]/10 px-3 py-1 text-xs font-bold text-[#C5F135] uppercase tracking-widest">
              <HugeiconsIcon icon={SparklesIcon} className="size-3" />
              Job search workspace
            </div>

            <h2
              className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Keep your search moving
            </h2>

            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Find verified openings, prepare your resume, and keep every application organized.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                render={<Link href="/dashboard/jobs" />}
                className="gap-2 text-xs font-bold cursor-pointer rounded-md bg-[#C5F135] hover:bg-[#B0DC1A] text-[#0F0F0F] border-2 border-[#C5F135] shadow-[3px_3px_0px_rgba(197,241,53,0.3)] px-4 py-2"
              >
                <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
                Browse Jobs
              </Button>

              <Button
                render={<Link href="/dashboard/resume" />}
                variant="outline"
                className="gap-2 text-xs font-semibold cursor-pointer rounded-md border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 px-4 py-2"
              >
                <HugeiconsIcon icon={File02Icon} className="size-3.5 text-[#A1A1AA]" />
                Tailor Resume
              </Button>
            </div>
          </div>


        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Tracked",
            value: totalCount,
            unit: "roles",
            note: "Saved & tracked",
            icon: Briefcase02Icon,
            accent: "#0F0F0F",
            accentText: "#C5F135",
          },
          {
            label: "Submitted",
            value: appliedCount,
            unit: "sent",
            note: "Ready for follow-ups",
            icon: Task01Icon,
            accent: "#6366F1",
            accentText: "white",
          },
          {
            label: "Interviews",
            value: interviewingCount,
            unit: "roles",
            note: "In this stage",
            icon: Calendar03Icon,
            accent: "#E8E5D4",
            accentText: "#0F0F0F",
          },
          {
            label: "Offers",
            value: offerCount,
            unit: "roles",
            note: "In this stage",
            icon: SparklesIcon,
            accent: "#C5F135",
            accentText: "#0F0F0F",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border-2 border-[#1A1A1A] bg-white p-5 shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold text-[#5A5A5A] uppercase tracking-wider">{stat.label}</span>
              <div
                className="flex size-7 items-center justify-center rounded-md border-2 border-[#1A1A1A]"
                style={{ backgroundColor: stat.accent, color: stat.accentText }}
              >
                <HugeiconsIcon icon={stat.icon} className="size-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className="text-3xl sm:text-4xl font-black text-[#0F0F0F] tracking-tight tabular-nums"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {stat.value}
              </span>
              <span className="text-[11px] font-medium text-[#5A5A5A]">{stat.unit}</span>
            </div>
            <p className="text-[11px] text-[#6366F1] mt-2 font-bold flex items-center gap-1">
              <HugeiconsIcon icon={FlashIcon} className="size-3" />
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      {/* ── Middle Row: Heatmap + AI Tools ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_#1A1A1A]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#1A1A1A] gap-3">
            <div>
              <h3
                className="text-base font-black text-[#0F0F0F] flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <HugeiconsIcon icon={FlashIcon} className="size-4 text-[#C5F135]" />
                Application Velocity
              </h3>
              <p className="text-xs text-[#5A5A5A] mt-0.5 font-medium">
                Based on the roles you have actually added
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] text-[#5A5A5A] font-medium">
              <span>Low</span>
              <div className="flex items-center gap-1">
                <span className="size-2.5 rounded-xs border border-[#1A1A1A] bg-[#E8E5D4]" />
                <span className="size-2.5 rounded-xs border border-[#1A1A1A] bg-[#6366F1]/30" />
                <span className="size-2.5 rounded-xs border border-[#1A1A1A] bg-[#6366F1]" />
                <span className="size-2.5 rounded-xs border border-[#1A1A1A] bg-[#C5F135]" />
              </div>
              <span>Peak</span>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex h-32 items-end gap-1.5 sm:gap-2" role="img" aria-label="Applications added each day over the last 14 days">
              {activityDays.map((day) => (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-medium tabular-nums text-[#5A5A5A]">{day.count || ""}</span>
                  <div
                    className={`w-full max-w-8 border border-[#1A1A1A]/20 ${day.count ? "bg-[#C5F135]" : "bg-[#E8E5D4]"}`}
                    style={{ height: `${Math.max(6, (day.count / peakActivity) * 72)}px` }}
                    title={`${day.count} ${day.count === 1 ? "application" : "applications"} added on ${day.key}`}
                  />
                  <span className="text-[9px] text-[#77796f]">{day.label}</span>
                </div>
              ))}
            </div>
            <p className="pt-3 text-[11px] font-medium text-[#5A5A5A]">Applications added per day · last 14 days</p>
          </div>
        </div>

        {/* AI Copilot Tools */}
        <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_#1A1A1A] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1A1A1A]">
              <span className="text-xs font-black uppercase tracking-widest text-[#0F0F0F]">
                Quick access
              </span>
              <span className="text-[10px] text-[#5A5A5A] font-medium">Workspace</span>
            </div>

            <div className="space-y-2.5 pt-4">
              {[
                {
                  href: "/dashboard/jobs",
                  icon: Briefcase02Icon,
                  title: "Browse jobs",
                  desc: "Explore current openings",
                  color: "#6366F1",
                },
                {
                  href: "/dashboard/status",
                  icon: Task01Icon,
                  title: "Application tracker",
                  desc: "Review your saved roles",
                  color: "#C5F135",
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center justify-between p-2.5 rounded-lg border-2 border-[#1A1A1A] bg-[#F7F5EC] hover:bg-[#EDEBE0] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 items-center justify-center rounded-md border-2 border-[#1A1A1A]"
                      style={{ backgroundColor: tool.color }}
                    >
                      <HugeiconsIcon icon={tool.icon} className="size-4 text-[#0F0F0F]" />
                    </div>
                    <div>
                      <h4
                        className="text-xs font-bold text-[#0F0F0F]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {tool.title}
                      </h4>
                      <p className="text-[10px] text-[#5A5A5A] font-medium">{tool.desc}</p>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-3.5 text-[#5A5A5A] group-hover:text-[#0F0F0F] transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#1A1A1A]/15 bg-[#F7F5EC] p-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#5A5A5A]">Tracked applications</span>
            <span className="text-sm font-bold tabular-nums text-[#0F0F0F]">{totalCount}</span>
          </div>
        </div>
      </section>

      {/* ── Applications Pipeline ── */}
      <div className="rounded-xl border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_#1A1A1A] overflow-hidden">
        <div className="p-6 border-b-2 border-[#1A1A1A] flex items-center justify-between">
          <div>
            <h3
              className="text-base font-black text-[#0F0F0F]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Application Pipeline
            </h3>
            <p className="text-xs text-[#5A5A5A] font-medium">Active job applications & interview stages</p>
          </div>

          <Button
            render={<Link href="/dashboard/status" />}
            size="sm"
            className="text-xs font-bold cursor-pointer rounded-md border-2 border-[#1A1A1A] bg-[#E8E5D4] text-[#0F0F0F] hover:bg-[#DEDBD0] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all"
          >
            View Pipeline
          </Button>
        </div>

        <div className="p-6">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1A1A1A] py-14 px-4 text-center bg-[#F7F5EC]">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[#C5F135] border-2 border-[#1A1A1A] mb-4 shadow-[3px_3px_0px_#1A1A1A]">
                <HugeiconsIcon icon={Calendar03Icon} className="size-6 text-[#0F0F0F]" />
              </div>
              <h3
                className="text-sm font-black text-[#0F0F0F]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No tracked applications yet
              </h3>
              <p className="text-xs text-[#5A5A5A] mt-1.5 max-w-sm font-medium">
                Browse job openings and start an application to build your pipeline.
              </p>
              <div className="mt-5">
                <Button
                  render={<Link href="/dashboard/jobs" />}
                  size="sm"
                  className="gap-1.5 text-xs font-bold cursor-pointer rounded-md bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white border-2 border-[#0F0F0F] shadow-[3px_3px_0px_#C5F135] hover:shadow-[1px_1px_0px_#C5F135] transition-all"
                >
                  <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
                  Browse Jobs
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#1A1A1A]/10">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F0F0F]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {app.job_title}
                    </h4>
                    <p className="text-xs text-[#5A5A5A] font-medium">
                      {app.company_name} · {app.location || "Remote"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize text-[11px] border-2 border-[#1A1A1A] text-[#0F0F0F] font-bold bg-[#E8E5D4]"
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
