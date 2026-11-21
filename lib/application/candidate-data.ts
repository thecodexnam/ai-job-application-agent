import { CandidateDataSources } from "./profile-matcher";

export async function fetchCandidateData(
  supabase: any,
  userId: string
): Promise<CandidateDataSources> {
  const [profileRes, skillsRes, expRes, eduRes, resumeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("profile_skills").select("*").eq("user_id", userId),
    supabase.from("work_experiences").select("*").eq("user_id", userId),
    supabase.from("educations").select("*").eq("user_id", userId),
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const profile = profileRes.data || { id: userId };
  const primaryResume = resumeRes.data && resumeRes.data.length > 0 ? resumeRes.data[0] : null;

  return {
    profile,
    skills: skillsRes.data || [],
    workExperiences: expRes.data || [],
    educations: eduRes.data || [],
    primaryResume,
  };
}

export async function fetchResumeBuffer(
  supabase: any,
  resume: any
): Promise<{ buffer: Buffer | null; fileName: string }> {
  if (!resume) return { buffer: null, fileName: "resume.pdf" };

  const fileName = resume.file_name || "resume.pdf";
  if (resume.storage_path) {
    try {
      const { data, error } = await supabase.storage.from("resumes").download(resume.storage_path);

      if (data && !error) {
        const arrayBuf = await data.arrayBuffer();
        return { buffer: Buffer.from(arrayBuf), fileName };
      }
    } catch (err) {
      console.warn("[CandidateData] Could not download resume binary from storage.");
    }
  }

  if (resume.file_url) {
    try {
      const resp = await fetch(resume.file_url);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        return { buffer: Buffer.from(arrayBuf), fileName };
      }
    } catch (err) {
      console.warn("[CandidateData] Could not download resume from file_url.");
    }
  }

  return { buffer: null, fileName };
}
