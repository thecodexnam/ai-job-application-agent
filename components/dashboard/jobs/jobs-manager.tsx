"use client";

import React, { useState, useEffect, useMemo } from "react";
import { JobItem, JobPlatform, ALL_JOB_PLATFORMS } from "@/types/job";
import { PlatformSelector } from "./platform-selector";
import { JobCard } from "./job-card";
import { JobDetailDialog } from "./job-detail-dialog";
import { JobApplyDialog } from "./job-apply-dialog";
import { JobsSidebar } from "./jobs-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  RefreshIcon,
  Bookmark02Icon,
  AlertCircleIcon,
  Loading03Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

interface JobsManagerProps {
  initialJobs?: JobItem[];
  profileHeadline?: string | null;
  profileLocation?: string | null;
  profileSkills?: string[];
  completeness?: number;
}

export function JobsManager({
  initialJobs = [],
  profileHeadline,
  profileLocation,
  profileSkills = [],
  completeness = 85,
}: JobsManagerProps) {
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(initialJobs.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<JobPlatform[]>([
    ...ALL_JOB_PLATFORMS,
  ]);
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "newest">("match");
  const [savedOnly, setSavedOnly] = useState(false);

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Selected job for apply modal
  const [applyJob, setApplyJob] = useState<JobItem | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Cache indicator state
  const [isCached, setIsCached] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  // Fetch jobs from API
  const fetchJobs = async (
    forceRefresh = false,
    platformsToFetch: JobPlatform[] = selectedPlatforms
  ) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setSourceErrors([]);

      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: platformsToFetch,
          forceRefresh,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve job matches.");
      }

      setJobs(data.jobs || []);
      setSourceErrors(Array.isArray(data.errors) ? data.errors : []);
      setIsCached(data.cached !== false);
      setLastFetchedAt(data.fetched_at || new Date().toISOString());
    } catch (err: unknown) {
      console.error("Error loading jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialJobs.length > 0) return;
    let isCurrent = true;

    const loadInitialJobs = async () => {
      try {
        const response = await fetch("/api/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platforms: ALL_JOB_PLATFORMS, forceRefresh: false }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to retrieve job matches.");
        if (!isCurrent) return;
        setJobs(data.jobs || []);
        setSourceErrors(Array.isArray(data.errors) ? data.errors : []);
        setIsCached(data.cached !== false);
        setLastFetchedAt(data.fetched_at || new Date().toISOString());
      } catch (error: unknown) {
        if (!isCurrent) return;
        setError(error instanceof Error ? error.message : "Failed to load jobs.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadInitialJobs();
    return () => {
      isCurrent = false;
    };
  }, [initialJobs.length]);

  // Platform selection toggles
  const handleTogglePlatform = (platform: JobPlatform) => {
    const isAdding = !selectedPlatforms.includes(platform);
    const nextPlatforms = isAdding
      ? [...selectedPlatforms, platform]
      : selectedPlatforms.filter((selectedPlatform) => selectedPlatform !== platform);
    setSelectedPlatforms(nextPlatforms.length === 0 ? [...ALL_JOB_PLATFORMS] : nextPlatforms);

    if (isAdding && !isLoading && !isRefreshing) {
      void fetchJobs(true, [platform]);
    }
  };

  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === ALL_JOB_PLATFORMS.length) {
      setSelectedPlatforms(["greenhouse"]);
    } else {
      setSelectedPlatforms([...ALL_JOB_PLATFORMS]);
      if (!isLoading && !isRefreshing) {
        void fetchJobs(true, [...ALL_JOB_PLATFORMS]);
      }
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

  // Open apply dialog
  const handleOpenApply = (job: JobItem) => {
    setApplyJob(job);
    setIsApplyOpen(true);
  };

  // Update job status when applied
  const handleApplicationCompleted = (jobId?: string) => {
    if (jobId) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, application_status: "applied" } : j))
      );
    }
  };

  // Platform counts
  const platformCounts = useMemo(() => {
    const counts = Object.fromEntries(ALL_JOB_PLATFORMS.map((p) => [p, 0])) as Record<
      JobPlatform,
      number
    >;
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
    const query = searchQuery.trim().toLowerCase();
    const location = locationQuery.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
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
      if (query) {
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesLocation = (job.location || "").toLowerCase().includes(query);
        const matchesTags = (job.tags || []).some((tag) => tag.toLowerCase().includes(query));
        const matchesDesc = (job.description || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      if (location && !(job.location || "").toLowerCase().includes(location)) return false;

      return true;
    });

    if (sortBy === "newest") {
      return filtered.sort((left, right) => {
        const leftDate = left.posted_at ? Date.parse(left.posted_at) : 0;
        const rightDate = right.posted_at ? Date.parse(right.posted_at) : 0;
        return rightDate - leftDate || right.match_score - left.match_score;
      });
    }
    return filtered.sort((left, right) => right.match_score - left.match_score);
  }, [jobs, selectedPlatforms, savedOnly, selectedExperience, searchQuery, locationQuery, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery || locationQuery || selectedExperience !== "all" || savedOnly
  );

  const clearFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedExperience("all");
    setSortBy("match");
    setSavedOnly(false);
  };

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 border-b border-[#1A1A1A]/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase text-[#687064]">Discovery Engine</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171914]">
            Find Your Next Role
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5D55]">
            {profileHeadline ? `Matched to ${profileHeadline}` : "Ranked against your profile and technical skills"}
            {profileLocation ? ` · ${profileLocation}` : ""}
          </p>
          {profileSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Profile skills used for matching">
              {profileSkills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-[#1A1A1A]/15 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#171914]"
                >
                  {skill}
                </span>
              ))}
              {profileSkills.length > 5 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold text-[#7B9E32]">
                  +{profileSkills.length - 5} skills
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
          <Button
            onClick={() => fetchJobs(true)}
            disabled={isRefreshing || isLoading}
            className="h-9 gap-2 rounded-md bg-[#172013] px-3.5 text-xs font-semibold text-white hover:bg-[#26321E] cursor-pointer"
          >
            <HugeiconsIcon
              icon={isRefreshing ? Loading03Icon : RefreshIcon}
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Scanning..." : "Scan Openings"}
          </Button>
          <span className="text-[10px] font-medium text-[#687064]">
            {lastFetchedAt
              ? `${isCached ? "Verified cache" : "Live fetched"} · ${new Date(lastFetchedAt).toLocaleTimeString()}`
              : "No search run yet"}
          </span>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. SELECTABLE JOB PLATFORM CARDS                                     */}
      {/* ==================================================================== */}
      <PlatformSelector
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={handleTogglePlatform}
        onSelectAll={handleSelectAllPlatforms}
        platformCounts={platformCounts}
        sourceErrors={sourceErrors}
      />

      {sourceErrors.length > 0 && (
        <div
          role="status"
          className="rounded-md border border-amber-500/30 bg-amber-50 px-4 py-3 text-xs text-amber-950"
        >
          <p className="font-bold">Some job sources returned no results:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {sourceErrors.map((sourceError) => (
              <li key={sourceError}>{sourceError}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN CONTENT: TOP MATCHES + RIGHT SIDEBAR (NO STATS)              */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Search & Filter Toolbar */}
          <div className="rounded-lg border border-[#1A1A1A]/15 bg-white p-3.5 sm:p-4">
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(140px,0.7fr)_auto_auto_auto]">
              <label className="relative block min-w-0">
                <span className="sr-only">Filter loaded jobs by title, company, or skills</span>
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#687064]"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, company, skill..."
                  className="h-9 rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] pl-9 text-xs font-medium text-[#171914] focus:bg-white"
                />
              </label>

              <label className="min-w-0">
                <span className="sr-only">Filter by location</span>
                <Input
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder="Location (e.g. Remote)"
                  className="h-9 rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] text-xs font-medium text-[#171914] focus:bg-white"
                />
              </label>

              <label className="min-w-0">
                <span className="sr-only">Filter by experience level</span>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] px-2.5 text-xs font-semibold text-[#171914] outline-none focus:bg-white cursor-pointer"
                >
                  <option value="all">All Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Staff</option>
                </select>
              </label>

              <label className="min-w-0">
                <span className="sr-only">Sort job results</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "match" | "newest")}
                  className="h-9 w-full rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] px-2.5 text-xs font-semibold text-[#171914] outline-none focus:bg-white cursor-pointer"
                >
                  <option value="match">Best match</option>
                  <option value="newest">Newest first</option>
                </select>
              </label>

              {/* Saved Only toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavedOnly((prev) => !prev)}
                aria-pressed={savedOnly}
                className={`h-9 rounded-md px-3 text-xs font-semibold cursor-pointer transition-all ${
                  savedOnly
                    ? "bg-[#DDF19B] border border-[#9FB944] text-[#1B2710]"
                    : "bg-white border border-[#1A1A1A]/20 text-[#5A5D55] hover:bg-[#F2F0E8] hover:text-[#171914]"
                }`}
              >
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  className={`size-3.5 ${savedOnly ? "text-[#1B2710]" : "text-[#5A5D55]"}`}
                />
                <span>Saved ({savedCount})</span>
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 justify-start rounded-md px-2.5 text-xs font-semibold text-[#5A5D55] hover:text-[#171914] hover:bg-[#F2F0E8] sm:justify-center cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  Clear filters
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <p className="mt-2.5 text-[10px] font-medium text-[#687064] border-t border-[#1A1A1A]/10 pt-2">
                Showing filtered view of loaded jobs. Clear filters or adjust search criteria to see all results.
              </p>
            )}
          </div>

          {/* Matches Header info */}
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1A1A1A]/10 px-0.5 pb-2">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-base font-bold text-[#171914]">Results</h2>
              <span className="text-xs text-[#53564F]">{filteredJobs.length} shown · {jobs.length} loaded</span>
            </div>
            <span className="text-[10px] text-[#687064]">
              {sortBy === "match" ? "Sorted by profile match" : "Sorted by posting date"}
            </span>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="space-y-4 border border-[#1A1A1A]/10 bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 rounded-xl bg-[#E8E5D4]" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48 bg-[#E8E5D4]" />
                      <Skeleton className="h-3 w-32 bg-[#E8E5D4]/60" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full bg-[#E8E5D4]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-md bg-[#E8E5D4]/70" />
                    <Skeleton className="h-6 w-20 rounded-md bg-[#E8E5D4]/70" />
                    <Skeleton className="h-6 w-24 rounded-md bg-[#E8E5D4]/70" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center space-y-3">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-8 text-[#DC2626] mx-auto" />
              <h3 className="text-sm font-bold text-rose-300">Unable to load job matches</h3>
              <p className="text-xs text-[#5A5A5A] max-w-md mx-auto">{error}</p>
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
            <div className="border border-dashed border-[#1A1A1A]/25 bg-white/70 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#E9F2D1] text-[#31411A]">
                <HugeiconsIcon icon={Search01Icon} className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#171914]">
                {savedOnly ? "No saved jobs in this view" : hasActiveFilters ? "No results for these filters" : "No jobs loaded yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#62665C]">
                {savedOnly
                  ? "Save a role from the results to keep it in this list."
                  : hasActiveFilters
                    ? "Clear one or more filters, or refresh the selected providers."
                    : "Refresh the selected providers to search for active matching roles."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 rounded-md border-[#1A1A1A]/20 text-xs">
                    Clear filters
                  </Button>
                )}
                <Button size="sm" onClick={() => fetchJobs(true)} disabled={isRefreshing} className="h-8 rounded-md bg-[#172013] px-3 text-xs text-white hover:bg-[#26321E]">
                  {isRefreshing ? "Refreshing" : "Refresh results"}
                </Button>
              </div>
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
                  onApply={handleOpenApply}
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
              savedCount={savedCount}
              lastFetchedAt={lastFetchedAt}
              loadedCount={jobs.length}
              visibleCount={filteredJobs.length}
              isCached={isCached}
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
        onApply={handleOpenApply}
      />

      {/* ==================================================================== */}
      {/* 5. JOB APPLICATION FLOW MODAL (MANUAL & AI AGENT)                     */}
      {/* ==================================================================== */}
      <JobApplyDialog
        job={applyJob}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onApplicationCompleted={handleApplicationCompleted}
      />
    </div>
  );
}
