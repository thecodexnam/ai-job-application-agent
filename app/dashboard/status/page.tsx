import React from "react";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { Task01Icon } from "@hugeicons/core-free-icons";

export default function StatusPage() {
  return (
    <PlaceholderPage
      title="Application Status & Tracker"
      badge="Live Pipeline"
      description="Monitor active applications across every pipeline stage: Wishlist, Applied, Interviewing, and Offers."
      icon={Task01Icon}
      emptyTitle="No applications in pipeline"
      emptyDescription="Track your first job application from the Jobs page or manually enter an active application to begin tracking its timeline."
      actionText="Track New Application"
      features={[
        {
          title: "Kanban & Pipeline View",
          desc: "Visual drag-and-drop board to advance applications through interview stages.",
        },
        {
          title: "Email & Calendar Sync",
          desc: "Automatically sync interview invites and recruiter follow-ups to your calendar.",
        },
        {
          title: "Offer Comparison",
          desc: "Compare base pay, equity, bonuses, and perks side-by-side once offers arrive.",
        },
      ]}
    />
  );
}
