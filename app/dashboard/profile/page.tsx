import React from "react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { UserIcon } from "@hugeicons/core-free-icons";

export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="User Profile & Preferences"
      badge="Career Persona"
      description="Configure your personal information, target roles, salary expectations, and AI application preferences."
      icon={UserIcon}
      emptyTitle="Profile setup pending"
      emptyDescription="Complete your professional profile, links (LinkedIn, GitHub, Portfolio), and desired locations to boost match precision."
      actionText="Edit Profile Info"
      features={[
        {
          title: "Target Roles & Level",
          desc: "Define your preferred job titles, seniorities, and remote/hybrid work setups.",
        },
        {
          title: "Compensation & Location",
          desc: "Specify salary floors, relocation preferences, and visa sponsorship status.",
        },
        {
          title: "AI Voice & Tone",
          desc: "Customize the writing voice used when crafting cover letters and email notes.",
        },
      ]}
    />
  );
}
