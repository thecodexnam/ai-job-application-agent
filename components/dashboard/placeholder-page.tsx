"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1A1A1A]/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171914]">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border border-[#9FB944] bg-[#DDF19B] text-[#1B2710] text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-[#1B2710]" />
              {badge}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5D55] max-w-2xl">{description}</p>
        </div>

        {actionText && (
          <Button
            size="sm"
            className="gap-2 text-xs font-semibold cursor-pointer w-fit rounded-md bg-[#172013] hover:bg-[#26321E] text-white transition-all px-3.5 h-9"
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
              className="rounded-lg border border-[#1A1A1A]/15 bg-white transition-all"
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-[#171914] flex items-center gap-2 uppercase tracking-wide">
                  <span className="size-1.5 rounded-full bg-[#172013]" />
                  {feat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-[#5A5D55] leading-relaxed font-sans">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State / Coming Next */}
      <Card className="rounded-lg border border-dashed border-[#1A1A1A]/20 bg-[#F7F6F0]">
        <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#DDF19B] text-[#171914] border border-[#9FB944] mb-3">
            <HugeiconsIcon icon={icon} className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-[#171914]">{emptyTitle}</h3>
          <p className="text-xs text-[#5A5D55] mt-1.5 max-w-md leading-relaxed">
            {emptyDescription}
          </p>
          {actionText && (
            <div className="mt-5">
              <Button
                size="sm"
                className="text-xs font-semibold cursor-pointer gap-2 rounded-md bg-[#172013] hover:bg-[#26321E] text-white h-9 px-4 transition-all"
              >
                <HugeiconsIcon icon={SparklesIcon} className="size-3 text-[#DDF19B]" />
                <span>{actionText}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
