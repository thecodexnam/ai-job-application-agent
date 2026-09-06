import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Briefcase02Icon } from "@hugeicons/core-free-icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-transparent blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-blue-600/15 via-indigo-600/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-t from-violet-600/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header / Brand */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
            <div className="flex size-full items-center justify-center rounded-[10px] bg-zinc-950/80 backdrop-blur-sm">
              <HugeiconsIcon icon={Briefcase02Icon} className="size-5 text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
              ApplyAI
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                <HugeiconsIcon icon={SparklesIcon} className="size-2.5 text-indigo-400" />
                Agent
              </span>
            </span>
            <span className="text-xs text-zinc-400">Autonomous Job Applications</span>
          </div>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} ApplyAI. Powered by Supabase & Next.js</p>
      </footer>
    </div>
  );
}
