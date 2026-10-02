import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Briefcase02Icon } from "@hugeicons/core-free-icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#f1f0e8] text-[#171914] overflow-hidden">
      {/* Header / Brand */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#1A1A1A]/15 bg-[#f1f0e8]">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-[#172013] text-[#DDF19B] border border-[#172013] transition-transform group-hover:scale-105">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#171914] flex items-center gap-1.5">
              JobBuddy
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#DDF19B] text-[#1B2710] border border-[#9FB944] px-1.5 py-0.2 rounded">
                AI
              </span>
            </span>
            <span className="text-[10px] text-[#687064] font-medium">Job search workspace</span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#687064] font-medium border-t border-[#1A1A1A]/15 bg-[#f1f0e8]">
        <p>© {new Date().getFullYear()} JobBuddy AI</p>
      </footer>
    </div>
  );
}
