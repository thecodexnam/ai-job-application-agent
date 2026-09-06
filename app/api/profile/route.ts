import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FullUserProfile } from "@/types/resume";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch main profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Fetch related tables in parallel
    const [
      { data: skills },
      { data: work_experiences },
      { data: educations },
      { data: projects },
      { data: certifications },
      { data: additional_info },
    ] = await Promise.all([
      supabase
        .from("profile_skills")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("work_experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("educations")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("additional_info")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
    ]);

    const fullProfile: FullUserProfile = {
      id: user.id,
      full_name: profile?.full_name || "",
      email: profile?.email || user.email || "",
      avatar_url: profile?.avatar_url || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      headline: profile?.headline || "",
      summary: profile?.summary || "",
      linkedin_url: profile?.linkedin_url || "",
      github_url: profile?.github_url || "",
      portfolio_url: profile?.portfolio_url || "",
      target_roles: profile?.target_roles || [],
      skills: profile?.skills || [],
      additional_links: profile?.additional_links || [],
      categorized_skills: skills || [],
      work_experiences: work_experiences || [],
      educations: educations || [],
      projects: projects || [],
      certifications: certifications || [],
      additional_info: additional_info || [],
    };

    return NextResponse.json({ profile: fullProfile });
  } catch (err: any) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as FullUserProfile;

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name,
        phone: body.phone,
        location: body.location,
        headline: body.headline,
        summary: body.summary,
        linkedin_url: body.linkedin_url,
        github_url: body.github_url,
        portfolio_url: body.portfolio_url,
        target_roles: body.target_roles || [],
        skills: body.skills || [],
        additional_links: body.additional_links || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. Sync profile_skills
    if (body.categorized_skills) {
      await supabase.from("profile_skills").delete().eq("user_id", user.id);
      if (body.categorized_skills.length > 0) {
        const toInsert = body.categorized_skills.map((s, idx) => ({
          user_id: user.id,
          name: s.name,
          category: s.category || "Technical Skills",
          level: s.level || "Intermediate",
          order_index: idx,
        }));
        await supabase.from("profile_skills").insert(toInsert);
      }
    }

    // 3. Sync work_experiences
    if (body.work_experiences) {
      await supabase.from("work_experiences").delete().eq("user_id", user.id);
      if (body.work_experiences.length > 0) {
        const toInsert = body.work_experiences.map((exp, idx) => ({
          user_id: user.id,
          company_name: exp.company_name,
          position: exp.position,
          employment_type: exp.employment_type || null,
          location: exp.location || null,
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          is_current: !!exp.is_current,
          description: exp.description || null,
          highlights: exp.highlights || [],
          order_index: idx,
        }));
        await supabase.from("work_experiences").insert(toInsert);
      }
    }

    // 4. Sync educations
    if (body.educations) {
      await supabase.from("educations").delete().eq("user_id", user.id);
      if (body.educations.length > 0) {
        const toInsert = body.educations.map((edu, idx) => ({
          user_id: user.id,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study || null,
          location: edu.location || null,
          start_date: edu.start_date || null,
          end_date: edu.end_date || null,
          grade: edu.grade || null,
          description: edu.description || null,
          order_index: idx,
        }));
        await supabase.from("educations").insert(toInsert);
      }
    }

    // 5. Sync projects
    if (body.projects) {
      await supabase.from("projects").delete().eq("user_id", user.id);
      if (body.projects.length > 0) {
        const toInsert = body.projects.map((p, idx) => ({
          user_id: user.id,
          title: p.title,
          description: p.description || null,
          technologies: p.technologies || [],
          github_url: p.github_url || null,
          live_url: p.live_url || null,
          highlights: p.highlights || [],
          order_index: idx,
        }));
        await supabase.from("projects").insert(toInsert);
      }
    }

    // 6. Sync certifications
    if (body.certifications) {
      await supabase.from("certifications").delete().eq("user_id", user.id);
      if (body.certifications.length > 0) {
        const toInsert = body.certifications.map((c, idx) => ({
          user_id: user.id,
          name: c.name,
          issuing_organization: c.issuing_organization,
          issue_date: c.issue_date || null,
          expiration_date: c.expiration_date || null,
          credential_id: c.credential_id || null,
          credential_url: c.credential_url || null,
          order_index: idx,
        }));
        await supabase.from("certifications").insert(toInsert);
      }
    }

    // 7. Sync additional_info
    if (body.additional_info) {
      await supabase.from("additional_info").delete().eq("user_id", user.id);
      if (body.additional_info.length > 0) {
        const toInsert = body.additional_info.map((a, idx) => ({
          user_id: user.id,
          category: a.category,
          title: a.title,
          description: a.description || null,
          date: a.date || null,
          url: a.url || null,
          order_index: idx,
        }));
        await supabase.from("additional_info").insert(toInsert);
      }
    }

    return NextResponse.json({ success: true, message: "Profile saved successfully." });
  } catch (err: any) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
