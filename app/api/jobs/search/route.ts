import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { JobPlatform, JobItem } from "@/types/job";
import {
  executeBraveJobSearch,
  UserJobSearchProfile,
} from "@/lib/jobs/brave";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours Caching TTL

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
    const validPlatforms: JobPlatform[] = [
      "greenhouse",
      "lever",
      "workable",
      "wellfound",
    ];

    const requestedPlatforms: JobPlatform[] =
      Array.isArray(body.platforms) && body.platforms.length > 0
        ? body.platforms.filter((p: string): p is JobPlatform =>
            validPlatforms.includes(p as JobPlatform)
          )
        : validPlatforms;

    // ------------------------------------------------------------------------
    // 3. Check Supabase Cache (6 Hours)
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
            const filteredCached = cachedJobs.filter((j) =>
              requestedPlatforms.includes(j.platform as JobPlatform)
            );

            console.log(
              `[Jobs Cache] Serving ${filteredCached.length} cached jobs for user ${user.id} (Fetched ${new Date(
                newest
              ).toLocaleTimeString()})`
            );

            return NextResponse.json({
              success: true,
              jobs: filteredCached as JobItem[],
              cached: true,
              fetched_at: new Date(newest).toISOString(),
            });
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
      skills:
        skillsList.length > 0
          ? skillsList
          : ["React", "TypeScript", "Node.js"],
      experience_level: computedLevel,
      job_type: jobType,
      target_roles: profileData.target_roles,
      experience_years: expYears,
    };

    // ------------------------------------------------------------------------
    // 6. Check Brave Search API Key
    // ------------------------------------------------------------------------
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();

    if (!braveApiKey) {
      console.error("[Brave Search] BRAVE_SEARCH_API_KEY is not configured.");
      return NextResponse.json(
        {
          error:
            "BRAVE_SEARCH_API_KEY is missing. Please configure your Brave Search API key in .env.local to search real job listings.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // 7. Call Brave Search API for Each Platform
    // ------------------------------------------------------------------------
    const allFetchedJobs: Omit<JobItem, "id" | "user_id" | "saved_status">[] = [];
    const searchErrors: string[] = [];

    for (const platform of requestedPlatforms) {
      try {
        const platformJobs = await executeBraveJobSearch(
          platform,
          userSearchProfile,
          braveApiKey
        );
        allFetchedJobs.push(...platformJobs);
      } catch (err: any) {
        console.error(`Error searching platform ${platform}:`, err.message);
        searchErrors.push(`${platform}: ${err.message}`);
      }
    }

    if (allFetchedJobs.length === 0 && searchErrors.length > 0) {
      return NextResponse.json(
        {
          error: `Failed to search jobs via Brave API: ${searchErrors.join(
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

    // Remove unsaved previous jobs to avoid stale duplicates
    await supabase
      .from("jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("saved_status", false);

    // Filter out duplicates within the fetched batch
    const uniqueBatch: typeof allFetchedJobs = [];
    const seenBatchUrls = new Set<string>();

    for (const job of allFetchedJobs) {
      if (!seenBatchUrls.has(job.job_url)) {
        seenBatchUrls.add(job.job_url);
        uniqueBatch.push(job);
      }
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
        console.error("Error inserting jobs into Supabase:", insertErr);
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

    return NextResponse.json({
      success: true,
      jobs: (finalJobs || []) as JobItem[],
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
