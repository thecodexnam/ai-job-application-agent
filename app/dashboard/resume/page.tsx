import React from "react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { File02Icon } from "@hugeicons/core-free-icons";

export default function ResumePage() {
  return (
    <PlaceholderPage
      title="Resume & Studio"
      badge="AI Parser"
      description="Manage your master resumes, extract key technical strengths, and generate job-targeted variations."
      icon={File02Icon}
      emptyTitle="No resumes uploaded yet"
      emptyDescription="Upload your master resume in PDF or DOCX format to allow JobBuddy AI to extract and index your skills, experiences, and achievements."
      actionText="Upload Master Resume"
      features={[
        {
          title: "Intelligent Resume Parsing",
          desc: "Extracts technical skills, certifications, and work chronology automatically.",
        },
        {
          title: "ATS Optimization",
          desc: "Scored and optimized against applicant tracking systems before applying.",
        },
        {
          title: "Dynamic Tailoring",
          desc: "Generate custom tailored PDFs targeted to specific job descriptions in seconds.",
        },
      ]}
    />
  );
}
