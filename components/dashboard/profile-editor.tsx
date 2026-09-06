"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  File02Icon,
  Brain02Icon,
  Briefcase02Icon,
  Mortarboard02Icon,
  Folder02Icon,
  Award01Icon,
  InformationCircleIcon,
  PlusSignIcon,
  Delete02Icon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  FloppyDiskIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  FullUserProfile,
  ResumeSkillItem,
  ResumeWorkExperience,
  ResumeEducation,
  ResumeProject,
  ResumeCertification,
  ResumeAdditionalInfo,
} from "@/types/resume";

interface ProfileEditorProps {
  initialProfile: FullUserProfile;
}

const SKILL_CATEGORIES = [
  "Technical Skills",
  "Programming Languages",
  "Frameworks & Libraries",
  "Tools & Technologies",
  "Soft Skills",
  "Other",
] as const;

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [profile, setProfile] = useState<FullUserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // New skill input state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<ResumeSkillItem["category"]>("Technical Skills");
  const [newSkillLevel, setNewSkillLevel] = useState<ResumeSkillItem["level"]>("Advanced");

  const markDirty = () => {
    setIsDirty(true);
    setSaveSuccess(false);
    setSaveError(null);
  };

  // --------------------------------------------------------------------------
  // Profile Completeness Calculation
  // --------------------------------------------------------------------------
  const completeness = useMemo(() => {
    let score = 0;

    // 1. Personal Details (20%)
    if (profile.full_name && profile.full_name.trim().length > 0) score += 10;
    if (profile.email && profile.email.trim().length > 0) score += 5;
    if (profile.phone && profile.phone.trim().length > 0) score += 5;

    // 2. Headline & Location (10%)
    if (profile.headline && profile.headline.trim().length > 0) score += 5;
    if (profile.location && profile.location.trim().length > 0) score += 5;

    // 3. Professional Summary (15%)
    if (profile.summary && profile.summary.trim().length > 20) score += 15;

    // 4. Skills (15%)
    const skillCount = (profile.categorized_skills || []).length;
    if (skillCount >= 3) score += 15;
    else if (skillCount > 0) score += 8;

    // 5. Work Experience (15%)
    if ((profile.work_experiences || []).length >= 1) score += 15;

    // 6. Education (10%)
    if ((profile.educations || []).length >= 1) score += 10;

    // 7. Projects (10%)
    if ((profile.projects || []).length >= 1) score += 10;

    // 8. Certifications (5%)
    if ((profile.certifications || []).length >= 1) score += 5;

    return Math.min(100, Math.max(0, score));
  }, [profile]);

  // --------------------------------------------------------------------------
  // Handlers for Personal Info & Summary
  // --------------------------------------------------------------------------
  const updatePersonalInfo = (field: keyof FullUserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Skills Management
  // --------------------------------------------------------------------------
  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    const currentSkills = profile.categorized_skills || [];
    if (currentSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillName("");
      return;
    }

    const newSkill: ResumeSkillItem = {
      id: `skill-${Date.now()}`,
      name: trimmed,
      category: newSkillCategory,
      level: newSkillLevel,
      order_index: currentSkills.length,
    };

    const updated = [...currentSkills, newSkill];
    setProfile((prev) => ({
      ...prev,
      categorized_skills: updated,
      skills: updated.map((s) => s.name),
    }));
    setNewSkillName("");
    markDirty();
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = profile.categorized_skills || [];
    const updated = currentSkills.filter((s) => s.name !== skillToRemove);
    setProfile((prev) => ({
      ...prev,
      categorized_skills: updated,
      skills: updated.map((s) => s.name),
    }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Work Experience Management
  // --------------------------------------------------------------------------
  const handleAddExperience = () => {
    const newExp: ResumeWorkExperience = {
      id: `exp-${Date.now()}`,
      company_name: "",
      position: "",
      employment_type: "Full-time",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: "",
      highlights: [],
      order_index: (profile.work_experiences || []).length,
    };
    setProfile((prev) => ({
      ...prev,
      work_experiences: [newExp, ...(prev.work_experiences || [])],
    }));
    markDirty();
  };

  const updateExperience = (index: number, field: keyof ResumeWorkExperience, value: any) => {
    const current = [...(profile.work_experiences || [])];
    current[index] = { ...current[index], [field]: value };
    setProfile((prev) => ({ ...prev, work_experiences: current }));
    markDirty();
  };

  const removeExperience = (index: number) => {
    const current = [...(profile.work_experiences || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, work_experiences: current }));
    markDirty();
  };

  const addExperienceHighlight = (expIndex: number, text: string) => {
    if (!text.trim()) return;
    const current = [...(profile.work_experiences || [])];
    const exp = current[expIndex];
    exp.highlights = [...(exp.highlights || []), text.trim()];
    setProfile((prev) => ({ ...prev, work_experiences: current }));
    markDirty();
  };

  const removeExperienceHighlight = (expIndex: number, highlightIndex: number) => {
    const current = [...(profile.work_experiences || [])];
    const exp = current[expIndex];
    exp.highlights = (exp.highlights || []).filter((_, i) => i !== highlightIndex);
    setProfile((prev) => ({ ...prev, work_experiences: current }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Education Management
  // --------------------------------------------------------------------------
  const handleAddEducation = () => {
    const newEdu: ResumeEducation = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      field_of_study: "",
      location: "",
      start_date: "",
      end_date: "",
      grade: "",
      description: "",
      order_index: (profile.educations || []).length,
    };
    setProfile((prev) => ({
      ...prev,
      educations: [newEdu, ...(prev.educations || [])],
    }));
    markDirty();
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: any) => {
    const current = [...(profile.educations || [])];
    current[index] = { ...current[index], [field]: value };
    setProfile((prev) => ({ ...prev, educations: current }));
    markDirty();
  };

  const removeEducation = (index: number) => {
    const current = [...(profile.educations || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, educations: current }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Project Management
  // --------------------------------------------------------------------------
  const handleAddProject = () => {
    const newProj: ResumeProject = {
      id: `proj-${Date.now()}`,
      title: "",
      description: "",
      technologies: [],
      github_url: "",
      live_url: "",
      highlights: [],
      order_index: (profile.projects || []).length,
    };
    setProfile((prev) => ({
      ...prev,
      projects: [newProj, ...(prev.projects || [])],
    }));
    markDirty();
  };

  const updateProject = (index: number, field: keyof ResumeProject, value: any) => {
    const current = [...(profile.projects || [])];
    current[index] = { ...current[index], [field]: value };
    setProfile((prev) => ({ ...prev, projects: current }));
    markDirty();
  };

  const removeProject = (index: number) => {
    const current = [...(profile.projects || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, projects: current }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Certification Management
  // --------------------------------------------------------------------------
  const handleAddCertification = () => {
    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiration_date: "",
      credential_id: "",
      credential_url: "",
      order_index: (profile.certifications || []).length,
    };
    setProfile((prev) => ({
      ...prev,
      certifications: [newCert, ...(prev.certifications || [])],
    }));
    markDirty();
  };

  const updateCertification = (index: number, field: keyof ResumeCertification, value: any) => {
    const current = [...(profile.certifications || [])];
    current[index] = { ...current[index], [field]: value };
    setProfile((prev) => ({ ...prev, certifications: current }));
    markDirty();
  };

  const removeCertification = (index: number) => {
    const current = [...(profile.certifications || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, certifications: current }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Additional Info Management
  // --------------------------------------------------------------------------
  const handleAddAdditionalInfo = () => {
    const newAddit: ResumeAdditionalInfo = {
      id: `addit-${Date.now()}`,
      category: "Award",
      title: "",
      description: "",
      date: "",
      url: "",
      order_index: (profile.additional_info || []).length,
    };
    setProfile((prev) => ({
      ...prev,
      additional_info: [newAddit, ...(prev.additional_info || [])],
    }));
    markDirty();
  };

  const updateAdditionalInfo = (index: number, field: keyof ResumeAdditionalInfo, value: any) => {
    const current = [...(profile.additional_info || [])];
    current[index] = { ...current[index], [field]: value };
    setProfile((prev) => ({ ...prev, additional_info: current }));
    markDirty();
  };

  const removeAdditionalInfo = (index: number) => {
    const current = [...(profile.additional_info || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, additional_info: current }));
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Save All Changes
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Tabs configuration
  const tabsList = [
    {
      id: "personal",
      label: "Personal Information",
      icon: UserIcon,
      isDone: !!(profile.full_name && profile.email),
    },
    {
      id: "summary",
      label: "Professional Summary",
      icon: File02Icon,
      isDone: !!(profile.summary && profile.summary.trim().length > 15),
    },
    {
      id: "skills",
      label: "Skills",
      icon: Brain02Icon,
      count: (profile.categorized_skills || []).length,
      isDone: (profile.categorized_skills || []).length > 0,
    },
    {
      id: "experience",
      label: "Work Experience",
      icon: Briefcase02Icon,
      count: (profile.work_experiences || []).length,
      isDone: (profile.work_experiences || []).length > 0,
    },
    {
      id: "education",
      label: "Education",
      icon: Mortarboard02Icon,
      count: (profile.educations || []).length,
      isDone: (profile.educations || []).length > 0,
    },
    {
      id: "projects",
      label: "Projects",
      icon: Folder02Icon,
      count: (profile.projects || []).length,
      isDone: (profile.projects || []).length > 0,
    },
    {
      id: "certifications",
      label: "Certifications",
      icon: Award01Icon,
      count: (profile.certifications || []).length,
      isDone: (profile.certifications || []).length > 0,
    },
    {
      id: "additional",
      label: "Additional Information",
      icon: InformationCircleIcon,
      count: (profile.additional_info || []).length,
      isDone: (profile.additional_info || []).length > 0,
    },
  ];

  const currentTabIndex = tabsList.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? tabsList[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < tabsList.length - 1 ? tabsList[currentTabIndex + 1] : null;

  return (
    <div className="space-y-8 pb-20">
      {/* ==================================================================== */}
      {/* 1. PROFILE SUMMARY HERO CARD & COMPLETENESS INDICATORS               */}
      {/* ==================================================================== */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#18181B] via-[#16151e] to-[#12111d] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="pointer-events-none absolute left-10 -bottom-10 size-64 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Avatar & Details */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            <div className="size-16 sm:size-18 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-lg shadow-indigo-500/20">
              <div className="size-full rounded-[14px] bg-[#18181B] flex items-center justify-center font-bold text-xl sm:text-2xl text-white overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Candidate Avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                <HugeiconsIcon icon={UserIcon} className="size-3.5" />
                <span>Candidate Profile</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] truncate">
                  {profile.full_name || "Candidate Name"}
                </h2>
                {completeness >= 80 ? (
                  <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold py-0.5 px-2">
                    Application Ready
                  </Badge>
                ) : (
                  <Badge className="border-indigo-500/30 bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold py-0.5 px-2">
                    Setup In Progress
                  </Badge>
                )}
              </div>

              <p className="text-sm font-medium text-zinc-300 truncate">
                {profile.headline || "Configure your professional headline"}
              </p>

              <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-0.5">
                {profile.email && <span className="truncate">{profile.email}</span>}
                {profile.email && profile.location && <span>•</span>}
                {profile.location && <span>{profile.location}</span>}
                {profile.phone && <span>•</span>}
                {profile.phone && <span>{profile.phone}</span>}
              </div>
            </div>
          </div>

          {/* Completeness Section: Horizontal Bar + Circular Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-4 lg:pt-0 lg:pl-8 shrink-0">
            {/* Horizontal Progress bar */}
            <div className="space-y-2 w-full sm:w-52">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Profile Completeness</span>
                <span className="font-bold text-indigo-400">{completeness}% Complete</span>
              </div>

              <div className="h-2.5 w-full bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-tight">
                {completeness < 50
                  ? "Fill out key sections to unlock targeted AI job applications."
                  : completeness < 85
                  ? "Great progress! Add your projects and skills to hit 100%."
                  : "Excellent! Your profile is fully optimized for AI auto-fill."}
              </p>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex flex-col items-center justify-center size-[96px] shrink-0 mx-auto sm:mx-0">
              <svg className="size-full -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-zinc-800/90"
                  strokeWidth="8"
                  fill="none"
                />
                <defs>
                  <linearGradient id="circleProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#circleProgressGrad)"
                  strokeWidth="8"
                  strokeDasharray={251.3}
                  strokeDashoffset={251.3 - (completeness / 100) * 251.3}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-extrabold text-[#FAFAFA] tracking-tight">
                  {completeness}%
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 -mt-0.5">
                  Complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* 2. STICKY TOP ACTION BAR                                             */}
      {/* ==================================================================== */}
      <div className="sticky top-0 z-20 bg-[#09090B]/90 backdrop-blur-md py-3.5 border-b border-zinc-800 -mx-4 px-4 sm:-mx-8 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isDirty ? (
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs font-medium gap-1.5 animate-pulse py-1 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved Changes
            </Badge>
          ) : (
            <Badge className="bg-zinc-800/80 text-zinc-300 border-zinc-700 text-xs font-medium gap-1.5 py-1 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Changes Saved
            </Badge>
          )}

          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
              Saved to database!
            </span>
          )}

          {saveError && (
            <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
              {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/dashboard/resume"
            className="text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-purple-400" />
            Upload Resume to Auto-Fill
          </Link>

          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 font-medium gap-2 px-5 text-xs h-9 rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MODERN TAB NAVIGATION                                             */}
      {/* ==================================================================== */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500"
                    : "bg-[#18181B] text-zinc-400 border border-zinc-800 hover:text-[#FAFAFA] hover:border-zinc-700"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} className={`size-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{tab.label}</span>

                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.isDone && typeof tab.count !== "number" && (
                  <span className={`text-[10px] font-bold ${isActive ? "text-white" : "text-emerald-400"}`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* 4. ACTIVE TAB CONTENT PANELS                                         */}
        {/* ==================================================================== */}

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === "personal" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                      <HugeiconsIcon icon={UserIcon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Candidate contact info, headline, and public profile links.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[11px]">
                    Editable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Full Name *</label>
                  <Input
                    value={profile.full_name || ""}
                    onChange={(e) => updatePersonalInfo("full_name", e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Professional Headline *</label>
                  <Input
                    value={profile.headline || ""}
                    onChange={(e) => updatePersonalInfo("headline", e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Email Address *</label>
                  <Input
                    value={profile.email || ""}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                    placeholder="jane@example.com"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Phone Number</label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Location / City & Country</label>
                  <Input
                    value={profile.location || ""}
                    onChange={(e) => updatePersonalInfo("location", e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">LinkedIn Profile URL</label>
                  <Input
                    value={profile.linkedin_url || ""}
                    onChange={(e) => updatePersonalInfo("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">GitHub Profile URL</label>
                  <Input
                    value={profile.github_url || ""}
                    onChange={(e) => updatePersonalInfo("github_url", e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Portfolio / Personal Website</label>
                  <Input
                    value={profile.portfolio_url || ""}
                    onChange={(e) => updatePersonalInfo("portfolio_url", e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PROFESSIONAL SUMMARY */}
        {activeTab === "summary" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                      <HugeiconsIcon icon={File02Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Professional Summary
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        An executive career introduction, highlighting your strengths and target roles.
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={profile.summary || ""}
                  onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                  placeholder="e.g. Experienced Software Engineer with 5+ years of expertise in architecting high-scale distributed systems, React, TypeScript, and cloud-native microservices..."
                  className="min-h-[160px] text-sm leading-relaxed bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 focus:border-indigo-500 rounded-xl p-4"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
                  <span>Supports multi-paragraph career objectives</span>
                  <span>{(profile.summary || "").length} characters</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: SKILLS */}
        {activeTab === "skills" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <HugeiconsIcon icon={Brain02Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Skills & Competencies
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Categorized programming languages, frameworks, cloud tools, and soft skills.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                    {(profile.categorized_skills || []).length} skills
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Quick Add Skill Form */}
                <div className="p-4 rounded-2xl bg-[#121215] border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    placeholder="Add skill (e.g. TypeScript, React, Docker, Leadership)"
                    className="h-10 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                  />

                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    className="h-10 px-3.5 rounded-xl border border-zinc-800 bg-[#09090B] text-xs font-medium text-zinc-200 outline-none"
                  >
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as any)}
                    className="h-10 px-3.5 rounded-xl border border-zinc-800 bg-[#09090B] text-xs font-medium text-zinc-200 outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>

                  <Button
                    size="sm"
                    onClick={handleAddSkill}
                    disabled={!newSkillName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-5 shrink-0 font-medium gap-1.5 rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Skill
                  </Button>
                </div>

                {/* Categorized Display */}
                {SKILL_CATEGORIES.map((cat) => {
                  const skillsInCat = (profile.categorized_skills || []).filter(
                    (s) => s.category === cat
                  );
                  if (skillsInCat.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          {cat}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {skillsInCat.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skillsInCat.map((skill) => (
                          <span
                            key={skill.name}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-medium text-zinc-200 shadow-xs hover:border-zinc-600 transition-colors"
                          >
                            <span>{skill.name}</span>
                            {skill.level && (
                              <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-500/30">
                                {skill.level}
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveSkill(skill.name)}
                              className="text-zinc-400 hover:text-rose-400 ml-0.5 p-0.5 rounded-full hover:bg-zinc-700 cursor-pointer"
                              title="Remove skill"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {(profile.categorized_skills || []).length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No skills added yet. Type a skill above or upload your resume to auto-populate.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                      <HugeiconsIcon icon={Briefcase02Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Work Experience
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Previous and current roles, companies, employment dates, and key accomplishments.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddExperience}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {(profile.work_experiences || []).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No work experiences added yet. Click "Add Experience" or upload your resume.
                  </div>
                ) : (
                  (profile.work_experiences || []).map((exp, expIdx) => (
                    <div
                      key={exp.id || expIdx}
                      className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-4 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                          Experience #{expIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(expIdx)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs rounded-lg cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Company Name *</label>
                          <Input
                            value={exp.company_name}
                            onChange={(e) => updateExperience(expIdx, "company_name", e.target.value)}
                            placeholder="e.g. Google, Meta, Stripe"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Job Title / Position *</label>
                          <Input
                            value={exp.position}
                            onChange={(e) => updateExperience(expIdx, "position", e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Employment Type</label>
                          <Input
                            value={exp.employment_type || ""}
                            onChange={(e) => updateExperience(expIdx, "employment_type", e.target.value)}
                            placeholder="Full-time, Part-time, Contract, Internship"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Location</label>
                          <Input
                            value={exp.location || ""}
                            onChange={(e) => updateExperience(expIdx, "location", e.target.value)}
                            placeholder="New York, NY or Remote"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Start Date</label>
                          <Input
                            value={exp.start_date || ""}
                            onChange={(e) => updateExperience(expIdx, "start_date", e.target.value)}
                            placeholder="e.g. Jan 2021"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-300">End Date</label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!exp.is_current}
                                onChange={(e) => {
                                  updateExperience(expIdx, "is_current", e.target.checked);
                                  if (e.target.checked) updateExperience(expIdx, "end_date", "Present");
                                }}
                                className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                              />
                              Currently Working Here
                            </label>
                          </div>
                          <Input
                            value={exp.is_current ? "Present" : exp.end_date || ""}
                            disabled={exp.is_current}
                            onChange={(e) => updateExperience(expIdx, "end_date", e.target.value)}
                            placeholder="e.g. Present or Dec 2023"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Overview */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Overview / Responsibilities</label>
                        <Textarea
                          value={exp.description || ""}
                          onChange={(e) => updateExperience(expIdx, "description", e.target.value)}
                          placeholder="Brief summary of the role, team, and scope..."
                          className="min-h-[70px] text-xs bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                        />
                      </div>

                      {/* Bullet points / Highlights */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Key Achievements & Bullet Points</label>
                        <div className="space-y-1.5">
                          {(exp.highlights || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <span className="text-indigo-400 mt-1 font-bold">•</span>
                              <Input
                                value={bullet}
                                onChange={(e) => {
                                  const newHighlights = [...(exp.highlights || [])];
                                  newHighlights[bIdx] = e.target.value;
                                  updateExperience(expIdx, "highlights", newHighlights);
                                }}
                                className="h-8 text-xs bg-[#09090B] border-zinc-800 text-[#FAFAFA] flex-1 rounded-lg"
                              />
                              <button
                                onClick={() => removeExperienceHighlight(expIdx, bIdx)}
                                className="text-zinc-500 hover:text-rose-400 p-1 text-xs cursor-pointer"
                                title="Remove bullet point"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add bullet input */}
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            id={`add-bullet-${expIdx}`}
                            placeholder="Add new achievement bullet point (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addExperienceHighlight(expIdx, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                            className="h-8 text-xs bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 flex-1 rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById(`add-bullet-${expIdx}`) as HTMLInputElement;
                              if (input && input.value) {
                                addExperienceHighlight(expIdx, input.value);
                                input.value = "";
                              }
                            }}
                            className="h-8 text-xs px-3 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg cursor-pointer"
                          >
                            Add Bullet
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: EDUCATION */}
        {activeTab === "education" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                      <HugeiconsIcon icon={Mortarboard02Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Education
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Universities, degrees, fields of study, graduation dates, and academic honors.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddEducation}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Education
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(profile.educations || []).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No education history added yet. Click "Add Education" or upload your resume.
                  </div>
                ) : (
                  (profile.educations || []).map((edu, eduIdx) => (
                    <div
                      key={edu.id || eduIdx}
                      className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                          Education #{eduIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(eduIdx)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs rounded-lg cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Institution / University *</label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(eduIdx, "institution", e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Degree *</label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(eduIdx, "degree", e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Field of Study</label>
                          <Input
                            value={edu.field_of_study || ""}
                            onChange={(e) => updateEducation(eduIdx, "field_of_study", e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Grade / GPA</label>
                          <Input
                            value={edu.grade || ""}
                            onChange={(e) => updateEducation(eduIdx, "grade", e.target.value)}
                            placeholder="e.g. 3.9 / 4.0 or First Class"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Start Date</label>
                          <Input
                            value={edu.start_date || ""}
                            onChange={(e) => updateEducation(eduIdx, "start_date", e.target.value)}
                            placeholder="e.g. 2018"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Graduation / End Date</label>
                          <Input
                            value={edu.end_date || ""}
                            onChange={(e) => updateEducation(eduIdx, "end_date", e.target.value)}
                            placeholder="e.g. 2022"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6: PROJECTS */}
        {activeTab === "projects" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <HugeiconsIcon icon={Folder02Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Projects & Portfolio
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Key software projects, open-source work, and deployed applications.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddProject}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(profile.projects || []).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No projects added yet. Click "Add Project" or upload your resume.
                  </div>
                ) : (
                  (profile.projects || []).map((proj, projIdx) => (
                    <div
                      key={proj.id || projIdx}
                      className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                          Project #{projIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(projIdx)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs rounded-lg cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Project Name *</label>
                          <Input
                            value={proj.title}
                            onChange={(e) => updateProject(projIdx, "title", e.target.value)}
                            placeholder="e.g. AI Workflow Automation"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Technologies (comma-separated)</label>
                          <Input
                            value={(proj.technologies || []).join(", ")}
                            onChange={(e) =>
                              updateProject(
                                projIdx,
                                "technologies",
                                e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                              )
                            }
                            placeholder="React, Next.js, Supabase, Tailwind"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">GitHub Link</label>
                          <Input
                            value={proj.github_url || ""}
                            onChange={(e) => updateProject(projIdx, "github_url", e.target.value)}
                            placeholder="https://github.com/username/project"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Live Demo / Deployment URL</label>
                          <Input
                            value={proj.live_url || ""}
                            onChange={(e) => updateProject(projIdx, "live_url", e.target.value)}
                            placeholder="https://project.vercel.app"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Description & Key Features</label>
                        <Textarea
                          value={proj.description || ""}
                          onChange={(e) => updateProject(projIdx, "description", e.target.value)}
                          placeholder="Describe what you built, architecture decisions, and metrics achieved..."
                          className="min-h-[70px] text-xs bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 7: CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                      <HugeiconsIcon icon={Award01Icon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Certifications & Licenses
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Official certifications, course completions, and verified credentials.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddCertification}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Certification
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(profile.certifications || []).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No certifications added yet. Click "Add Certification" or upload your resume.
                  </div>
                ) : (
                  (profile.certifications || []).map((cert, certIdx) => (
                    <div
                      key={cert.id || certIdx}
                      className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                          Certification #{certIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(certIdx)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs rounded-lg cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Certification Name *</label>
                          <Input
                            value={cert.name}
                            onChange={(e) => updateCertification(certIdx, "name", e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Issuing Organization *</label>
                          <Input
                            value={cert.issuing_organization}
                            onChange={(e) => updateCertification(certIdx, "issuing_organization", e.target.value)}
                            placeholder="e.g. Amazon Web Services, Google"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Issue Date</label>
                          <Input
                            value={cert.issue_date || ""}
                            onChange={(e) => updateCertification(certIdx, "issue_date", e.target.value)}
                            placeholder="e.g. May 2023"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Credential URL</label>
                          <Input
                            value={cert.credential_url || ""}
                            onChange={(e) => updateCertification(certIdx, "credential_url", e.target.value)}
                            placeholder="https://www.credly.com/badges/..."
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 8: ADDITIONAL INFORMATION */}
        {activeTab === "additional" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm">
              <CardHeader className="pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                      <HugeiconsIcon icon={InformationCircleIcon} className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#FAFAFA]">
                        Additional Information
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-400">
                        Awards, publications, spoken languages, volunteer experience, and professional honors.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddAdditionalInfo}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 h-8 text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(profile.additional_info || []).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No additional entries added yet. Click "Add Item" or upload your resume.
                  </div>
                ) : (
                  (profile.additional_info || []).map((item, itemIdx) => (
                    <div
                      key={item.id || itemIdx}
                      className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                          Entry #{itemIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalInfo(itemIdx)}
                          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 text-xs rounded-lg cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-300">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateAdditionalInfo(itemIdx, "category", e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-zinc-800 bg-[#09090B] text-xs font-medium text-zinc-200 outline-none"
                          >
                            <option value="Award">Award / Honor</option>
                            <option value="Publication">Publication</option>
                            <option value="Language">Language</option>
                            <option value="Volunteer">Volunteer</option>
                            <option value="Interest">Interest</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-zinc-300">Title / Details *</label>
                          <Input
                            value={item.title}
                            onChange={(e) => updateAdditionalInfo(itemIdx, "title", e.target.value)}
                            placeholder="e.g. 1st Place National Hackathon, English (Fluent)"
                            className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-300">Description or Link URL</label>
                        <Input
                          value={item.description || item.url || ""}
                          onChange={(e) => updateAdditionalInfo(itemIdx, "description", e.target.value)}
                          placeholder="Optional link or additional context..."
                          className="h-9 text-sm bg-[#09090B] border-zinc-800 text-[#FAFAFA] placeholder:text-zinc-500 rounded-xl"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 5. BOTTOM TAB PAGER / PREV-NEXT CONTROLS                             */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          {prevTab ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(prevTab.id)}
              className="gap-2 border-zinc-800 bg-[#18181B] text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs h-9 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
              <span>Previous: {prevTab.label}</span>
            </Button>
          ) : (
            <div />
          )}

          {nextTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(nextTab.id)}
              className="gap-2 border-zinc-800 bg-[#18181B] text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs h-9 cursor-pointer"
            >
              <span>Next: {nextTab.label}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
