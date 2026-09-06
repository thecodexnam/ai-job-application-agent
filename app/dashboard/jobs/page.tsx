import React from "react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { Briefcase02Icon } from "@hugeicons/core-free-icons";

export default function JobsPage() {
  return (
    <PlaceholderPage
      title="Job Search & Opportunities"
      badge="Auto-Match"
      description="Discover high-match job opportunities tailored to your professional skills and career objectives."
      icon={Briefcase02Icon}
      emptyTitle="No jobs saved or matched yet"
      emptyDescription="Upload your resume or set up your job search criteria so the JobBuddy AI agent can start discovering matching roles."
      actionText="Find Matching Jobs"
      features={[
        {
          title: "AI Semantic Matcher",
          desc: "Automatically ranks jobs by matching your resume against requirements.",
        },
        {
          title: "Auto Job Scraping",
          desc: "Connects with top tech platforms and company career boards.",
        },
        {
          title: "1-Click Custom Tailoring",
          desc: "Generates tailored applications for every saved opportunity.",
        },
      ]}
    />
  );
}
