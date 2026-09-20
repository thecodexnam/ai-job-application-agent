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

    // 2. Sync profile_skills (filter out empty names)
    if (body.categorized_skills !== undefined) {
      await supabase.from("profile_skills").delete().eq("user_id", user.id);
      const validSkills = (body.categorized_skills || []).filter(
        (s) => s && s.name && s.name.trim().length > 0
      );
      if (validSkills.length > 0) {
        const toInsert = validSkills.map((s, idx) => ({
          user_id: user.id,
          name: s.name.trim(),
          category: s.category || "Technical Skills",
          level: s.level || "Intermediate",
          order_index: idx,
        }));
        await supabase.from("profile_skills").insert(toInsert);
      }
    }

    // 3. Sync work_experiences (filter out blank experiences)
    if (body.work_experiences !== undefined) {
      await supabase.from("work_experiences").delete().eq("user_id", user.id);
      const validExp = (body.work_experiences || []).filter(
        (exp) =>
          exp &&
          ((exp.company_name && exp.company_name.trim().length > 0) ||
            (exp.position && exp.position.trim().length > 0) ||
            (exp.description && exp.description.trim().length > 0))
      );
      if (validExp.length > 0) {
        const toInsert = validExp.map((exp, idx) => ({
          user_id: user.id,
          company_name: (exp.company_name || "").trim(),
          position: (exp.position || "").trim(),
          employment_type: exp.employment_type || null,
          location: exp.location?.trim() || null,
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          is_current: !!exp.is_current,
          description: exp.description?.trim() || null,
          highlights: exp.highlights || [],
          order_index: idx,
        }));
        await supabase.from("work_experiences").insert(toInsert);
      }
    }

    // 4. Sync educations (filter out blank educations)
    if (body.educations !== undefined) {
      await supabase.from("educations").delete().eq("user_id", user.id);
      const validEdu = (body.educations || []).filter(
        (edu) =>
          edu &&
          ((edu.institution && edu.institution.trim().length > 0) ||
            (edu.degree && edu.degree.trim().length > 0))
      );
      if (validEdu.length > 0) {
        const toInsert = validEdu.map((edu, idx) => ({
          user_id: user.id,
          institution: (edu.institution || "").trim(),
          degree: (edu.degree || "").trim(),
          field_of_study: edu.field_of_study?.trim() || null,
          location: edu.location?.trim() || null,
          start_date: edu.start_date || null,
          end_date: edu.end_date || null,
          grade: edu.grade?.trim() || null,
          description: edu.description?.trim() || null,
          order_index: idx,
        }));
        await supabase.from("educations").insert(toInsert);
      }
    }

    // 5. Sync projects (filter out blank projects)
    if (body.projects !== undefined) {
      await supabase.from("projects").delete().eq("user_id", user.id);
      const validProj = (body.projects || []).filter(
        (p) =>
          p &&
          ((p.title && p.title.trim().length > 0) ||
            (p.description && p.description.trim().length > 0))
      );
      if (validProj.length > 0) {
        const toInsert = validProj.map((p, idx) => ({
          user_id: user.id,
          title: (p.title || "").trim(),
          description: p.description?.trim() || null,
          technologies: p.technologies || [],
          github_url: p.github_url?.trim() || null,
          live_url: p.live_url?.trim() || null,
          highlights: p.highlights || [],
          order_index: idx,
        }));
        await supabase.from("projects").insert(toInsert);
      }
    }

    // 6. Sync certifications (filter out blank certifications)
    if (body.certifications !== undefined) {
      await supabase.from("certifications").delete().eq("user_id", user.id);
      const validCert = (body.certifications || []).filter(
        (c) => c && c.name && c.name.trim().length > 0
      );
      if (validCert.length > 0) {
        const toInsert = validCert.map((c, idx) => ({
          user_id: user.id,
          name: c.name.trim(),
          issuing_organization: c.issuing_organization?.trim() || "",
          issue_date: c.issue_date || null,
          expiration_date: c.expiration_date || null,
          credential_id: c.credential_id?.trim() || null,
          credential_url: c.credential_url?.trim() || null,
          order_index: idx,
        }));
        await supabase.from("certifications").insert(toInsert);
      }
    }

    // 7. Sync additional_info (filter out blank additional info)
    if (body.additional_info !== undefined) {
      await supabase.from("additional_info").delete().eq("user_id", user.id);
      const validAddit = (body.additional_info || []).filter(
        (a) =>
          a &&
          ((a.title && a.title.trim().length > 0) ||
            (a.description && a.description.trim().length > 0))
      );
      if (validAddit.length > 0) {
        const toInsert = validAddit.map((a, idx) => ({
          user_id: user.id,
          category: a.category || "Other",
          title: (a.title || "").trim(),
          description: a.description?.trim() || null,
          date: a.date || null,
          url: a.url?.trim() || null,
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
