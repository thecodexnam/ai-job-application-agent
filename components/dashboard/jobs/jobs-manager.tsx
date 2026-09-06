"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { JobItem, JobPlatform } from "@/types/job";
import { PlatformSelector } from "./platform-selector";
import { JobCard } from "./job-card";
import { JobDetailDialog } from "./job-detail-dialog";
import { JobsSidebar } from "./jobs-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  RefreshIcon,
  Bookmark02Icon,
  SparklesIcon,
  Building02Icon,
  FilterIcon,
  AlertCircleIcon,
  Loading03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

interface JobsManagerProps {
  initialJobs?: JobItem[];
  profileName?: string | null;
  profileHeadline?: string | null;
  profileLocation?: string | null;
  profileSkills?: string[];
  completeness?: number;
}

export function JobsManager({
  initialJobs = [],
  profileName,
  profileHeadline,
  profileLocation,
  profileSkills = [],
  completeness = 85,
}: JobsManagerProps) {
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(initialJobs.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<JobPlatform[]>([
    "greenhouse",
    "lever",
    "workable",
    "wellfound",
  ]);
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [savedOnly, setSavedOnly] = useState(false);

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cache indicator state
  const [isCached, setIsCached] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  // Fetch jobs from API
  const fetchJobs = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          forceRefresh,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve job matches.");
      }

      setJobs(data.jobs || []);
      setIsCached(data.cached !== false);
      setLastFetchedAt(data.fetched_at || new Date().toISOString());
    } catch (err: any) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load jobs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialJobs.length === 0) {
      fetchJobs(false);
    }
  }, []);

  // Platform selection toggles
  const handleTogglePlatform = (platform: JobPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        // Don't allow deselecting all completely via single click; default to all if empty
        const next = prev.filter((p) => p !== platform);
        return next.length === 0 ? ["greenhouse", "lever", "workable", "wellfound"] : next;
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === 4) {
      setSelectedPlatforms(["greenhouse"]);
    } else {
      setSelectedPlatforms(["greenhouse", "lever", "workable", "wellfound"]);
    }
  };

  // Toggle Save handler with optimistic UI update
  const handleToggleSave = async (jobId: string, currentSaved: boolean) => {
    const newStatus = !currentSaved;

    // Optimistically update local state
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, saved_status: newStatus } : j))
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob((prev) => (prev ? { ...prev, saved_status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update saved status");
      }
    } catch (err) {
      console.error("Error toggling saved status:", err);
      // Revert optimistic update on failure
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, saved_status: currentSaved } : j))
      );
    }
  };

  // Open detail dialog
  const handleViewDetails = (job: JobItem) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Platform counts
  const platformCounts = useMemo(() => {
    const counts: Record<JobPlatform, number> = {
      greenhouse: 0,
      lever: 0,
      workable: 0,
      wellfound: 0,
    };
    for (const j of jobs) {
      if (counts[j.platform] !== undefined) {
        counts[j.platform]++;
      }
    }
    return counts;
  }, [jobs]);

  // Saved jobs count
  const savedCount = useMemo(() => {
    return jobs.filter((j) => j.saved_status).length;
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Platform filter
      if (!selectedPlatforms.includes(job.platform)) {
        return false;
      }

      // Saved only
      if (savedOnly && !job.saved_status) {
        return false;
      }

      // Experience level filter
      if (selectedExperience !== "all") {
        if (!job.experience_level.toLowerCase().includes(selectedExperience.toLowerCase())) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesLoc = (job.location || "").toLowerCase().includes(q);
        const matchesTags = (job.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesDesc = (job.description || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLoc && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, selectedPlatforms, savedOnly, selectedExperience, searchQuery]);

  return (
    <div className="space-y-8 pb-20">
      {/* ==================================================================== */}
      {/* 1. WELCOME BANNER                                                    */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#18181B] via-[#16151e] to-[#12111d] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Glow ambient spots */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="pointer-events-none absolute left-10 -bottom-10 size-64 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
              <span>AI Job Match Engine • Brave ATS Search</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FAFAFA]">
              Welcome back, {profileName ? profileName.split(" ")[0] : "Candidate"}!
            </h1>

            <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
              We&apos;ve scanned live career boards on <strong>Greenhouse</strong>,{" "}
              <strong>Lever</strong>, <strong>Workable</strong>, and <strong>Wellfound</strong> to
              match roles tailored to your background.
            </p>

            {/* Profile search parameters badge pill */}
            <div className="flex items-center gap-2 pt-2 flex-wrap text-xs">
              {profileHeadline && (
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900/90 text-zinc-300 font-medium px-2.5 py-1"
                >
                  Role: {profileHeadline}
                </Badge>
              )}

              {profileLocation && (
                <Badge
                  variant="outline"
                  className="border-zinc-700 bg-zinc-900/90 text-zinc-300 font-medium px-2.5 py-1"
                >
                  Loc: {profileLocation}
                </Badge>
              )}

              {profileSkills.slice(0, 3).map((sk) => (
                <Badge
                  key={sk}
                  variant="outline"
                  className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium px-2.5 py-1"
                >
                  {sk}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Action: Force Refresh button */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            <Button
              onClick={() => fetchJobs(true)}
              disabled={isRefreshing || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 text-xs font-semibold h-10 px-5 rounded-xl transition-all cursor-pointer gap-2"
            >
              <HugeiconsIcon
                icon={isRefreshing ? Loading03Icon : RefreshIcon}
                className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Scanning ATS Boards..." : "Refresh Jobs"}</span>
            </Button>

            <span className="text-[11px] text-zinc-400">
              {isCached ? "Using 6-hour cached results" : "Latest real-time search results"}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SELECTABLE JOB PLATFORM CARDS                                     */}
      {/* ==================================================================== */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={handleTogglePlatform}
        onSelectAll={handleSelectAllPlatforms}
        platformCounts={platformCounts}
      />

      {/* ==================================================================== */}
      {/* 3. MAIN CONTENT: TOP MATCHES + RIGHT SIDEBAR (NO STATS)              */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Search, Filters & Job Matches List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-[#18181B] border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, company, or skills..."
                className="pl-9 h-10 text-xs bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              {/* Experience level select */}
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="h-10 text-xs bg-[#09090B] border border-zinc-800 text-zinc-300 rounded-xl px-3 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">All Experience</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Staff</option>
              </select>

              {/* Saved Only toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavedOnly((prev) => !prev)}
                className={`h-10 text-xs px-3 rounded-xl border gap-1.5 cursor-pointer font-medium ${
                  savedOnly
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                    : "bg-[#09090B] border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  className={`size-3.5 ${savedOnly ? "text-amber-400" : "text-zinc-500"}`}
                />
                <span>Saved ({savedCount})</span>
              </Button>
            </div>
          </div>

          {/* Matches Header info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#FAFAFA] tracking-tight">
                Top Job Matches
              </h2>
              <span className="text-xs font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"}
              </span>
            </div>

            <span className="text-xs text-zinc-500">
              Ranked by AI Resume Match Score
            </span>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#18181B] border border-zinc-800/80 rounded-3xl p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">
                    <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                      <Skeleton className="size-16 sm:size-[72px] rounded-2xl bg-zinc-800 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24 bg-zinc-800" />
                          <Skeleton className="h-4 w-20 rounded-full bg-zinc-800/70" />
                        </div>
                        <Skeleton className="h-5 w-3/4 bg-zinc-800" />
                        <div className="flex items-center gap-3 pt-1">
                          <Skeleton className="h-3 w-16 bg-zinc-800/60" />
                          <Skeleton className="h-3 w-16 bg-zinc-800/60" />
                          <Skeleton className="h-3 w-20 bg-zinc-800/60" />
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <Skeleton className="h-6 w-16 rounded-md bg-zinc-800/50" />
                          <Skeleton className="h-6 w-20 rounded-md bg-zinc-800/50" />
                          <Skeleton className="h-6 w-16 rounded-md bg-zinc-800/50" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                      <div className="space-y-2 min-w-[140px]">
                        <Skeleton className="h-4 w-20 bg-zinc-800" />
                        <Skeleton className="h-2 w-36 rounded-full bg-zinc-800" />
                        <Skeleton className="h-3 w-24 bg-zinc-800/60" />
                        <Skeleton className="h-3 w-28 bg-zinc-800/40" />
                      </div>

                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Skeleton className="h-10 w-full sm:w-36 rounded-xl bg-zinc-800" />
                        <Skeleton className="h-10 w-full sm:w-36 rounded-xl bg-zinc-800/70" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center space-y-3">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-rose-300">Unable to load job matches</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">{error}</p>
              <Button
                onClick={() => fetchJobs(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredJobs.length === 0 && (
            <div className="bg-[#18181B] border border-zinc-800/80 rounded-3xl p-10 text-center space-y-4 shadow-sm">
              <div className="size-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <HugeiconsIcon icon={Search01Icon} className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#FAFAFA]">No job matches found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {savedOnly
                    ? "You haven't bookmarked any jobs yet. Bookmark your favorite roles to track them here."
                    : "Try adjusting your search keywords, experience level filter, or select additional platforms."}
                </p>
              </div>

              {(searchQuery || selectedExperience !== "all" || savedOnly) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedExperience("all");
                    setSavedOnly(false);
                    setSelectedPlatforms(["greenhouse", "lever", "workable", "wellfound"]);
                  }}
                  className="border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:text-white rounded-xl cursor-pointer"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          )}

          {/* Job Matches List */}
          {!isLoading && !error && filteredJobs.length > 0 && (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewDetails={handleViewDetails}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar with Profile Completeness & Recent Activity (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <JobsSidebar
              completeness={completeness}
              profileName={profileName}
              savedCount={savedCount}
              lastFetchedAt={lastFetchedAt}
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. JOB DETAIL MODAL DIALOG                                           */}
      {/* ==================================================================== */}
      <JobDetailDialog
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
