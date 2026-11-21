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
import { ProfileDatePicker } from "./profile-date-picker";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
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

  // Form Validation States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addAlertMessage, setAddAlertMessage] = useState<{ section: string; message: string } | null>(null);

  const clearFieldError = (key: string) => {
    setValidationErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setAddAlertMessage(null);
    setSaveError(null);
  };

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
  // Fair, Deterministic Profile Completeness & Suggestions Calculation
  // --------------------------------------------------------------------------
  const completenessResult = useMemo(() => {
    return calculateProfileCompleteness(profile);
  }, [profile]);

  const completeness = completenessResult.completionPercentage;
  const completionLevel = completenessResult.completionLevel;
  const suggestions = completenessResult.suggestions;

  // --------------------------------------------------------------------------
  // Handlers for Personal Info & Summary
  // --------------------------------------------------------------------------
  const updatePersonalInfo = (field: keyof FullUserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
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
    const experiences = profile.work_experiences || [];
    const incompleteIdx = experiences.findIndex(
      (exp) => !exp.company_name?.trim() || !exp.position?.trim()
    );

    if (incompleteIdx !== -1) {
      const incompleteExp = experiences[incompleteIdx];
      const errors: Record<string, string> = {};
      if (!incompleteExp.company_name?.trim()) {
        errors[`exp_${incompleteIdx}_company_name`] = "Company name is required";
      }
      if (!incompleteExp.position?.trim()) {
        errors[`exp_${incompleteIdx}_position`] = "Job title is required";
      }
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      setAddAlertMessage({
        section: "experience",
        message: "Please complete the current work experience before adding another one.",
      });

      setTimeout(() => {
        const el = document.getElementById(`exp-card-${incompleteIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setAddAlertMessage(null);
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
    clearFieldError(`exp_${index}_${field}`);
    markDirty();
  };

  const removeExperience = (index: number) => {
    const current = [...(profile.work_experiences || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, work_experiences: current }));
    // Clear any validation errors for this experience
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`exp_${index}_`)) delete next[k];
      });
      return next;
    });
    setAddAlertMessage(null);
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
    const educations = profile.educations || [];
    const incompleteIdx = educations.findIndex(
      (edu) => !edu.institution?.trim() || !edu.degree?.trim()
    );

    if (incompleteIdx !== -1) {
      const incompleteEdu = educations[incompleteIdx];
      const errors: Record<string, string> = {};
      if (!incompleteEdu.institution?.trim()) {
        errors[`edu_${incompleteIdx}_institution`] = "Institution / University is required";
      }
      if (!incompleteEdu.degree?.trim()) {
        errors[`edu_${incompleteIdx}_degree`] = "Degree is required";
      }
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      setAddAlertMessage({
        section: "education",
        message: "Please complete the current education entry before adding another one.",
      });

      setTimeout(() => {
        const el = document.getElementById(`edu-card-${incompleteIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setAddAlertMessage(null);
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
    clearFieldError(`edu_${index}_${field}`);
    markDirty();
  };

  const removeEducation = (index: number) => {
    const current = [...(profile.educations || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, educations: current }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`edu_${index}_`)) delete next[k];
      });
      return next;
    });
    setAddAlertMessage(null);
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Project Management
  // --------------------------------------------------------------------------
  const handleAddProject = () => {
    const projects = profile.projects || [];
    const incompleteIdx = projects.findIndex((p) => !p.title?.trim());

    if (incompleteIdx !== -1) {
      setValidationErrors((prev) => ({
        ...prev,
        [`proj_${incompleteIdx}_title`]: "Project title is required",
      }));
      setAddAlertMessage({
        section: "projects",
        message: "Please enter a title for the current project before adding another one.",
      });

      setTimeout(() => {
        const el = document.getElementById(`proj-card-${incompleteIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setAddAlertMessage(null);
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
    clearFieldError(`proj_${index}_${field}`);
    markDirty();
  };

  const removeProject = (index: number) => {
    const current = [...(profile.projects || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, projects: current }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`proj_${index}_`)) delete next[k];
      });
      return next;
    });
    setAddAlertMessage(null);
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Certification Management
  // --------------------------------------------------------------------------
  const handleAddCertification = () => {
    const certs = profile.certifications || [];
    const incompleteIdx = certs.findIndex(
      (c) => !c.name?.trim() || !c.issuing_organization?.trim()
    );

    if (incompleteIdx !== -1) {
      const incompleteCert = certs[incompleteIdx];
      const errors: Record<string, string> = {};
      if (!incompleteCert.name?.trim()) {
        errors[`cert_${incompleteIdx}_name`] = "Certification name is required";
      }
      if (!incompleteCert.issuing_organization?.trim()) {
        errors[`cert_${incompleteIdx}_issuing_organization`] = "Issuing organization is required";
      }
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      setAddAlertMessage({
        section: "certifications",
        message: "Please complete the current certification before adding another one.",
      });

      setTimeout(() => {
        const el = document.getElementById(`cert-card-${incompleteIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setAddAlertMessage(null);
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
    clearFieldError(`cert_${index}_${field}`);
    markDirty();
  };

  const removeCertification = (index: number) => {
    const current = [...(profile.certifications || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, certifications: current }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`cert_${index}_`)) delete next[k];
      });
      return next;
    });
    setAddAlertMessage(null);
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Additional Info Management
  // --------------------------------------------------------------------------
  const handleAddAdditionalInfo = () => {
    const items = profile.additional_info || [];
    const incompleteIdx = items.findIndex((item) => !item.title?.trim());

    if (incompleteIdx !== -1) {
      setValidationErrors((prev) => ({
        ...prev,
        [`addit_${incompleteIdx}_title`]: "Title / details is required",
      }));
      setAddAlertMessage({
        section: "additional",
        message: "Please complete the current entry before adding another one.",
      });

      setTimeout(() => {
        const el = document.getElementById(`addit-card-${incompleteIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setAddAlertMessage(null);
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
    clearFieldError(`addit_${index}_${field}`);
    markDirty();
  };

  const removeAdditionalInfo = (index: number) => {
    const current = [...(profile.additional_info || [])];
    current.splice(index, 1);
    setProfile((prev) => ({ ...prev, additional_info: current }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`addit_${index}_`)) delete next[k];
      });
      return next;
    });
    setAddAlertMessage(null);
    markDirty();
  };

  // --------------------------------------------------------------------------
  // Save All Changes (Validates required fields, prunes blank drafts before saving)
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    try {
      setSaveError(null);
      const errors: Record<string, string> = {};
      let firstErrorTab: string | null = null;
      let firstErrorElementId: string | null = null;

      // 1. Personal Info Validation
      if (!profile.full_name || profile.full_name.trim().length === 0) {
        errors["full_name"] = "Full name is required.";
        if (!firstErrorTab) {
          firstErrorTab = "personal";
          firstErrorElementId = "input-full_name";
        }
      }

      if (!profile.email || profile.email.trim().length === 0) {
        errors["email"] = "Email address is required.";
        if (!firstErrorTab) {
          firstErrorTab = "personal";
          firstErrorElementId = "input-email";
        }
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
        errors["email"] = "Please enter a valid email address.";
        if (!firstErrorTab) {
          firstErrorTab = "personal";
          firstErrorElementId = "input-email";
        }
      }

      // 2. Work Experiences Validation
      (profile.work_experiences || []).forEach((exp, idx) => {
        if (!exp.company_name?.trim()) {
          errors[`exp_${idx}_company_name`] = "Company name is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "experience";
            firstErrorElementId = `exp-company-${idx}`;
          }
        }
        if (!exp.position?.trim()) {
          errors[`exp_${idx}_position`] = "Job title is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "experience";
            firstErrorElementId = `exp-position-${idx}`;
          }
        }
      });

      // 3. Education Validation
      (profile.educations || []).forEach((edu, idx) => {
        if (!edu.institution?.trim()) {
          errors[`edu_${idx}_institution`] = "Institution is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "education";
            firstErrorElementId = `edu-institution-${idx}`;
          }
        }
        if (!edu.degree?.trim()) {
          errors[`edu_${idx}_degree`] = "Degree is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "education";
            firstErrorElementId = `edu-degree-${idx}`;
          }
        }
      });

      // 4. Projects Validation
      (profile.projects || []).forEach((proj, idx) => {
        if (!proj.title?.trim()) {
          errors[`proj_${idx}_title`] = "Project title is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "projects";
            firstErrorElementId = `proj-title-${idx}`;
          }
        }
      });

      // 5. Certifications Validation
      (profile.certifications || []).forEach((cert, idx) => {
        if (!cert.name?.trim()) {
          errors[`cert_${idx}_name`] = "Certification name is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "certifications";
            firstErrorElementId = `cert-name-${idx}`;
          }
        }
        if (!cert.issuing_organization?.trim()) {
          errors[`cert_${idx}_issuing_organization`] = "Issuing organization is required.";
          if (!firstErrorTab) {
            firstErrorTab = "certifications";
            firstErrorElementId = `cert-issuer-${idx}`;
          }
        }
      });

      // 6. Additional Info Validation
      (profile.additional_info || []).forEach((item, idx) => {
        if (!item.title?.trim()) {
          errors[`addit_${idx}_title`] = "Title / details is required (or delete this entry).";
          if (!firstErrorTab) {
            firstErrorTab = "additional";
            firstErrorElementId = `addit-title-${idx}`;
          }
        }
      });

      // If any validation errors exist, stop and display
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setSaveError("Please complete all required fields before saving.");
        if (firstErrorTab) {
          setActiveTab(firstErrorTab);
        }
        setTimeout(() => {
          if (firstErrorElementId) {
            const el = document.getElementById(firstErrorElementId);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.focus();
              }
            }
          }
        }, 120);
        return;
      }

      setIsSaving(true);

      // Clean profile before saving: strip out any blank/empty drafts
      const cleanedProfile: FullUserProfile = {
        ...profile,
        categorized_skills: (profile.categorized_skills || []).filter(
          (s) => s && s.name && s.name.trim().length > 0
        ),
        skills: (profile.categorized_skills || [])
          .filter((s) => s && s.name && s.name.trim().length > 0)
          .map((s) => s.name.trim()),
        work_experiences: (profile.work_experiences || []).filter(
          (exp) =>
            exp &&
            ((exp.company_name && exp.company_name.trim().length > 0) ||
              (exp.position && exp.position.trim().length > 0) ||
              (exp.description && exp.description.trim().length > 0))
        ),
        educations: (profile.educations || []).filter(
          (edu) =>
            edu &&
            ((edu.institution && edu.institution.trim().length > 0) ||
              (edu.degree && edu.degree.trim().length > 0))
        ),
        projects: (profile.projects || []).filter(
          (p) =>
            p &&
            ((p.title && p.title.trim().length > 0) ||
              (p.description && p.description.trim().length > 0))
        ),
        certifications: (profile.certifications || []).filter(
          (c) => c && c.name && c.name.trim().length > 0
        ),
        additional_info: (profile.additional_info || []).filter(
          (a) =>
            a &&
            ((a.title && a.title.trim().length > 0) ||
              (a.description && a.description.trim().length > 0))
        ),
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedProfile),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setProfile(cleanedProfile);
      setValidationErrors({});
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

  // Non-empty counts for tabs
  const validSkillsCount = (profile.categorized_skills || []).filter(
    (s) => s && s.name && s.name.trim().length > 0
  ).length;

  const validExpCount = (profile.work_experiences || []).filter(
    (exp) =>
      exp &&
      ((exp.company_name && exp.company_name.trim().length > 0) ||
        (exp.position && exp.position.trim().length > 0))
  ).length;

  const validEduCount = (profile.educations || []).filter(
    (edu) =>
      edu &&
      ((edu.institution && edu.institution.trim().length > 0) ||
        (edu.degree && edu.degree.trim().length > 0))
  ).length;

  const validProjCount = (profile.projects || []).filter(
    (p) => p && p.title && p.title.trim().length > 0
  ).length;

  const validCertCount = (profile.certifications || []).filter(
    (c) => c && c.name && c.name.trim().length > 0
  ).length;

  const validAdditCount = (profile.additional_info || []).filter(
    (a) => a && a.title && a.title.trim().length > 0
  ).length;

  // Tabs configuration
  const tabsList = [
    {
      id: "personal",
      label: "Personal Information",
      icon: UserIcon,
      isDone: !!(profile.full_name?.trim() && profile.email?.trim()),
    },
    {
      id: "summary",
      label: "Professional Summary",
      icon: File02Icon,
      isDone: !!(profile.summary && profile.summary.trim().length >= 20),
    },
    {
      id: "skills",
      label: "Skills",
      icon: Brain02Icon,
      count: validSkillsCount,
      isDone: validSkillsCount > 0,
    },
    {
      id: "experience",
      label: "Work Experience",
      icon: Briefcase02Icon,
      count: validExpCount,
      isDone: validExpCount > 0,
    },
    {
      id: "education",
      label: "Education",
      icon: Mortarboard02Icon,
      count: validEduCount,
      isDone: validEduCount > 0,
    },
    {
      id: "projects",
      label: "Projects",
      icon: Folder02Icon,
      count: validProjCount,
      isDone: validProjCount > 0,
    },
    {
      id: "certifications",
      label: "Certifications",
      icon: Award01Icon,
      count: validCertCount,
      isDone: validCertCount > 0,
    },
    {
      id: "additional",
      label: "Additional Information",
      icon: InformationCircleIcon,
      count: validAdditCount,
      isDone: validAdditCount > 0,
    },
  ];

  const currentTabIndex = tabsList.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? tabsList[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < tabsList.length - 1 ? tabsList[currentTabIndex + 1] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* ==================================================================== */}
      {/* 1. PROFILE SUMMARY HERO CARD & COMPLETENESS INDICATORS               */}
      {/* ==================================================================== */}
      <Card className="rounded-lg bg-white border border-[#1A1A1A]/15 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Avatar & Details */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-4.5 min-w-0">
            <div className="size-14 sm:size-16 rounded-lg bg-[#E9F2D1] border border-[#1A1A1A]/10 p-0.5 shrink-0 flex items-center justify-center">
              <div className="size-full rounded-md bg-white flex items-center justify-center font-bold text-lg sm:text-xl text-[#171914] overflow-hidden">
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
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#687064] uppercase tracking-wider">
                <HugeiconsIcon icon={UserIcon} className="size-3.5" />
                <span>Verified Profile</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171914] truncate">
                  {profile.full_name || "Candidate Name"}
                </h2>
                <Badge
                  className={`border text-[10px] font-semibold py-0.5 px-2 rounded-md ${
                    completionLevel === "Profile Complete"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : completionLevel === "Almost Complete"
                      ? "bg-[#DDF19B] border-[#9FB944] text-[#1B2710]"
                      : completionLevel === "Good Progress"
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-[#EDEBE0] border-[#1A1A1A]/15 text-[#171914]"
                  }`}
                >
                  {completionLevel}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm font-medium text-[#5A5D55] truncate">
                {profile.headline || "Configure your professional headline"}
              </p>

              <div className="flex items-center gap-3 text-xs text-[#687064] flex-wrap pt-0.5">
                {profile.email && <span className="truncate">{profile.email}</span>}
                {profile.email && profile.location && <span>•</span>}
                {profile.location && <span>{profile.location}</span>}
                {profile.phone && <span>•</span>}
                {profile.phone && <span>{profile.phone}</span>}
              </div>
            </div>
          </div>

          {/* Completeness Section: Horizontal Bar + Circular Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-t lg:border-t-0 lg:border-l border-[#1A1A1A]/10 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            {/* Horizontal Progress bar */}
            <div className="space-y-1.5 w-full sm:w-48">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171914]">Readiness</span>
                <span className="font-bold text-[#171914]">{completeness}%</span>
              </div>

              <div className="h-2 w-full bg-[#E7E5DC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7B9E32] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>

              <p className="text-[10px] text-[#687064] leading-tight">
                {suggestions.length > 0
                  ? suggestions[0].message
                  : "Profile is 100% complete and fully optimized for job applications."}
              </p>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex flex-col items-center justify-center size-[72px] shrink-0 mx-auto sm:mx-0">
              <svg className="size-full -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-[#E7E5DC]"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#7B9E32"
                  strokeWidth="8"
                  strokeDasharray={251.3}
                  strokeDashoffset={251.3 - (completeness / 100) * 251.3}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base font-bold text-[#171914] tracking-tight">
                  {completeness}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* 1.5 INTERACTIVE "IMPROVE YOUR PROFILE" SUGGESTIONS CARD             */}
      {/* ==================================================================== */}
      {suggestions.length > 0 && completeness < 100 && (
        <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1A1A]/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#E9F2D1] text-[#304019]">
                <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#171914]">
                  Improve Your Profile ({completeness}% Complete)
                </h3>
                <p className="text-[11px] text-[#5A5D55]">
                  Complete these recommendations to maximize your matching accuracy.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border border-[#1A1A1A]/15 bg-[#F7F6F0] text-[#171914] text-[10px] font-semibold self-start sm:self-auto rounded-md">
              {suggestions.length} Recommendation{suggestions.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {suggestions.slice(0, 3).map((sugg) => (
              <div
                key={sugg.id}
                className="bg-[#F7F6F0] border border-[#1A1A1A]/10 rounded-md p-3 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold text-[#171914] flex items-center gap-1.5 truncate">
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        className={`size-3.5 shrink-0 ${
                          sugg.priority === "high"
                            ? "text-rose-600"
                            : sugg.priority === "medium"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      />
                      <span className="truncate">{sugg.title}</span>
                    </span>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${
                        sugg.priority === "high"
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : sugg.priority === "medium"
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-blue-50 border-blue-300 text-blue-700"
                      }`}
                    >
                      {sugg.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A5D55] leading-relaxed">
                    {sugg.message}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setActiveTab(sugg.targetTab);
                    if (sugg.targetElementId) {
                      setTimeout(() => {
                        const el = document.getElementById(sugg.targetElementId!);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                            el.focus();
                          }
                        }
                      }, 100);
                    }
                  }}
                  className="w-full bg-white hover:bg-[#F2F0E8] text-[#171914] border border-[#1A1A1A]/15 font-semibold text-xs h-7.5 rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <span>{sugg.actionLabel}</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* 2. STICKY TOP ACTION BAR                                             */}
      {/* ==================================================================== */}
      <div className="bg-white py-3 px-4 sm:px-5 border border-[#1A1A1A]/15 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isDirty ? (
            <Badge className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-medium gap-1.5 py-0.5 px-2.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved Changes
            </Badge>
          ) : (
            <Badge className="bg-[#F2F0E8] text-[#171914] border border-[#1A1A1A]/15 text-xs font-medium gap-1.5 py-0.5 px-2.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B9E32]" />
              All Changes Saved
            </Badge>
          )}

          {saveSuccess && (
            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 animate-in fade-in">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-700" />
              Saved to database!
            </span>
          )}

          {saveError && (
            <span className="text-xs text-rose-700 font-medium flex items-center gap-1.5 animate-in fade-in">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 text-rose-600" />
              {saveError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Link
            href="/dashboard/resume"
            className="text-xs font-semibold text-[#1B2710] bg-[#DDF19B] hover:bg-[#CFEA78] border border-[#9FB944] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-[#7B9E32]" />
            Upload Resume to Auto-Fill
          </Link>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#172013] hover:bg-[#26321E] text-white font-semibold gap-1.5 px-4 text-xs h-8.5 rounded-md disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} className="size-3.5" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MODERN TAB NAVIGATION                                             */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="bg-white border border-[#1A1A1A]/15 rounded-lg p-1.5 flex flex-wrap items-center gap-1">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#172013] text-white"
                    : "bg-transparent text-[#5A5D55] hover:text-[#171914] hover:bg-[#F2F0E8]"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} className={`size-3.5 shrink-0 ${isActive ? "text-white" : "text-[#687064]"}`} />
                <span>{tab.label}</span>

                {typeof tab.count === "number" && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#F7F6F0] text-[#687064]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}

                {tab.isDone && typeof tab.count !== "number" && (
                  <span className={`text-[10px] font-bold ${isActive ? "text-[#DDF19B]" : "text-[#7B9E32]"}`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Save Error Banner */}
        {saveError && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
              <span>{saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. ACTIVE TAB CONTENT PANELS                                         */}
        {/* ==================================================================== */}

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === "personal" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={UserIcon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Candidate contact info, headline, and public profile links.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border border-[#1A1A1A]/15 bg-[#F7F6F0] text-[#687064] text-[10px] font-semibold rounded-md">
                    Editable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Full Name *</label>
                  <Input
                    id="input-full_name"
                    value={profile.full_name || ""}
                    onChange={(e) => updatePersonalInfo("full_name", e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className={`h-9 text-xs sm:text-sm bg-[#F7F6F0] text-[#171914] placeholder:text-[#687064] rounded-md transition-colors focus:bg-white ${
                      validationErrors.full_name
                        ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                        : "border border-[#1A1A1A]/15"
                    }`}
                  />
                  {validationErrors.full_name && (
                    <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                      {validationErrors.full_name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Professional Headline</label>
                  <Input
                    value={profile.headline || ""}
                    onChange={(e) => updatePersonalInfo("headline", e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Email Address *</label>
                  <Input
                    id="input-email"
                    type="email"
                    value={profile.email || ""}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                    placeholder="jane@example.com"
                    className={`h-9 text-xs sm:text-sm bg-[#F7F6F0] text-[#171914] placeholder:text-[#687064] rounded-md transition-colors focus:bg-white ${
                      validationErrors.email
                        ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                        : "border border-[#1A1A1A]/15"
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Phone Number</label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Location / City & Country</label>
                  <Input
                    value={profile.location || ""}
                    onChange={(e) => updatePersonalInfo("location", e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">LinkedIn Profile URL</label>
                  <Input
                    value={profile.linkedin_url || ""}
                    onChange={(e) => updatePersonalInfo("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">GitHub Profile URL</label>
                  <Input
                    value={profile.github_url || ""}
                    onChange={(e) => updatePersonalInfo("github_url", e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#171914]">Portfolio / Personal Website</label>
                  <Input
                    value={profile.portfolio_url || ""}
                    onChange={(e) => updatePersonalInfo("portfolio_url", e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="h-9 text-xs sm:text-sm bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PROFESSIONAL SUMMARY */}
        {activeTab === "summary" && (
          <div className="animate-in fade-in duration-200">
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={File02Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Professional Summary
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        An executive career introduction, highlighting your strengths and target roles.
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <Textarea
                  value={profile.summary || ""}
                  onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                  placeholder="e.g. Experienced Software Engineer with 5+ years of expertise in architecting high-scale distributed systems, React, TypeScript, and cloud-native microservices..."
                  className="min-h-[160px] text-xs sm:text-sm leading-relaxed bg-[#F7F6F0] border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] focus:bg-white rounded-md p-3.5"
                />
                <div className="flex items-center justify-between mt-2.5 text-xs text-[#687064]">
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#E9F2D1] text-[#304019]">
                      <HugeiconsIcon icon={Brain02Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Skills & Competencies
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Categorized programming languages, frameworks, cloud tools, and soft skills.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border border-[#1A1A1A]/15 bg-[#F7F6F0] text-[#171914] text-[10px] font-semibold rounded-md">
                    {(profile.categorized_skills || []).length} skills
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Quick Add Skill Form */}
                <div className="p-3.5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    placeholder="Add skill (e.g. TypeScript, React, Docker)"
                    className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                  />

                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    className="h-9 px-3 rounded-md border border-[#1A1A1A]/15 bg-white text-xs font-semibold text-[#171914] outline-none"
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
                    className="h-9 px-3 rounded-md border border-[#1A1A1A]/15 bg-white text-xs font-semibold text-[#171914] outline-none"
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
                    className="bg-[#172013] hover:bg-[#26321E] text-white h-9 px-4 shrink-0 font-semibold gap-1 rounded-md text-xs cursor-pointer"
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
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#687064]">
                          {cat}
                        </span>
                        <span className="text-[10px] text-[#687064]">
                          {skillsInCat.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skillsInCat.map((skill) => (
                          <span
                            key={skill.name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F6F0] border border-[#1A1A1A]/15 text-xs font-medium text-[#171914] hover:border-[#1A1A1A]/35 transition-colors"
                          >
                            <span>{skill.name}</span>
                            {skill.level && (
                              <span className="text-[9px] text-[#1B2710] font-semibold bg-[#DDF19B] border border-[#9FB944] px-1.5 py-0.2 rounded">
                                {skill.level}
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveSkill(skill.name)}
                              className="text-[#687064] hover:text-rose-600 ml-0.5 p-0.5 rounded cursor-pointer"
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
                  <div className="text-center py-8 text-[#687064] text-xs">
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Work Experience
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Previous and current roles, companies, employment dates, and key accomplishments.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddExperience}
                    className="bg-[#172013] hover:bg-[#26321E] text-white gap-1.5 h-8 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {addAlertMessage && addAlertMessage.section === "experience" && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
                      <span>{addAlertMessage.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddAlertMessage(null)}
                      className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {(profile.work_experiences || []).length === 0 ? (
                  <div className="text-center py-8 text-[#687064] text-xs">
                    No work experiences added yet. Click "Add Experience" or upload your resume.
                  </div>
                ) : (
                  (profile.work_experiences || []).map((exp, expIdx) => (
                    <div
                      key={exp.id || expIdx}
                      id={`exp-card-${expIdx}`}
                      className="p-4 sm:p-5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 space-y-3.5 relative"
                    >
                      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                        <span className="text-xs font-semibold text-[#687064] uppercase tracking-wide">
                          Experience #{expIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(expIdx)}
                          className="text-[#687064] hover:text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs rounded-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Company Name *</label>
                          <Input
                            id={`exp-company-${expIdx}`}
                            value={exp.company_name}
                            onChange={(e) => updateExperience(expIdx, "company_name", e.target.value)}
                            placeholder="e.g. Google, Meta, Stripe"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`exp_${expIdx}_company_name`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`exp_${expIdx}_company_name`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`exp_${expIdx}_company_name`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Job Title / Position *</label>
                          <Input
                            id={`exp-position-${expIdx}`}
                            value={exp.position}
                            onChange={(e) => updateExperience(expIdx, "position", e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`exp_${expIdx}_position`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`exp_${expIdx}_position`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`exp_${expIdx}_position`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Employment Type</label>
                          <Input
                            value={exp.employment_type || ""}
                            onChange={(e) => updateExperience(expIdx, "employment_type", e.target.value)}
                            placeholder="Full-time, Part-time, Contract, Internship"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Location</label>
                          <Input
                            value={exp.location || ""}
                            onChange={(e) => updateExperience(expIdx, "location", e.target.value)}
                            placeholder="New York, NY or Remote"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Start Date</label>
                          <ProfileDatePicker
                            value={exp.start_date}
                            onChange={(val) => updateExperience(expIdx, "start_date", val)}
                            placeholder="Select start date"
                            id={`exp-start-date-${expIdx}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#171914]">End Date</label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-[#171914] font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!exp.is_current}
                                onChange={(e) => {
                                  const isCurrent = e.target.checked;
                                  updateExperience(expIdx, "is_current", isCurrent);
                                  if (isCurrent) {
                                    updateExperience(expIdx, "end_date", "Present");
                                  } else if (exp.end_date === "Present") {
                                    updateExperience(expIdx, "end_date", "");
                                  }
                                }}
                                className="rounded border border-[#1A1A1A]/20 bg-white text-[#172013] focus:ring-[#172013]"
                              />
                              Currently Working Here
                            </label>
                          </div>
                          <ProfileDatePicker
                            value={exp.end_date}
                            onChange={(val) => updateExperience(expIdx, "end_date", val)}
                            disabled={!!exp.is_current}
                            disabledText="Present"
                            placeholder="Select end date"
                            id={`exp-end-date-${expIdx}`}
                          />
                        </div>
                      </div>

                      {/* Overview */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#171914]">Overview / Responsibilities</label>
                        <Textarea
                          value={exp.description || ""}
                          onChange={(e) => updateExperience(expIdx, "description", e.target.value)}
                          placeholder="Brief summary of the role, team, and scope..."
                          className="min-h-[70px] text-xs bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                        />
                      </div>

                      {/* Bullet points / Highlights */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#171914]">Key Achievements & Bullet Points</label>
                        <div className="space-y-1.5">
                          {(exp.highlights || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <span className="text-[#171914] mt-1 font-bold">•</span>
                              <Input
                                value={bullet}
                                onChange={(e) => {
                                  const newHighlights = [...(exp.highlights || [])];
                                  newHighlights[bIdx] = e.target.value;
                                  updateExperience(expIdx, "highlights", newHighlights);
                                }}
                                className="h-8 text-xs bg-white border border-[#1A1A1A]/15 text-[#171914] flex-1 rounded-md"
                              />
                              <button
                                onClick={() => removeExperienceHighlight(expIdx, bIdx)}
                                className="text-[#687064] hover:text-rose-600 p-1 text-xs cursor-pointer"
                                title="Remove bullet point"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add bullet input */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <Input
                            id={`add-bullet-${expIdx}`}
                            placeholder="Add achievement bullet point (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addExperienceHighlight(expIdx, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                            className="h-8 text-xs bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] flex-1 rounded-md"
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
                            className="h-8 text-xs px-3 border border-[#1A1A1A]/20 bg-white text-[#171914] hover:bg-[#F2F0E8] rounded-md cursor-pointer font-semibold"
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={Mortarboard02Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Education
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Universities, degrees, fields of study, graduation dates, and academic honors.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddEducation}
                    className="bg-[#172013] hover:bg-[#26321E] text-white gap-1.5 h-8 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Education
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {addAlertMessage && addAlertMessage.section === "education" && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
                      <span>{addAlertMessage.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddAlertMessage(null)}
                      className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {(profile.educations || []).length === 0 ? (
                  <div className="text-center py-8 text-[#687064] text-xs">
                    No education history added yet. Click "Add Education" or upload your resume.
                  </div>
                ) : (
                  (profile.educations || []).map((edu, eduIdx) => (
                    <div
                      key={edu.id || eduIdx}
                      id={`edu-card-${eduIdx}`}
                      className="p-4 sm:p-5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                        <span className="text-xs font-semibold text-[#687064] uppercase tracking-wide">
                          Education #{eduIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(eduIdx)}
                          className="text-[#687064] hover:text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs rounded-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Institution / University *</label>
                          <Input
                            id={`edu-institution-${eduIdx}`}
                            value={edu.institution}
                            onChange={(e) => updateEducation(eduIdx, "institution", e.target.value)}
                            placeholder="e.g. Stanford University"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`edu_${eduIdx}_institution`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`edu_${eduIdx}_institution`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`edu_${eduIdx}_institution`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Degree *</label>
                          <Input
                            id={`edu-degree-${eduIdx}`}
                            value={edu.degree}
                            onChange={(e) => updateEducation(eduIdx, "degree", e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`edu_${eduIdx}_degree`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`edu_${eduIdx}_degree`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`edu_${eduIdx}_degree`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Field of Study</label>
                          <Input
                            value={edu.field_of_study || ""}
                            onChange={(e) => updateEducation(eduIdx, "field_of_study", e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Grade / GPA</label>
                          <Input
                            value={edu.grade || ""}
                            onChange={(e) => updateEducation(eduIdx, "grade", e.target.value)}
                            placeholder="e.g. 3.9 / 4.0 or First Class"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Start Date</label>
                          <ProfileDatePicker
                            value={edu.start_date}
                            onChange={(val) => updateEducation(eduIdx, "start_date", val)}
                            placeholder="Select start date"
                            id={`edu-start-date-${eduIdx}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Graduation / End Date</label>
                          <ProfileDatePicker
                            value={edu.end_date}
                            onChange={(val) => updateEducation(eduIdx, "end_date", val)}
                            placeholder="Select graduation date"
                            id={`edu-end-date-${eduIdx}`}
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={Folder02Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Projects & Portfolio
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Key software projects, open-source work, and deployed applications.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddProject}
                    className="bg-[#172013] hover:bg-[#26321E] text-white gap-1.5 h-8 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {addAlertMessage && addAlertMessage.section === "projects" && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
                      <span>{addAlertMessage.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddAlertMessage(null)}
                      className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {(profile.projects || []).length === 0 ? (
                  <div className="text-center py-8 text-[#687064] text-xs">
                    No projects added yet. Click "Add Project" or upload your resume.
                  </div>
                ) : (
                  (profile.projects || []).map((proj, projIdx) => (
                    <div
                      key={proj.id || projIdx}
                      id={`proj-card-${projIdx}`}
                      className="p-4 sm:p-5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                        <span className="text-xs font-semibold text-[#687064] uppercase tracking-wide">
                          Project #{projIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(projIdx)}
                          className="text-[#687064] hover:text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs rounded-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Project Name *</label>
                          <Input
                            id={`proj-title-${projIdx}`}
                            value={proj.title}
                            onChange={(e) => updateProject(projIdx, "title", e.target.value)}
                            placeholder="e.g. AI Workflow Automation"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`proj_${projIdx}_title`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`proj_${projIdx}_title`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`proj_${projIdx}_title`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Technologies (comma-separated)</label>
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
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">GitHub Link</label>
                          <Input
                            value={proj.github_url || ""}
                            onChange={(e) => updateProject(projIdx, "github_url", e.target.value)}
                            placeholder="https://github.com/username/project"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Live Demo / Deployment URL</label>
                          <Input
                            value={proj.live_url || ""}
                            onChange={(e) => updateProject(projIdx, "live_url", e.target.value)}
                            placeholder="https://project.vercel.app"
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#171914]">Description & Key Features</label>
                        <Textarea
                          value={proj.description || ""}
                          onChange={(e) => updateProject(projIdx, "description", e.target.value)}
                          placeholder="Describe what you built, architecture decisions, and metrics achieved..."
                          className="min-h-[70px] text-xs bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={Award01Icon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Certifications & Licenses
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Official certifications, course completions, and verified credentials.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddCertification}
                    className="bg-[#172013] hover:bg-[#26321E] text-white gap-1.5 h-8 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Certification
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {addAlertMessage && addAlertMessage.section === "certifications" && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
                      <span>{addAlertMessage.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddAlertMessage(null)}
                      className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {(profile.certifications || []).length === 0 ? (
                  <div className="text-center py-8 text-[#687064] text-xs">
                    No certifications added yet. Click "Add Certification" or upload your resume.
                  </div>
                ) : (
                  (profile.certifications || []).map((cert, certIdx) => (
                    <div
                      key={cert.id || certIdx}
                      id={`cert-card-${certIdx}`}
                      className="p-4 sm:p-5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                        <span className="text-xs font-semibold text-[#687064] uppercase tracking-wide">
                          Certification #{certIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(certIdx)}
                          className="text-[#687064] hover:text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs rounded-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Certification Name *</label>
                          <Input
                            id={`cert-name-${certIdx}`}
                            value={cert.name}
                            onChange={(e) => updateCertification(certIdx, "name", e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`cert_${certIdx}_name`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`cert_${certIdx}_name`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`cert_${certIdx}_name`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Issuing Organization *</label>
                          <Input
                            id={`cert-issuer-${certIdx}`}
                            value={cert.issuing_organization}
                            onChange={(e) => updateCertification(certIdx, "issuing_organization", e.target.value)}
                            placeholder="e.g. Amazon Web Services, Google"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`cert_${certIdx}_issuing_organization`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`cert_${certIdx}_issuing_organization`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`cert_${certIdx}_issuing_organization`]}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Issue Date</label>
                          <ProfileDatePicker
                            value={cert.issue_date}
                            onChange={(val) => updateCertification(certIdx, "issue_date", val)}
                            placeholder="Select issue date"
                            id={`cert-issue-date-${certIdx}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Expiration Date (Optional)</label>
                          <ProfileDatePicker
                            value={cert.expiration_date}
                            onChange={(val) => updateCertification(certIdx, "expiration_date", val)}
                            placeholder="Select expiration date"
                            id={`cert-exp-date-${certIdx}`}
                          />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-semibold text-[#171914]">Credential URL</label>
                          <Input
                            value={cert.credential_url || ""}
                            onChange={(e) => updateCertification(certIdx, "credential_url", e.target.value)}
                            placeholder="https://www.credly.com/badges/..."
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
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
            <Card className="bg-white border border-[#1A1A1A]/15 rounded-lg">
              <CardHeader className="pb-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#F2F0E8] text-[#171914]">
                      <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#171914]">
                        Additional Information
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5A5D55]">
                        Awards, publications, spoken languages, volunteer experience, and professional honors.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddAdditionalInfo}
                    className="bg-[#172013] hover:bg-[#26321E] text-white gap-1.5 h-8 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {addAlertMessage && addAlertMessage.section === "additional" && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-rose-600" />
                      <span>{addAlertMessage.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddAlertMessage(null)}
                      className="text-xs font-semibold underline hover:no-underline text-rose-800 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {(profile.additional_info || []).length === 0 ? (
                  <div className="text-center py-8 text-[#687064] text-xs">
                    No additional entries added yet. Click "Add Item" or upload your resume.
                  </div>
                ) : (
                  (profile.additional_info || []).map((item, itemIdx) => (
                    <div
                      key={item.id || itemIdx}
                      id={`addit-card-${itemIdx}`}
                      className="p-4 sm:p-5 rounded-lg bg-[#F7F6F0] border border-[#1A1A1A]/10 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5">
                        <span className="text-xs font-semibold text-[#687064] uppercase tracking-wide">
                          Entry #{itemIdx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalInfo(itemIdx)}
                          className="text-[#687064] hover:text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs rounded-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => updateAdditionalInfo(itemIdx, "category", e.target.value)}
                            className="w-full h-9 px-2.5 rounded-md border border-[#1A1A1A]/15 bg-white text-xs font-semibold text-[#171914] outline-none"
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
                          <label className="text-xs font-semibold text-[#171914]">Title / Details *</label>
                          <Input
                            id={`addit-title-${itemIdx}`}
                            value={item.title}
                            onChange={(e) => updateAdditionalInfo(itemIdx, "title", e.target.value)}
                            placeholder="e.g. 1st Place National Hackathon, English (Fluent)"
                            className={`h-9 text-xs sm:text-sm bg-white text-[#171914] placeholder:text-[#687064] rounded-md transition-colors ${
                              validationErrors[`addit_${itemIdx}_title`]
                                ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/40"
                                : "border border-[#1A1A1A]/15"
                            }`}
                          />
                          {validationErrors[`addit_${itemIdx}_title`] && (
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                              {validationErrors[`addit_${itemIdx}_title`]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Date / Year (Optional)</label>
                          <ProfileDatePicker
                            value={item.date}
                            onChange={(val) => updateAdditionalInfo(itemIdx, "date", val)}
                            placeholder="Select date / year"
                            id={`addit-date-${itemIdx}`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#171914]">Description or Link URL</label>
                          <Input
                            value={item.description || item.url || ""}
                            onChange={(e) => updateAdditionalInfo(itemIdx, "description", e.target.value)}
                            placeholder="Optional link or additional context..."
                            className="h-9 text-xs sm:text-sm bg-white border border-[#1A1A1A]/15 text-[#171914] placeholder:text-[#687064] rounded-md"
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

        {/* ==================================================================== */}
        {/* 5. BOTTOM TAB PAGER / PREV-NEXT CONTROLS                             */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]/10">
          {prevTab ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(prevTab.id)}
              className="gap-2 border border-[#1A1A1A]/20 bg-white text-[#171914] hover:bg-[#F2F0E8] rounded-md text-xs font-semibold h-8.5 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 text-[#687064]" />
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
              className="gap-2 border border-[#1A1A1A]/20 bg-white text-[#171914] hover:bg-[#F2F0E8] rounded-md text-xs font-semibold h-8.5 cursor-pointer"
            >
              <span>Next: {nextTab.label}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#687064]" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
