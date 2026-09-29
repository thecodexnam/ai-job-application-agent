import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALL_JOB_PLATFORMS, JobPlatform, JobItem } from "@/types/job";
import { UserJobSearchProfile } from "@/lib/jobs/query";
import { searchVerifiedJobs } from "@/lib/jobs/engine";
import {
  extractSalaryFromText,
  isInvalidCompanyName,
  isLikelyDeadOrSpam,
  isLikelyGeneratedDescription,
  UNDISCLOSED_SALARY,
} from "@/lib/jobs/metadata";
import { filterLiveJobs } from "@/lib/jobs/verify";

const CACHE_TTL_MS = 45 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------------
    // 1. Authenticate User
    // ------------------------------------------------------------------------
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ------------------------------------------------------------------------
    // 2. Parse API Payload
    // ------------------------------------------------------------------------
    const body = await request.json().catch(() => ({}));
    const forceRefresh = Boolean(body.forceRefresh);
    const validPlatforms: JobPlatform[] = ALL_JOB_PLATFORMS;

    const requestedPlatforms: JobPlatform[] =
      Array.isArray(body.platforms) && body.platforms.length > 0
        ? body.platforms.filter((p: string): p is JobPlatform =>
            validPlatforms.includes(p as JobPlatform)
          )
        : validPlatforms;
    let platformsToSearch = requestedPlatforms;
    let hasUsableCache = false;

    // ------------------------------------------------------------------------
    // 3. Check Supabase Cache
    // ------------------------------------------------------------------------
    if (!forceRefresh) {
      const { data: cachedJobs, error: cacheErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false });

      if (!cacheErr && cachedJobs && cachedJobs.length > 0) {
        const timestamps = cachedJobs
          .map((j) => new Date(j.fetched_at).getTime())
          .filter((t) => !isNaN(t));

        if (timestamps.length > 0) {
          const newest = Math.max(...timestamps);
          const isFresh = Date.now() - newest < CACHE_TTL_MS;

          if (isFresh) {
            // Filter by requested platforms
            const filteredCached = await filterLiveJobs(
              cachedJobs.filter(
                (j) =>
                  requestedPlatforms.includes(j.platform as JobPlatform) &&
                  !isInvalidCompanyName(j.company) &&
                  Boolean(j.title?.trim()) &&
                  Boolean(j.description?.trim()) &&
                  !isLikelyGeneratedDescription(j.description) &&
                  !isLikelyDeadOrSpam(j.title, j.description || "")
              )
            );

            if (filteredCached.length > 0) {
              const cachedPlatforms = new Set(
                filteredCached.map((job) => job.platform as JobPlatform)
              );
              platformsToSearch = requestedPlatforms.filter(
                (platform) => !cachedPlatforms.has(platform)
              );
              hasUsableCache = true;

              if (platformsToSearch.length === 0) {
                console.log(
                  `[Jobs Cache] Serving ${filteredCached.length} verified cached jobs for user ${user.id} (Fetched ${new Date(
                    newest
                  ).toLocaleTimeString()})`
                );

                return NextResponse.json({
                  success: true,
                  jobs: filteredCached.map((job) => ({
                    ...job,
                    salary: extractSalaryFromText(job.description) || UNDISCLOSED_SALARY,
                  })) as JobItem[],
                  cached: true,
                  fetched_at: new Date(newest).toISOString(),
                });
              }
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 4. Fetch User Profile from Supabase
    // ------------------------------------------------------------------------
    const [profileRes, skillsRes, expRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("profile_skills")
        .select("name, category, level")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("work_experiences")
        .select("company_name, position, description, employment_type")
        .eq("user_id", user.id),
    ]);

    const profileData = profileRes.data || {};
    const skillsList: string[] = (skillsRes.data || []).map((s: any) => s.name);
    if (Array.isArray(profileData.skills)) {
      for (const s of profileData.skills) {
        if (s && !skillsList.includes(s)) skillsList.push(s);
      }
    }

    // ------------------------------------------------------------------------
    // 5. Validate & Structure Profile Data with All Important Details
    // ------------------------------------------------------------------------
    const expYears = (expRes.data || []).length * 2 || 3;
    let computedLevel = "Mid Level";
    const hl = (profileData.headline || "").toLowerCase();
    if (hl.includes("senior") || hl.includes("sr.")) computedLevel = "Senior";
    else if (hl.includes("lead") || hl.includes("staff") || hl.includes("principal")) computedLevel = "Lead";
    else if (hl.includes("junior") || hl.includes("intern") || hl.includes("entry")) computedLevel = "Entry Level";
    else if (expYears >= 5) computedLevel = "Senior";

    // Inferred or default job type
    const jobType = (expRes.data && expRes.data[0]?.employment_type) || "Full-time";

    const userSearchProfile: UserJobSearchProfile = {
      id: user.id,
      full_name: profileData.full_name,
      headline: profileData.headline || "Software Engineer",
      location: profileData.location || "Remote",
      skills: skillsList,
      experience_level: computedLevel,
      job_type: jobType,
      target_roles: profileData.target_roles,
      experience_years: expYears,
    };

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();

    // ------------------------------------------------------------------------
    // 7. Fetch verified jobs from structured ATS/job-board APIs
    // ------------------------------------------------------------------------
    const allFetchedJobs: Omit<JobItem, "id" | "user_id" | "saved_status">[] = [];
    const searchErrors: string[] = [];
    const successfullySearchedPlatforms: JobPlatform[] = [];

    const platformResults = await Promise.allSettled(
      platformsToSearch.map((platform) =>
        searchVerifiedJobs(platform, userSearchProfile, braveApiKey)
      )
    );

    platformResults.forEach((result, index) => {
      const platform = platformsToSearch[index];
      if (result.status === "fulfilled") {
        successfullySearchedPlatforms.push(platform);
        allFetchedJobs.push(...result.value);
      } else {
        const message =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.error(`Error searching platform ${platform}:`, message);
        searchErrors.push(`${platform}: ${message}`);
      }
    });

    if (allFetchedJobs.length === 0 && searchErrors.length > 0 && !hasUsableCache) {
      return NextResponse.json(
        {
          error: `Failed to search requested job providers: ${searchErrors.join(
            " | "
          )}`,
        },
        { status: 502 }
      );
    }

    // ------------------------------------------------------------------------
    // 8. Deduplicate and Save Results to Supabase
    // ------------------------------------------------------------------------
    // Preserve previously saved jobs
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("job_url, saved_status")
      .eq("user_id", user.id);

    const savedJobUrls = new Set<string>();
    if (existingJobs) {
      for (const j of existingJobs) {
        if (j.saved_status) {
          savedJobUrls.add(j.job_url);
        }
      }
    }

    // Replace only unsaved rows from providers that completed a fresh search.
    if (successfullySearchedPlatforms.length > 0) {
      await supabase
        .from("jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("saved_status", false)
        .in("platform", successfullySearchedPlatforms);
    }

    // Filter out duplicates within the fetched batch
    const uniqueBatch: typeof allFetchedJobs = [];
    const seenBatchUrls = new Set<string>();

    for (const job of allFetchedJobs) {
      if (
        !job.job_url ||
        !job.title ||
        isInvalidCompanyName(job.company) ||
        seenBatchUrls.has(job.job_url)
      ) {
        continue;
      }
      seenBatchUrls.add(job.job_url);
      uniqueBatch.push(job);
    }

    const rowsToInsert = uniqueBatch.map((j) => ({
      user_id: user.id,
      platform: j.platform,
      title: j.title,
      company: j.company,
      company_logo: j.company_logo,
      location: j.location,
      salary: j.salary,
      job_type: j.job_type,
      experience_level: j.experience_level,
      description: j.description,
      posted_at: j.posted_at || null,
      tags: j.tags,
      match_score: j.match_score,
      job_url: j.job_url,
      source_url: j.source_url,
      application_status: j.application_status,
      saved_status: savedJobUrls.has(j.job_url),
      fetched_at: j.fetched_at,
    }));

    if (rowsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("jobs")
        .insert(rowsToInsert);

      if (insertErr) {
        const isMissingPostedAtColumn =
          /posted_at/i.test(insertErr.message || "") &&
          ["42703", "PGRST204"].includes(insertErr.code || "");
        if (isMissingPostedAtColumn) {
          const rowsWithoutPostedAt = rowsToInsert.map((row) => {
            const { posted_at, ...fallbackRow } = row;
            void posted_at;
            return fallbackRow;
          });
          const { error: fallbackInsertError } = await supabase
            .from("jobs")
            .insert(rowsWithoutPostedAt);
          if (fallbackInsertError) {
            console.error("Error inserting jobs into Supabase:", fallbackInsertError);
          }
        } else {
          console.error("Error inserting jobs into Supabase:", insertErr);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 9. Return Normalized Jobs to Frontend
    // ------------------------------------------------------------------------
    const { data: finalJobs, error: selectErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("match_score", { ascending: false });

    if (selectErr) {
      throw selectErr;
    }

    const verifiedFinalJobs = await filterLiveJobs(
      (finalJobs || []).filter(
        (job) =>
          !isInvalidCompanyName(job.company) &&
          Boolean(job.title?.trim()) &&
          Boolean(job.description?.trim()) &&
          !isLikelyGeneratedDescription(job.description) &&
          !isLikelyDeadOrSpam(job.title, job.description || "")
      )
    );
    const currentSalaryByUrl = new Map(
      allFetchedJobs.map((job) => [job.job_url, job.salary || UNDISCLOSED_SALARY])
    );

    return NextResponse.json({
      success: true,
      jobs: verifiedFinalJobs.map((job) => ({
        ...job,
        salary:
          currentSalaryByUrl.get(job.job_url) ||
          extractSalaryFromText(job.description) ||
          UNDISCLOSED_SALARY,
      })) as JobItem[],
      cached: false,
      fetched_at: new Date().toISOString(),
      errors: searchErrors.length > 0 ? searchErrors : undefined,
    });
  } catch (error: any) {
    console.error("Critical error in /api/jobs/search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search job boards." },
      { status: 500 }
    );
  }
}
