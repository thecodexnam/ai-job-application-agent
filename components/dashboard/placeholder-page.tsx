"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  badge: string;
  description: string;
  icon: any;
  emptyTitle: string;
  emptyDescription: string;
  actionText?: string;
  features?: { title: string; desc: string }[];
}

export function PlaceholderPage({
  title,
  badge,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  actionText,
  features,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-purple-500/30 bg-purple-500/15 text-purple-300 text-[11px] font-semibold rounded-full"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
              {badge}
            </Badge>
          </div>
          <p className="text-sm text-[#A1A1AA]">{description}</p>
        </div>

        {actionText && (
          <Button
            size="sm"
            className="gap-1.5 text-xs font-semibold cursor-pointer w-fit rounded-xl bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white shadow-lg shadow-purple-500/25 px-4 py-2"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            {actionText}
          </Button>
        )}
      </div>

      {/* Feature Highlights Grid */}
      {features && features.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feat, idx) => (
            <Card
              key={idx}
              className="rounded-2xl border border-[#27272A] bg-[#18181B] shadow-sm hover:border-purple-500/40 transition-all duration-200"
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-purple-500" />
                  {feat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State / Coming Next */}
      <Card className="rounded-3xl border border-dashed border-[#27272A] bg-[#18181B]/60 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent text-purple-400 border border-purple-500/30 mb-4 shadow-lg shadow-purple-500/15">
            <HugeiconsIcon icon={icon} className="size-8" />
          </div>
          <h3 className="text-base font-semibold text-[#FAFAFA]">{emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 max-w-md">
            {emptyDescription}
          </p>
          {actionText && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer gap-2 rounded-xl border border-[#3F3F46] bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA]"
              >
                <HugeiconsIcon icon={SparklesIcon} className="size-3 text-purple-400" />
                <span>{actionText}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
