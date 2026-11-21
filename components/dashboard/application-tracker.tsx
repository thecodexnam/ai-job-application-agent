"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  Search01Icon,
  PlusSignIcon,
  LinkSquare01Icon,
  Calendar03Icon,
  Location01Icon,
  Delete02Icon,
  Edit02Icon,
  Task01Icon,
  SparklesIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  ArrowRight01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type ApplicationStage = "wishlist" | "applied" | "interviewing" | "offer" | "rejected";

export interface TrackedApplication {
  id: string;
  job_title: string;
  company_name: string;
  job_url: string | null;
  location: string | null;
  status: string;
  created_at: string;
  applied_at: string | null;
  notes: string | null;
  platform?: string | null;
  application_mode?: string | null;
  application_status?: string | null;
  browser_session_id?: string | null;
  live_debug_url?: string | null;
  missing_fields?: any[] | null;
  current_step?: string | null;
  error_message?: string | null;
  confirmation_details?: string | null;
  retry_count?: number | null;
}

const STAGES: {
  id: ApplicationStage;
  label: string;
  badgeBg: string;
  accent: string;
  topBorder: string;
}[] = [
  { id: "wishlist", label: "Wishlist", badgeBg: "bg-[#E8E5D4] text-[#171914]", accent: "#687064", topBorder: "border-[#687064]" },
  { id: "applied", label: "Applied", badgeBg: "bg-[#DDF19B] text-[#1B2710]", accent: "#7B9E32", topBorder: "border-[#7B9E32]" },
  { id: "interviewing", label: "Interviewing", badgeBg: "bg-[#EEF2FF] text-[#4338CA]", accent: "#6366F1", topBorder: "border-[#6366F1]" },
  { id: "offer", label: "Offer", badgeBg: "bg-emerald-100 text-emerald-900", accent: "#059669", topBorder: "border-emerald-600" },
  { id: "rejected", label: "Closed", badgeBg: "bg-rose-100 text-rose-900", accent: "#E11D48", topBorder: "border-rose-500" },
];

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export function ApplicationTracker({
  initialApplications,
}: {
  initialApplications: TrackedApplication[];
}) {
  const [applications, setApplications] = useState<TrackedApplication[]>(initialApplications);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newJobUrl, setNewJobUrl] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStatus, setNewStatus] = useState<ApplicationStage>("wishlist");
  const [newNotes, setNewNotes] = useState("");

  // Edit/Detail dialog state
  const [selectedApp, setSelectedApp] = useState<TrackedApplication | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrackedApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resume paused automation dialog state
  const [resumeApp, setResumeApp] = useState<TrackedApplication | null>(null);
  const [resumeInputs, setResumeInputs] = useState<Record<string, any>>({});
  const [isResuming, setIsResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  function handleOpenResumeDialog(app: TrackedApplication) {
    setResumeApp(app);
    setResumeError(null);
    const initialInputs: Record<string, any> = {};
    const missing = (app.missing_fields || []) as any[];
    missing.forEach((f: any) => {
      initialInputs[f.key] = f.currentValue || (f.options ? f.options[0] : "");
    });
    setResumeInputs(initialInputs);
  }

  async function handleResumeApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeApp) return;

    try {
      setIsResuming(true);
      setResumeError(null);

      const res = await fetch("/api/applications/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: resumeApp.id,
          updatedFields: resumeInputs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resume application.");
      }

      setApplications((items) =>
        items.map((item) =>
          item.id === resumeApp.id
            ? {
                ...item,
                application_status: "IN_PROGRESS",
                missing_fields: [],
                current_step: "resumed",
              }
            : item
        )
      );

      if (selectedApp && selectedApp.id === resumeApp.id) {
        setSelectedApp((prev) =>
          prev
            ? {
                ...prev,
                application_status: "IN_PROGRESS",
                missing_fields: [],
                current_step: "resumed",
              }
            : null
        );
      }

      setResumeApp(null);
    } catch (err: any) {
      setResumeError(err.message || "Failed to resume application.");
    } finally {
      setIsResuming(false);
    }
  }

  // Stage change handler with optimistic UI
  async function changeStage(id: string, status: ApplicationStage) {
    const previous = applications.find((a) => a.id === id)?.status;
    setError(null);
    setSavingId(id);
    setApplications((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item))
    );
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status } : null));
    }

    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not update application stage.");
      }
    } catch (cause) {
      if (previous) {
        setApplications((items) =>
          items.map((item) => (item.id === id ? { ...item, status: previous } : item))
        );
      }
      setError(cause instanceof Error ? cause.message : "Could not update application stage.");
    } finally {
      setSavingId(null);
    }
  }

  // Create manual application handler
  async function handleCreateApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobTitle.trim() || !newCompanyName.trim()) return;

    try {
      setIsAdding(true);
      setError(null);
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: newJobTitle,
          company_name: newCompanyName,
          job_url: newJobUrl || null,
          location: newLocation || null,
          status: newStatus,
          notes: newNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create application.");
      }

      setApplications((prev) => [data.application, ...prev]);
      setIsAddOpen(false);
      setNewJobTitle("");
      setNewCompanyName("");
      setNewJobUrl("");
      setNewLocation("");
      setNewStatus("wishlist");
      setNewNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to add application.");
    } finally {
      setIsAdding(false);
    }
  }

  // Save notes handler
  async function handleSaveNotes() {
    if (!selectedApp) return;
    try {
      setIsEditingNotes(true);
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedApp.id,
          notes: editNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save notes.");
      }

      setApplications((items) =>
        items.map((item) => (item.id === selectedApp.id ? { ...item, notes: editNotes } : item))
      );
      setSelectedApp((prev) => (prev ? { ...prev, notes: editNotes } : null));
    } catch (err: any) {
      setError(err.message || "Failed to save notes.");
    } finally {
      setIsEditingNotes(false);
    }
  }

  // Delete application handler
  async function handleDeleteApplication() {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/applications?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete application.");
      }

      setApplications((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (selectedApp?.id === deleteTarget.id) {
        setSelectedApp(null);
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete application.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered applications
  const filteredApplications = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      if (stageFilter !== "all" && app.status !== stageFilter) return false;
      if (q) {
        const matchTitle = app.job_title.toLowerCase().includes(q);
        const matchCompany = app.company_name.toLowerCase().includes(q);
        const matchLocation = (app.location || "").toLowerCase().includes(q);
        const matchNotes = (app.notes || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchLocation && !matchNotes) return false;
      }
      return true;
    });
  }, [applications, searchQuery, stageFilter]);

  // Stage counts for quick stats
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      wishlist: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  }, [applications]);

  function renderAutomationBadge(app: TrackedApplication) {
    if (app.application_mode !== "automated" && !app.application_status) return null;
    const status = app.application_status || "PENDING";

    if (status === "SUBMITTED" || status === "Submitted") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#DDF19B] text-[#1B2710] font-bold text-[9px] border border-[#9FB944]">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-2.5 text-emerald-800" />
          AI Submitted
        </span>
      );
    }
    if (
      status === "MISSING_PROFILE_INFO" ||
      status === "Missing Profile Info" ||
      status === "Resume Required"
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px] border border-amber-300">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-2.5 text-amber-700" />
          Missing Info
        </span>
      );
    }
    if (status === "NEEDS_USER_ACTION" || status === "Ready for Review") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px] border border-amber-300">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-2.5 text-amber-700" />
          Action Needed
        </span>
      );
    }
    if (
      status === "IN_PROGRESS" ||
      status === "Preparing" ||
      status === "In Progress"
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[9px] border border-blue-300">
          <HugeiconsIcon icon={Loading03Icon} className="size-2.5 text-blue-700 animate-spin" />
          AI Applying...
        </span>
      );
    }
    if (status === "FAILED" || status === "Failed") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[9px] border border-rose-300">
          <HugeiconsIcon icon={Cancel01Icon} className="size-2.5 text-rose-700" />
          AI Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold text-[9px] border border-gray-300">
        <HugeiconsIcon icon={SparklesIcon} className="size-2.5" />
        AI Queued
      </span>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <header className="flex flex-col gap-4 border-b border-[#1A1A1A]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-[#687064]">Your search, organized</p>
          <h1 className="text-2xl font-bold leading-tight text-[#171914] sm:text-3xl">
            Application tracker
          </h1>
          <p className="text-sm text-[#5A5D55]">
            Keep your saved roles and application progress in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-9 gap-2 rounded-md bg-[#172013] px-3.5 text-xs font-semibold text-white hover:bg-[#26321E] cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            Add Application
          </Button>

          <Button
            render={<Link href="/dashboard/jobs" />}
            className="h-9 gap-2 rounded-md border border-[#9FB944] bg-[#DDF19B] px-3.5 text-xs font-bold text-[#1B2710] hover:bg-[#CFEA78] cursor-pointer"
          >
            <HugeiconsIcon icon={Briefcase02Icon} className="size-3.5" />
            Find Jobs
          </Button>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between border-l-2 border-rose-600 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 rounded-sm"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ── Summary Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGES.map((stage) => {
          const count = stageCounts[stage.id] || 0;
          return (
            <button
              key={stage.id}
              onClick={() => setStageFilter(stageFilter === stage.id ? "all" : stage.id)}
              className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                stageFilter === stage.id
                  ? "border-[#1A1A1A]/40 bg-white shadow-xs"
                  : "border-[#1A1A1A]/15 bg-white/70 hover:bg-white hover:border-[#1A1A1A]/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#687064]">
                  {stage.label}
                </span>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: stage.accent }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#171914] tabular-nums">
                  {count}
                </span>
                <span className="text-[10px] text-[#687064] font-medium">
                  {applications.length > 0
                    ? `${Math.round((count / applications.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: Search, Filters, View Switcher ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-[#1A1A1A]/15 bg-white p-3 rounded-lg">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#687064]"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or note..."
              className="h-9 rounded-md border-[#1A1A1A]/20 bg-[#FBFAF6] pl-9 text-xs"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 rounded-md border border-[#1A1A1A]/20 bg-[#FBFAF6] px-2.5 text-xs text-[#22251F] outline-none cursor-pointer"
          >
            <option value="all">All Stages ({applications.length})</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({stageCounts[s.id] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Kanban vs Table */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex items-center p-0.5 rounded-md border border-[#1A1A1A]/20 bg-[#FBFAF6]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                viewMode === "kanban"
                  ? "bg-[#172013] text-white"
                  : "text-[#687064] hover:text-[#171914]"
              }`}
            >
              Columns
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                viewMode === "table"
                  ? "bg-[#172013] text-white"
                  : "text-[#687064] hover:text-[#171914]"
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* ── Applications Content ── */}
      {applications.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[#A7A596] bg-white/60 px-5 text-center rounded-lg">
          <span className="text-base font-semibold text-[#171914]">No tracked applications yet</span>
          <p className="mt-1.5 max-w-md text-xs text-[#687064]">
            Save a role from job search or start an application to see it here.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => setIsAddOpen(true)}
              size="sm"
              className="h-8 gap-1.5 rounded-md bg-[#172013] px-3 text-xs text-white hover:bg-[#26321E]"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              Add Manually
            </Button>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#304019] hover:underline"
            >
              Browse verified jobs <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        /* ════════════ KANBAN BOARD VIEW ════════════ */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 items-start">
          {STAGES.map((stage) => {
            const items = filteredApplications.filter((app) => app.status === stage.id);
            return (
              <section
                key={stage.id}
                aria-label={`${stage.label}: ${items.length} applications`}
                className={`min-w-0 border-t-2 ${stage.topBorder} bg-[#F7F6F0] rounded-none`}
              >
                {/* Stage Header */}
                <header className="flex items-center justify-between gap-2 border-b border-[#25271f]/15 px-3 py-3 bg-[#F7F6F0]">
                  <h2 className="text-xs font-semibold text-[#171914] uppercase tracking-wider">
                    {stage.label}
                  </h2>
                  <span
                    className={`min-w-6 rounded-sm px-1.5 py-0.5 text-center text-xs font-semibold ${stage.badgeBg}`}
                  >
                    {items.length}
                  </span>
                </header>

                {/* Stage Cards Container */}
                <div className="space-y-2 p-2 min-h-64 max-h-[70vh] overflow-y-auto">
                  {items.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-[#88897f]">Nothing here yet</p>
                  )}
                  {items.map((app) => (
                    <article
                      key={app.id}
                      className="border border-[#D8D7CD] bg-white p-3 shadow-xs hover:border-[#1A1A1A]/35 transition-colors space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3
                            className="text-xs font-semibold text-[#171914] leading-snug truncate hover:underline cursor-pointer"
                            onClick={() => {
                              setSelectedApp(app);
                              setEditNotes(app.notes || "");
                            }}
                          >
                            {app.job_title}
                          </h3>
                          <p className="mt-0.5 truncate text-[11px] text-[#687064]">
                            {app.company_name}
                          </p>
                        </div>

                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open posting"
                            className="shrink-0 text-[#687064] hover:text-[#171914]"
                          >
                            <HugeiconsIcon icon={LinkSquare01Icon} className="size-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#687064]">
                        <span>{app.location || "Location not listed"} · {formatDate(app.created_at)}</span>
                        {renderAutomationBadge(app)}
                      </div>

                      {/* Action banner if missing info or action required */}
                      {(app.application_status === "MISSING_PROFILE_INFO" ||
                        app.application_status === "Missing Profile Info" ||
                        app.application_status === "Resume Required" ||
                        app.application_status === "NEEDS_USER_ACTION") && (
                        <div className="p-2 rounded bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-semibold truncate">
                            {app.application_status.includes("MISSING") || app.application_status.includes("Resume")
                              ? "Profile info missing"
                              : "Action required"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResumeDialog(app);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[9px] cursor-pointer"
                          >
                            Provide Info
                          </button>
                        </div>
                      )}

                      {/* Notes preview if any */}
                      {app.notes && (
                        <p className="text-[10px] text-[#5A5D55] bg-[#FBFAF6] p-1.5 rounded-sm border border-[#1A1A1A]/10 line-clamp-2 italic">
                          &quot;{app.notes}&quot;
                        </p>
                      )}

                      {/* Move stage control */}
                      <div className="pt-2 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-2">
                        <select
                          value={app.status}
                          disabled={savingId === app.id}
                          onChange={(e) => changeStage(app.id, e.target.value as ApplicationStage)}
                          className="h-7 w-full rounded-sm border border-[#B7B8AC] bg-[#FBFAF6] px-1.5 text-[11px] text-[#171914] outline-none cursor-pointer focus:border-[#687064]"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move: {s.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setEditNotes(app.notes || "");
                          }}
                          title="Edit Notes"
                          className="size-7 rounded-sm border border-[#B7B8AC] bg-white hover:bg-[#F2F0E8] flex items-center justify-center text-[#171914] shrink-0"
                        >
                          <HugeiconsIcon icon={Edit02Icon} className="size-3" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* ════════════ TABLE LIST VIEW ════════════ */
        <div className="rounded-lg border border-[#1A1A1A]/15 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1A1A1A]/15 bg-[#F2F0E8] text-[#687064] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-4">Job Title & Company</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Date Added</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/10">
                {filteredApplications.map((app) => {
                  const stageObj = STAGES.find((s) => s.id === app.status) || STAGES[0];
                  return (
                    <tr key={app.id} className="hover:bg-[#FBFAF6] transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="font-semibold text-[#171914] text-xs">
                          {app.job_title}
                        </div>
                        <div className="text-[11px] text-[#687064] flex items-center gap-2 flex-wrap mt-0.5">
                          <span>{app.company_name}</span>
                          {renderAutomationBadge(app)}
                        </div>
                      </td>
                      <td className="p-3.5 text-[#5A5D55] font-medium">
                        {app.location || "Remote"}
                      </td>
                      <td className="p-3.5">
                        <select
                          value={app.status}
                          disabled={savingId === app.id}
                          onChange={(e) => changeStage(app.id, e.target.value as ApplicationStage)}
                          className={`h-7 px-2 text-[11px] font-semibold rounded-sm border border-[#1A1A1A]/20 cursor-pointer ${stageObj.badgeBg}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5 text-[#687064]">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-[#5A5D55]">
                        {app.notes ? (
                          <span className="italic">&quot;{app.notes}&quot;</span>
                        ) : (
                          <span className="text-[#A7A596]">No notes</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-4 text-right space-x-1.5 whitespace-nowrap">
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-md border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F0E8] text-[#171914]"
                            title="Open original job link"
                          >
                            <HugeiconsIcon icon={LinkSquare01Icon} className="size-3.5" />
                          </a>
                        )}
                        {(app.application_status === "MISSING_PROFILE_INFO" ||
                          app.application_status === "Missing Profile Info" ||
                          app.application_status === "Resume Required" ||
                          app.application_status === "NEEDS_USER_ACTION") && (
                          <button
                            type="button"
                            onClick={() => handleOpenResumeDialog(app)}
                            className="inline-flex items-center gap-1 h-7 px-2 text-[10px] font-bold rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 cursor-pointer"
                            title="Provide missing info to resume automation"
                          >
                            <HugeiconsIcon icon={AlertCircleIcon} className="size-3 text-amber-800" />
                            <span>Resume</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setEditNotes(app.notes || "");
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-md border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F0E8] text-[#171914]"
                          title="View / Edit Application Details"
                        >
                          <HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(app)}
                          className="inline-flex size-7 items-center justify-center rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-700"
                          title="Delete Application"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dialog: Add Application Manually ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-[#F7F6F0] border border-[#1A1A1A]/20 text-[#171914] rounded-lg shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 bg-white border-b border-[#1A1A1A]/10">
            <DialogTitle className="text-lg font-bold text-[#171914]">
              Add Tracked Application
            </DialogTitle>
            <DialogDescription className="text-xs text-[#687064] mt-0.5">
              Manually add an application to track its stages and notes in your pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateApplication} className="p-5 space-y-3.5 bg-[#F7F6F0]">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#171914]">
                Job Title <span className="text-rose-600">*</span>
              </label>
              <Input
                required
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="h-9 text-xs border-[#1A1A1A]/20 bg-white rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#171914]">
                Company Name <span className="text-rose-600">*</span>
              </label>
              <Input
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Stripe"
                className="h-9 text-xs border-[#1A1A1A]/20 bg-white rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#171914]">Location</label>
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Remote"
                  className="h-9 text-xs border-[#1A1A1A]/20 bg-white rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#171914]">Initial Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStage)}
                  className="h-9 w-full px-2.5 text-xs font-semibold rounded-md border border-[#1A1A1A]/20 bg-white"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#171914]">Job Posting URL</label>
              <Input
                type="url"
                value={newJobUrl}
                onChange={(e) => setNewJobUrl(e.target.value)}
                placeholder="https://boards.greenhouse.io/..."
                className="h-9 text-xs border-[#1A1A1A]/20 bg-white rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#171914]">Notes / Next Steps</label>
              <textarea
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Screening call scheduled, referral from team member..."
                className="w-full p-2.5 text-xs rounded-md border border-[#1A1A1A]/20 bg-white focus:outline-none focus:ring-1 focus:ring-[#172013]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="text-xs font-semibold h-8.5 px-3 rounded-md border-[#1A1A1A]/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="bg-[#172013] hover:bg-[#26321E] text-white font-semibold text-xs h-8.5 px-4 rounded-md cursor-pointer"
              >
                {isAdding ? "Adding..." : "Add to Pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: View / Edit Application Detail & Notes ── */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg bg-[#F7F6F0] border border-[#1A1A1A]/20 text-[#171914] rounded-lg shadow-xl p-0 overflow-hidden">
          {selectedApp && (
            <>
              <DialogHeader className="p-5 bg-white border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#F2F0E8] border border-[#1A1A1A]/15 text-[#171914] px-2 py-0.5 rounded-sm">
                    {selectedApp.status}
                  </span>
                  <span className="text-[11px] text-[#687064]">
                    Added {formatDate(selectedApp.created_at)}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold text-[#171914] mt-1">
                  {selectedApp.job_title}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-[#687064]">
                  {selectedApp.company_name} {selectedApp.location && `· ${selectedApp.location}`}
                </DialogDescription>
              </DialogHeader>

              <div className="p-5 space-y-3.5 bg-[#F7F6F0]">
                {/* Stage Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Current Stage</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => changeStage(selectedApp.id, e.target.value as ApplicationStage)}
                    className="w-full h-9 px-2.5 text-xs font-semibold rounded-md border border-[#1A1A1A]/20 bg-white cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Link */}
                {selectedApp.job_url && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#687064]">Job Posting Link</label>
                    <div>
                      <a
                        href={selectedApp.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#304019] hover:underline break-all"
                      >
                        <span>Open Application Link</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Automation Details if available */}
                {(selectedApp.application_mode || selectedApp.browser_session_id || selectedApp.application_status) && (
                  <div className="p-3.5 rounded-md bg-white border border-[#1A1A1A]/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#1A1A1A]/10">
                      <span className="text-[#687064] text-[11px] font-medium">Application Mode:</span>
                      <span className="font-semibold text-[#171914] flex items-center gap-1">
                        {selectedApp.application_mode === "automated" ? (
                          <>
                            <HugeiconsIcon icon={SparklesIcon} className="size-3 text-emerald-700" />
                            AI Automated
                          </>
                        ) : (
                          "Manual"
                        )}
                      </span>
                    </div>

                    {selectedApp.application_status && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#1A1A1A]/10">
                        <span className="text-[#687064] text-[11px] font-medium">Automation Status:</span>
                        {renderAutomationBadge(selectedApp)}
                      </div>
                    )}

                    {selectedApp.current_step && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#1A1A1A]/10">
                        <span className="text-[#687064] text-[11px] font-medium">Workflow Step:</span>
                        <span className="font-mono text-[11px] text-[#171914] font-medium capitalize">
                          {selectedApp.current_step.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}

                    {selectedApp.confirmation_details && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 text-emerald-700" />
                          Confirmation Received:
                        </span>
                        <p>{selectedApp.confirmation_details}</p>
                      </div>
                    )}

                    {selectedApp.error_message && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-950 text-[11px] space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <HugeiconsIcon icon={AlertCircleIcon} className="size-3 text-rose-700" />
                          Issue Encountered:
                        </span>
                        <p>{selectedApp.error_message}</p>
                      </div>
                    )}

                    {/* Missing fields notice & resume button */}
                    {(selectedApp.application_status === "MISSING_PROFILE_INFO" ||
                      selectedApp.application_status === "Missing Profile Info" ||
                      selectedApp.application_status === "Resume Required" ||
                      selectedApp.application_status === "NEEDS_USER_ACTION") && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-[11px]">Action Required to Resume Application</p>
                            <p className="text-[10px] text-amber-900 mt-0.5">
                              {selectedApp.missing_fields && selectedApp.missing_fields.length > 0
                                ? `Missing ${selectedApp.missing_fields.length} required field(s): ${selectedApp.missing_fields.map((f: any) => f.label || f.key).join(", ")}`
                                : "Candidate action is required to continue."}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenResumeDialog(selectedApp)}
                            className="h-7 px-3 bg-[#172013] hover:bg-[#26321E] text-white text-[10px] font-bold rounded cursor-pointer shrink-0"
                          >
                            Provide Info & Resume
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Live Browser Link */}
                    {selectedApp.live_debug_url && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[#687064] text-[11px] font-medium">Cloud Browser Inspector:</span>
                        <a
                          href={selectedApp.live_debug_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 underline font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <span>Open Live Browser</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                        </a>
                      </div>
                    )}

                    {selectedApp.browser_session_id && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[#687064] text-[11px] font-medium">Session ID:</span>
                        <span className="font-mono text-[10px] text-[#171914] font-bold bg-[#F7F6F0] px-1.5 py-0.5 rounded border border-[#1A1A1A]/10 truncate max-w-xs">
                          {selectedApp.browser_session_id}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Editor */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">
                    Application Notes
                  </label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add interview dates, recruiter contacts, follow-up reminders..."
                    className="w-full p-2.5 text-xs rounded-md border border-[#1A1A1A]/20 bg-white focus:outline-none focus:ring-1 focus:ring-[#172013]"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDeleteTarget(selectedApp);
                    }}
                    className="text-xs font-semibold text-rose-700 hover:bg-rose-50 gap-1 px-2.5 h-8 rounded-md"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    Delete
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedApp(null)}
                      className="border-[#1A1A1A]/20 text-xs h-8 px-3 rounded-md"
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isEditingNotes}
                      className="bg-[#172013] hover:bg-[#26321E] text-white font-semibold text-xs h-8 px-3.5 rounded-md cursor-pointer"
                    >
                      {isEditingNotes ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-[#F7F6F0] border border-[#1A1A1A]/20 text-[#171914] rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Remove Application
            </DialogTitle>
            <DialogDescription className="text-xs text-[#687064] mt-1">
              Are you sure you want to remove <strong className="text-[#171914]">{deleteTarget?.job_title}</strong> at <strong className="text-[#171914]">{deleteTarget?.company_name}</strong> from your pipeline?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="text-xs border-[#1A1A1A]/20 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteApplication}
              disabled={isDeleting}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-md"
            >
              {isDeleting ? "Deleting..." : "Delete Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Provide Missing Info & Resume Automation ── */}
      <Dialog open={!!resumeApp} onOpenChange={(open) => !open && setResumeApp(null)}>
        <DialogContent className="sm:max-w-lg bg-[#F7F6F0] border border-[#1A1A1A]/20 text-[#171914] rounded-lg shadow-xl p-0 overflow-hidden">
          {resumeApp && (
            <>
              <DialogHeader className="p-5 bg-white border-b border-[#1A1A1A]/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#687064]">
                    AI Application Automation
                  </span>
                  <span className="text-[#687064]">•</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    Missing Information Required
                  </span>
                </div>
                <DialogTitle className="text-base font-bold text-[#171914] mt-1">
                  Complete Details for {resumeApp.job_title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#5A5D55]">
                  {resumeApp.company_name} requires the following information. Enter your verified answers below to resume the AI application workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="p-5 space-y-4 bg-[#F7F6F0]">
                {resumeError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
                    <span>{resumeError}</span>
                    <button onClick={() => setResumeError(null)} className="font-bold text-rose-700">
                      ✕
                    </button>
                  </div>
                )}

                <form onSubmit={handleResumeApplication} className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {((resumeApp.missing_fields || []) as any[]).map((field: any) => (
                    <div key={field.key} className="space-y-1 text-left">
                      <label className="text-xs font-semibold text-[#171914] flex items-center justify-between">
                        <span>{field.label}</span>
                        {field.required && (
                          <span className="text-[10px] text-rose-600 font-semibold">Required</span>
                        )}
                      </label>

                      {field.description && (
                        <p className="text-[11px] text-[#687064]">{field.description}</p>
                      )}

                      {field.type === "select" && field.options ? (
                        <select
                          required={field.required}
                          value={resumeInputs[field.key] || ""}
                          onChange={(e) =>
                            setResumeInputs({ ...resumeInputs, [field.key]: e.target.value })
                          }
                          className="w-full h-9 px-3 text-xs font-medium rounded-md border border-[#1A1A1A]/20 bg-white focus:outline-none"
                        >
                          <option value="">Select an option...</option>
                          {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          required={field.required}
                          rows={3}
                          value={resumeInputs[field.key] || ""}
                          onChange={(e) =>
                            setResumeInputs({ ...resumeInputs, [field.key]: e.target.value })
                          }
                          placeholder={`Enter ${field.label}...`}
                          className="w-full p-2.5 text-xs font-medium rounded-md border border-[#1A1A1A]/20 bg-white focus:outline-none"
                        />
                      ) : (
                        <input
                          type={
                            field.type === "tel"
                              ? "tel"
                              : field.type === "email"
                              ? "email"
                              : "text"
                          }
                          required={field.required}
                          value={resumeInputs[field.key] || ""}
                          onChange={(e) =>
                            setResumeInputs({ ...resumeInputs, [field.key]: e.target.value })
                          }
                          placeholder={`Enter your ${field.label}...`}
                          className="w-full h-9 px-3 text-xs font-medium rounded-md border border-[#1A1A1A]/20 bg-white focus:outline-none"
                        />
                      )}
                    </div>
                  ))}

                  {/* If resume document is required */}
                  {((resumeApp.missing_fields || []) as any[]).some((f: any) => f.key === "resume") && (
                    <div className="p-3 bg-amber-50 rounded-md border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Resume document missing</p>
                        <p className="text-[11px] text-amber-900">
                          Please upload your resume in the{" "}
                          <a href="/dashboard/resume" target="_blank" className="underline font-bold text-emerald-800">
                            Resume Studio
                          </a>{" "}
                          before resuming.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#1A1A1A]/10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setResumeApp(null)}
                      className="text-xs font-semibold text-[#5A5D55] h-8.5 px-3 rounded-md"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isResuming}
                      className="h-8.5 px-4 rounded-md bg-[#172013] text-white hover:bg-[#26321E] font-semibold text-xs cursor-pointer"
                    >
                      {isResuming ? "Resuming Automation..." : "Save & Resume Automation"}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
