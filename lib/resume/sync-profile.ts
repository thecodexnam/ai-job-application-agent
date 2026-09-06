import { SupabaseClient } from "@supabase/supabase-js";
import { ParsedResumeData } from "@/types/resume";

/**
 * Automatically populates the user's profile and related tables with parsed resume data.
 * Does NOT overwrite existing user fields if they are already populated and the new data is empty.
 * Inserts or syncs skills, work experience, education, projects, certifications, and additional info.
 */
export async function syncParsedResumeToProfile(
  supabase: SupabaseClient,
  userId: string,
  parsedData: ParsedResumeData
) {
  const { personal_info, summary, skills, work_experience, education, projects, certifications, additional_info } = parsedData;

  // 1. Fetch current profile to avoid clobbering existing custom information
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const profileUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (personal_info?.full_name && (!currentProfile?.full_name || currentProfile.full_name.trim() === "")) {
    profileUpdates.full_name = personal_info.full_name;
  }
  if (personal_info?.phone && !currentProfile?.phone) {
    profileUpdates.phone = personal_info.phone;
  }
  if (personal_info?.location && !currentProfile?.location) {
    profileUpdates.location = personal_info.location;
  }
  if (personal_info?.headline && !currentProfile?.headline) {
    profileUpdates.headline = personal_info.headline;
  }
  if (personal_info?.linkedin_url && !currentProfile?.linkedin_url) {
    profileUpdates.linkedin_url = personal_info.linkedin_url;
  }
  if (personal_info?.github_url && !currentProfile?.github_url) {
    profileUpdates.github_url = personal_info.github_url;
  }
  if (personal_info?.portfolio_url && !currentProfile?.portfolio_url) {
    profileUpdates.portfolio_url = personal_info.portfolio_url;
  }
  if (summary && (!currentProfile?.summary || currentProfile.summary.trim() === "")) {
    profileUpdates.summary = summary;
  }

  // Also collect simple string skills array for profiles.skills
  const allSkillNames = skills.map((s) => s.name);
  if (allSkillNames.length > 0) {
    const existingSkills: string[] = currentProfile?.skills || [];
    const mergedSkills = Array.from(new Set([...existingSkills, ...allSkillNames]));
    profileUpdates.skills = mergedSkills;
  }

  // Update profiles table
  await supabase.from("profiles").update(profileUpdates).eq("id", userId);

  // 2. Sync profile_skills table (replace or insert new skills)
  if (skills.length > 0) {
    // Delete existing auto-populated skills to prevent duplicates, then insert fresh
    await supabase.from("profile_skills").delete().eq("user_id", userId);

    const skillsToInsert = skills.map((s, index) => ({
      user_id: userId,
      name: s.name,
      category: s.category || "Technical Skills",
      level: s.level || "Intermediate",
      order_index: index,
    }));

    await supabase.from("profile_skills").insert(skillsToInsert);
  }

  // 3. Sync work_experiences
  if (work_experience.length > 0) {
    // Clear and insert freshly parsed experiences
    await supabase.from("work_experiences").delete().eq("user_id", userId);

    const expToInsert = work_experience.map((exp, index) => ({
      user_id: userId,
      company_name: exp.company_name || "Company",
      position: exp.position || "Role",
      employment_type: exp.employment_type || null,
      location: exp.location || null,
      start_date: exp.start_date || null,
      end_date: exp.end_date || null,
      is_current: !!exp.is_current,
      description: exp.description || null,
      highlights: exp.highlights || [],
      order_index: index,
    }));

    await supabase.from("work_experiences").insert(expToInsert);
  }

  // 4. Sync educations
  if (education.length > 0) {
    await supabase.from("educations").delete().eq("user_id", userId);

    const eduToInsert = education.map((edu, index) => ({
      user_id: userId,
      institution: edu.institution || "University",
      degree: edu.degree || "Degree",
      field_of_study: edu.field_of_study || null,
      location: edu.location || null,
      start_date: edu.start_date || null,
      end_date: edu.end_date || null,
      grade: edu.grade || null,
      description: edu.description || null,
      order_index: index,
    }));

    await supabase.from("educations").insert(eduToInsert);
  }

  // 5. Sync projects
  if (projects.length > 0) {
    await supabase.from("projects").delete().eq("user_id", userId);

    const projToInsert = projects.map((p, index) => ({
      user_id: userId,
      title: p.title || "Project",
      description: p.description || null,
      technologies: p.technologies || [],
      github_url: p.github_url || null,
      live_url: p.live_url || null,
      highlights: p.highlights || [],
      order_index: index,
    }));

    await supabase.from("projects").insert(projToInsert);
  }

  // 6. Sync certifications
  if (certifications.length > 0) {
    await supabase.from("certifications").delete().eq("user_id", userId);

    const certToInsert = certifications.map((c, index) => ({
      user_id: userId,
      name: c.name || "Certification",
      issuing_organization: c.issuing_organization || "Issuer",
      issue_date: c.issue_date || null,
      expiration_date: c.expiration_date || null,
      credential_id: c.credential_id || null,
      credential_url: c.credential_url || null,
      order_index: index,
    }));

    await supabase.from("certifications").insert(certToInsert);
  }

  // 7. Sync additional_info
  if (additional_info.length > 0) {
    await supabase.from("additional_info").delete().eq("user_id", userId);

    const additToInsert = additional_info.map((a, index) => ({
      user_id: userId,
      category: a.category || "Award",
      title: a.title || "Honor",
      description: a.description || null,
      date: a.date || null,
      url: a.url || null,
      order_index: index,
    }));

    await supabase.from("additional_info").insert(additToInsert);
  }
}
