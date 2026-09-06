export interface ResumePersonalInfo {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  other_links?: { label: string; url: string }[];
}

export interface ResumeSkillItem {
  id?: string;
  name: string;
  category: "Technical Skills" | "Programming Languages" | "Frameworks & Libraries" | "Tools & Technologies" | "Soft Skills" | "Other";
  level?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  order_index?: number;
}

export interface ResumeWorkExperience {
  id?: string;
  company_name: string;
  position: string;
  employment_type?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
  highlights?: string[];
  order_index?: number;
}

export interface ResumeEducation {
  id?: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  order_index?: number;
}

export interface ResumeProject {
  id?: string;
  title: string;
  description?: string;
  technologies?: string[];
  github_url?: string;
  live_url?: string;
  highlights?: string[];
  order_index?: number;
}

export interface ResumeCertification {
  id?: string;
  name: string;
  issuing_organization: string;
  issue_date?: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
  order_index?: number;
}

export interface ResumeAdditionalInfo {
  id?: string;
  category: "Award" | "Publication" | "Language" | "Volunteer" | "Interest" | "Other";
  title: string;
  description?: string;
  date?: string;
  url?: string;
  order_index?: number;
}

export interface ParsedResumeData {
  personal_info: ResumePersonalInfo;
  summary?: string;
  skills: ResumeSkillItem[];
  work_experience: ResumeWorkExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  additional_info: ResumeAdditionalInfo[];
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  storage_path?: string | null;
  parsing_status: "uploading" | "processing" | "parsed" | "failed";
  parsed_content?: ParsedResumeData | null;
  error_message?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface FullUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  target_roles: string[];
  skills: string[];
  additional_links?: { label: string; url: string }[];
  categorized_skills?: ResumeSkillItem[];
  work_experiences?: ResumeWorkExperience[];
  educations?: ResumeEducation[];
  projects?: ResumeProject[];
  certifications?: ResumeCertification[];
  additional_info?: ResumeAdditionalInfo[];
}
