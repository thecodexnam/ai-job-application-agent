import { FullUserProfile } from "@/types/resume";

export interface ProfileSectionScore {
  score: number;
  maxScore: number;
  percentage: number;
  details?: string;
}

export interface ProfileSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  section: string;
  title: string;
  message: string;
  actionLabel: string;
  targetTab: string;
  targetElementId?: string;
}

export interface ProfileCompletenessResult {
  completionPercentage: number;
  completionLevel: "Just Getting Started" | "Building Your Profile" | "Good Progress" | "Almost Complete" | "Profile Complete";
  sections: {
    personalInformation: ProfileSectionScore;
    professionalSummary: ProfileSectionScore;
    skills: ProfileSectionScore;
    workExperience: ProfileSectionScore;
    education: ProfileSectionScore;
    projects: ProfileSectionScore;
    certifications: ProfileSectionScore;
    additionalInformation: ProfileSectionScore;
  };
  suggestions: ProfileSuggestion[];
}

/**
 * Calculates a fair, deterministic, and explainable profile completeness percentage
 * along with priority-ranked suggestions to improve candidate matching.
 */
export function calculateProfileCompleteness(profile: Partial<FullUserProfile> | null | undefined): ProfileCompletenessResult {
  if (!profile) {
    return {
      completionPercentage: 0,
      completionLevel: "Just Getting Started",
      sections: {
        personalInformation: { score: 0, maxScore: 20, percentage: 0 },
        professionalSummary: { score: 0, maxScore: 10, percentage: 0 },
        skills: { score: 0, maxScore: 15, percentage: 0 },
        workExperience: { score: 0, maxScore: 15, percentage: 0 },
        education: { score: 0, maxScore: 15, percentage: 0 },
        projects: { score: 0, maxScore: 10, percentage: 0 },
        certifications: { score: 0, maxScore: 5, percentage: 0 },
        additionalInformation: { score: 0, maxScore: 10, percentage: 0 },
      },
      suggestions: [
        {
          id: "fill-name",
          priority: "high",
          section: "personal",
          title: "Add Full Name",
          message: "Provide your candidate name for applications and employer communications.",
          actionLabel: "Add Name →",
          targetTab: "personal",
          targetElementId: "input-full_name",
        },
      ],
    };
  }

  const suggestions: ProfileSuggestion[] = [];

  // --------------------------------------------------------------------------
  // 1. Personal Information (Weight: 20%)
  // Evaluates 8 individual fields:
  // full_name, email, phone, location, headline, linkedin_url, github_url, portfolio_url
  // --------------------------------------------------------------------------
  const personalFields = [
    { key: "full_name", label: "Full Name", priority: "high" as const, val: profile.full_name },
    { key: "email", label: "Email Address", priority: "high" as const, val: profile.email },
    { key: "headline", label: "Professional Title", priority: "high" as const, val: profile.headline },
    { key: "location", label: "Location", priority: "medium" as const, val: profile.location },
    { key: "phone", label: "Phone Number", priority: "medium" as const, val: profile.phone },
    { key: "linkedin_url", label: "LinkedIn Profile", priority: "medium" as const, val: profile.linkedin_url },
    { key: "github_url", label: "GitHub Profile", priority: "low" as const, val: profile.github_url },
    { key: "portfolio_url", label: "Portfolio URL", priority: "low" as const, val: profile.portfolio_url },
  ];

  let completedPersonalFieldsCount = 0;
  personalFields.forEach((field) => {
    if (field.val && typeof field.val === "string" && field.val.trim().length > 0) {
      completedPersonalFieldsCount += 1;
    } else {
      if (field.key === "full_name") {
        suggestions.push({
          id: "add-name",
          priority: "high",
          section: "personal",
          title: "Add Full Name",
          message: "Your name is required to personalize job applications and resume headers.",
          actionLabel: "Add Name →",
          targetTab: "personal",
          targetElementId: "input-full_name",
        });
      } else if (field.key === "headline") {
        suggestions.push({
          id: "add-headline",
          priority: "high",
          section: "personal",
          title: "Add Professional Headline",
          message: "Specify your target role or specialty (e.g. 'Senior Full-Stack Engineer').",
          actionLabel: "Add Title →",
          targetTab: "personal",
        });
      } else if (field.key === "linkedin_url") {
        suggestions.push({
          id: "add-linkedin",
          priority: "medium",
          section: "personal",
          title: "Add LinkedIn Profile",
          message: "LinkedIn verification significantly increases employer response rates.",
          actionLabel: "Add LinkedIn →",
          targetTab: "personal",
        });
      }
    }
  });

  const personalScore = Math.round((completedPersonalFieldsCount / 8) * 20 * 10) / 10;
  const personalSection: ProfileSectionScore = {
    score: personalScore,
    maxScore: 20,
    percentage: Math.round((personalScore / 20) * 100),
    details: `${completedPersonalFieldsCount}/8 fields completed`,
  };

  // --------------------------------------------------------------------------
  // 2. Professional Summary (Weight: 10%)
  // Must be meaningful (minimum 30 characters of genuine content)
  // --------------------------------------------------------------------------
  const summaryText = (profile.summary || "").trim();
  let summaryScore = 0;
  if (summaryText.length >= 30) {
    summaryScore = 10;
  } else if (summaryText.length > 0) {
    summaryScore = 5;
    suggestions.push({
      id: "expand-summary",
      priority: "high",
      section: "summary",
      title: "Expand Professional Summary",
      message: "A comprehensive career overview helps recruiters and AI match you with executive roles.",
      actionLabel: "Expand Summary →",
      targetTab: "summary",
    });
  } else {
    suggestions.push({
      id: "add-summary",
      priority: "high",
      section: "summary",
      title: "Add Professional Summary",
      message: "Highlight your key strengths and career trajectory for automated matching.",
      actionLabel: "Add Summary →",
      targetTab: "summary",
    });
  }

  const summarySection: ProfileSectionScore = {
    score: summaryScore,
    maxScore: 10,
    percentage: Math.round((summaryScore / 10) * 100),
    details: summaryText.length >= 30 ? "Complete" : summaryText.length > 0 ? "Needs detail" : "Missing",
  };

  // --------------------------------------------------------------------------
  // 3. Skills (Weight: 15%)
  // 0 skills: 0%
  // 1-2 skills: 40% (6 pts)
  // 3-5 skills: 70% (10.5 pts)
  // 6+ skills: 100% (15 pts)
  // --------------------------------------------------------------------------
  const validSkills = (profile.categorized_skills || []).filter(
    (s) => s && s.name && s.name.trim().length > 0
  );
  let skillsScore = 0;
  if (validSkills.length >= 6) {
    skillsScore = 15;
  } else if (validSkills.length >= 3) {
    skillsScore = 10.5;
    suggestions.push({
      id: "add-more-skills",
      priority: "high",
      section: "skills",
      title: "Add 3 More Relevant Skills",
      message: "Profiles with 6+ technical and domain skills match 40% more job listings.",
      actionLabel: "Add Skills →",
      targetTab: "skills",
      targetElementId: "input-new-skill",
    });
  } else if (validSkills.length >= 1) {
    skillsScore = 6;
    suggestions.push({
      id: "add-core-skills",
      priority: "high",
      section: "skills",
      title: "Add Core Technical Skills",
      message: "Add at least 3 skills to unlock autonomous AI job applications.",
      actionLabel: "Add Skills →",
      targetTab: "skills",
      targetElementId: "input-new-skill",
    });
  } else {
    suggestions.push({
      id: "add-skills",
      priority: "high",
      section: "skills",
      title: "Add Skills & Competencies",
      message: "Skills are vital for AI resume matching and ranking against job descriptions.",
      actionLabel: "Add Skills →",
      targetTab: "skills",
      targetElementId: "input-new-skill",
    });
  }

  const skillsSection: ProfileSectionScore = {
    score: skillsScore,
    maxScore: 15,
    percentage: Math.round((skillsScore / 15) * 100),
    details: `${validSkills.length} skills listed`,
  };

  // --------------------------------------------------------------------------
  // 4. Projects (Weight: 10%) - Computed before Work Experience for Fresher Compensation
  // 0 projects: 0%
  // 1 project: 5 pts
  // 2+ complete projects: 10 pts
  // --------------------------------------------------------------------------
  const validProjects = (profile.projects || []).filter(
    (p) => p && p.title && p.title.trim().length > 0
  );
  const completeProjects = validProjects.filter(
    (p) => p.title.trim().length > 0 && ((p.description && p.description.trim().length > 0) || (p.technologies && p.technologies.length > 0))
  );

  let projectsScore = 0;
  if (completeProjects.length >= 2) {
    projectsScore = 10;
  } else if (validProjects.length >= 1) {
    projectsScore = 5;
    suggestions.push({
      id: "add-second-project",
      priority: "medium",
      section: "projects",
      title: "Add Another Project",
      message: "Showcasing multiple applications demonstrates your hands-on engineering capability.",
      actionLabel: "Add Project →",
      targetTab: "projects",
    });
  } else {
    suggestions.push({
      id: "add-project",
      priority: "medium",
      section: "projects",
      title: "Add a Portfolio Project",
      message: "Projects provide concrete proof of your skills, especially for technical roles.",
      actionLabel: "Add Project →",
      targetTab: "projects",
    });
  }

  const projectsSection: ProfileSectionScore = {
    score: projectsScore,
    maxScore: 10,
    percentage: Math.round((projectsScore / 10) * 100),
    details: `${validProjects.length} projects documented`,
  };

  // --------------------------------------------------------------------------
  // 5. Work Experience (Weight: 15%)
  // Check whether user has at least one complete experience entry.
  // Fresher / Student Compensation:
  // If 0 experiences exist, but candidate has 2+ complete projects,
  // projects compensate for work experience so freshers aren't unfairly penalized.
  // --------------------------------------------------------------------------
  const validExperiences = (profile.work_experiences || []).filter(
    (exp) =>
      exp &&
      ((exp.company_name && exp.company_name.trim().length > 0) ||
        (exp.position && exp.position.trim().length > 0))
  );
  const fullyCompleteExp = validExperiences.filter(
    (exp) =>
      exp.company_name &&
      exp.company_name.trim().length > 0 &&
      exp.position &&
      exp.position.trim().length > 0 &&
      exp.start_date &&
      exp.start_date.trim().length > 0
  );

  let experienceScore = 0;
  let experienceDetails = "No experience added";

  if (fullyCompleteExp.length >= 1) {
    experienceScore = 15;
    experienceDetails = `${validExperiences.length} role(s) verified`;
  } else if (validExperiences.length >= 1) {
    experienceScore = 8;
    experienceDetails = "Incomplete role entry";
    suggestions.push({
      id: "complete-experience",
      priority: "high",
      section: "experience",
      title: "Complete Work Experience Details",
      message: "Include your position, company name, and employment dates.",
      actionLabel: "Complete Experience →",
      targetTab: "experience",
    });
  } else if (completeProjects.length >= 2) {
    // Fresher compensation: 2+ projects compensate for experience
    experienceScore = 15;
    experienceDetails = "Covered by portfolio projects (Early Career / Fresher)";
  } else {
    suggestions.push({
      id: "add-experience",
      priority: "medium",
      section: "experience",
      title: "Add Work Experience or Projects",
      message: "Add previous roles, or add 2+ technical projects if you are an early-career candidate.",
      actionLabel: "Add Experience →",
      targetTab: "experience",
    });
  }

  const workExperienceSection: ProfileSectionScore = {
    score: experienceScore,
    maxScore: 15,
    percentage: Math.round((experienceScore / 15) * 100),
    details: experienceDetails,
  };

  // --------------------------------------------------------------------------
  // 6. Education (Weight: 15%)
  // Important fields: Institution, Degree, Field of Study, Dates
  // --------------------------------------------------------------------------
  const validEducations = (profile.educations || []).filter(
    (edu) =>
      edu &&
      ((edu.institution && edu.institution.trim().length > 0) ||
        (edu.degree && edu.degree.trim().length > 0))
  );
  const completeEdu = validEducations.filter(
    (edu) =>
      edu.institution &&
      edu.institution.trim().length > 0 &&
      edu.degree &&
      edu.degree.trim().length > 0
  );

  let educationScore = 0;
  if (completeEdu.length >= 1) {
    educationScore = 15;
  } else if (validEducations.length >= 1) {
    educationScore = 7.5;
    suggestions.push({
      id: "complete-education",
      priority: "high",
      section: "education",
      title: "Complete Education Details",
      message: "Add your degree and university name to complete your academic credential.",
      actionLabel: "Complete Education →",
      targetTab: "education",
    });
  } else {
    suggestions.push({
      id: "add-education",
      priority: "high",
      section: "education",
      title: "Add Education History",
      message: "Many roles filter candidates by minimum degree or graduation status.",
      actionLabel: "Add Education →",
      targetTab: "education",
    });
  }

  const educationSection: ProfileSectionScore = {
    score: educationScore,
    maxScore: 15,
    percentage: Math.round((educationScore / 15) * 100),
    details: completeEdu.length > 0 ? `${completeEdu.length} degree(s) added` : "Missing",
  };

  // --------------------------------------------------------------------------
  // 7. Certifications (Weight: 5%)
  // Optional enhancement: 1 cert = 2.5 pts, 2+ certs = 5 pts
  // --------------------------------------------------------------------------
  const validCerts = (profile.certifications || []).filter(
    (c) => c && c.name && c.name.trim().length > 0
  );
  let certScore = 0;
  if (validCerts.length >= 2) {
    certScore = 5;
  } else if (validCerts.length === 1) {
    certScore = 2.5;
  } else {
    suggestions.push({
      id: "add-cert",
      priority: "low",
      section: "certifications",
      title: "Add Certifications (Optional)",
      message: "AWS, Google Cloud, or vendor certificates give you a competitive edge.",
      actionLabel: "Add Certificate →",
      targetTab: "certifications",
    });
  }

  const certificationsSection: ProfileSectionScore = {
    score: certScore,
    maxScore: 5,
    percentage: Math.round((certScore / 5) * 100),
    details: `${validCerts.length} verified certification(s)`,
  };

  // --------------------------------------------------------------------------
  // 8. Additional Information (Weight: 10%)
  // Awards, publications, spoken languages, volunteer experience
  // 1 entry = 5 pts, 2+ entries = 10 pts
  // --------------------------------------------------------------------------
  const validAdditional = (profile.additional_info || []).filter(
    (a) => a && a.title && a.title.trim().length > 0
  );
  let additScore = 0;
  if (validAdditional.length >= 2) {
    additScore = 10;
  } else if (validAdditional.length === 1) {
    additScore = 5;
    suggestions.push({
      id: "add-more-additional",
      priority: "low",
      section: "additional",
      title: "Add Spoken Languages or Honors",
      message: "Additional honors and languages help with global remote positions.",
      actionLabel: "Add Details →",
      targetTab: "additional",
    });
  } else {
    suggestions.push({
      id: "add-additional-info",
      priority: "low",
      section: "additional",
      title: "Add Honors, Languages or Awards",
      message: "Highlight achievements and multilingual capability to enrich your candidate card.",
      actionLabel: "Add Honors →",
      targetTab: "additional",
    });
  }

  const additionalSection: ProfileSectionScore = {
    score: additScore,
    maxScore: 10,
    percentage: Math.round((additScore / 10) * 100),
    details: `${validAdditional.length} item(s) added`,
  };

  // --------------------------------------------------------------------------
  // Total Weighted Calculation (Cap at 100)
  // --------------------------------------------------------------------------
  const rawTotal =
    personalScore +
    summaryScore +
    skillsScore +
    workExperienceSection.score +
    educationSection.score +
    projectsSection.score +
    certificationsSection.score +
    additionalSection.score;

  const completionPercentage = Math.min(100, Math.max(0, Math.round(rawTotal)));

  // Determine Completion Level
  const levelInfo = getCompletenessLevel(completionPercentage);

  // Sort suggestions by priority (high > medium > low)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedSuggestions = suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return {
    completionPercentage,
    completionLevel: levelInfo.label,
    sections: {
      personalInformation: personalSection,
      professionalSummary: summarySection,
      skills: skillsSection,
      workExperience: workExperienceSection,
      education: educationSection,
      projects: projectsSection,
      certifications: certificationsSection,
      additionalInformation: additionalSection,
    },
    suggestions: sortedSuggestions,
  };
}

export interface CompletenessLevelInfo {
  label: "Just Getting Started" | "Building Your Profile" | "Good Progress" | "Almost Complete" | "Profile Complete";
  badgeBg: string;
  badgeColor: string;
}

export function getCompletenessLevel(percentage: number): CompletenessLevelInfo {
  if (percentage > 90) {
    return {
      label: "Profile Complete",
      badgeBg: "bg-emerald-100",
      badgeColor: "text-emerald-800 border-emerald-300",
    };
  } else if (percentage > 75) {
    return {
      label: "Almost Complete",
      badgeBg: "bg-lime-100",
      badgeColor: "text-lime-800 border-lime-300",
    };
  } else if (percentage > 50) {
    return {
      label: "Good Progress",
      badgeBg: "bg-amber-100",
      badgeColor: "text-amber-800 border-amber-300",
    };
  } else if (percentage > 25) {
    return {
      label: "Building Your Profile",
      badgeBg: "bg-sky-100",
      badgeColor: "text-sky-800 border-sky-300",
    };
  } else {
    return {
      label: "Just Getting Started",
      badgeBg: "bg-neutral-100",
      badgeColor: "text-neutral-700 border-neutral-300",
    };
  }
}

