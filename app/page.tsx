import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  File02Icon,
  UserIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  ArrowDown01Icon,
  SparklesIcon,
  Task01Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div
      className="relative min-h-screen flex flex-col bg-[#f1f0e8] text-[#171914] overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(221,241,155,0.22), transparent 45%), linear-gradient(to right, rgba(26,26,26,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,26,26,0.04) 1px, transparent 1px)`,
        backgroundSize: "2.5rem 2.5rem",
      }}
    >
      {/* ══════════════════════════ NAV ══════════════════════════ */}
      <header className="relative z-10 w-full px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#1A1A1A]/15 bg-[#f1f0e8]/90 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-md bg-[#172013] text-[#DDF19B] border border-[#172013] transition-transform group-hover:scale-105">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[#171914]">
              JobBuddy
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DDF19B] text-[#1B2710] border border-[#9FB944] px-1.5 py-0.2 rounded">
              AI
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#687064]">
          <Link href="#how" className="hover:text-[#171914] transition-colors">
            How it works
          </Link>
          <Link href="#features" className="hover:text-[#171914] transition-colors">
            Features
          </Link>
          <Link href="#faq" className="hover:text-[#171914] transition-colors">
            FAQ
          </Link>
          <Link href="/login" className="hover:text-[#171914] transition-colors">
            Sign In
          </Link>
        </nav>

        {/* CTA */}
        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#172013] text-white hover:bg-[#26321E] px-3.5 h-9 text-xs font-semibold rounded-md transition-all"
          >
            <span>Dashboard</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#DDF19B]" />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-xs font-semibold text-[#171914] hover:bg-[#E7E5DC] px-3 h-9 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-[#172013] text-white hover:bg-[#26321E] px-3.5 h-9 text-xs font-semibold rounded-md transition-all"
            >
              <span>Get Started Free</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#DDF19B]" />
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Social Proof Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-8 sm:pt-10 px-4">
          <div className="flex items-center gap-2 bg-white border border-[#1A1A1A]/15 rounded-full px-3 py-1 text-xs font-semibold text-[#171914] shadow-none">
            <span className="text-[#7B9E32]">✦</span>
            <span className="text-[#171914]">Autonomous Career Agent</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#1A1A1A]/15 rounded-full px-3 py-1 text-xs font-semibold text-[#171914] shadow-none">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5 text-[#7B9E32]" />
            <span>7 Verified Job Sources</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(26rem,1.05fr)] items-center gap-10 lg:gap-14 max-w-6xl mx-auto px-6 sm:px-10 pt-8 sm:pt-12 pb-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#DDF19B] border border-[#9FB944] text-[#1B2710] text-[10px] font-bold uppercase tracking-wider mb-4">
              <HugeiconsIcon icon={SparklesIcon} className="size-3 text-[#1B2710]" />
              AI-Powered Job Workspace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-[#171914]">
              JobBuddy for your next{" "}
              <span className="relative inline-block px-2 py-0.5 rounded-md bg-[#DDF19B] border border-[#9FB944] text-[#1B2710]">
                move
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#5A5D55] max-w-xl leading-relaxed font-normal">
              Discover verified openings across Greenhouse, Lever, Workable, and Remotive. Auto-fill your candidate profile and track every application seamlessly.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start gap-3">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#172013] text-white hover:bg-[#26321E] px-5 h-10 text-xs font-semibold rounded-md transition-all"
              >
                <span>{user ? "Open Dashboard" : "Start for Free"}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#DDF19B]" />
              </Link>
              <Link
                href="#how"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-[#171914] border border-[#1A1A1A]/20 hover:bg-[#F7F6F0] px-5 h-10 text-xs font-semibold rounded-md transition-all"
              >
                <span>See how it works</span>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-[#687064]" />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-xl">
              <div className="relative border border-[#1A1A1A]/15 rounded-lg overflow-hidden bg-white shadow-sm">
                <Image
                  src="/hero-illustration.jpg"
                  alt="JobBuddy AI — autonomous job application workspace in editorial design"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature badges strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 pb-12 text-xs font-semibold uppercase tracking-wider text-[#687064]">
          <span className="flex items-center gap-1.5 text-[#171914]">
            <HugeiconsIcon icon={File02Icon} className="size-3.5 text-[#7B9E32]" />
            Resume Auto-Fill
          </span>
          <span className="size-1 rounded-full bg-[#1A1A1A]/30" />
          <span className="flex items-center gap-1.5 text-[#171914]">
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-[#7B9E32]" />
            Smart Match Ranking
          </span>
          <span className="size-1 rounded-full bg-[#1A1A1A]/30" />
          <span className="flex items-center gap-1.5 text-[#171914]">
            <HugeiconsIcon icon={Task01Icon} className="size-3.5 text-[#7B9E32]" />
            Full Pipeline Tracker
          </span>
        </div>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" className="border-t border-[#1A1A1A]/15 bg-[#F7F6F0]">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#7B9E32]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#687064]">
                Process Workflow
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171914] mb-8">
              Three steps to your next role
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  num: "01",
                  title: "Drop Your Master Resume",
                  desc: "Upload in PDF or DOCX. AI extracts your skills, work experiences, and education, instantly building your Candidate Profile.",
                },
                {
                  num: "02",
                  title: "Discover Verified Matches",
                  desc: "Scan live listings across Greenhouse, Lever, Workable, and Remotive with match scores computed against your background.",
                },
                {
                  num: "03",
                  title: "Track & Move Stages",
                  desc: "Kanban and table pipeline tracking: wishlist, applied, interviewing, and offers. Keep notes and contacts in one place.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-white border border-[#1A1A1A]/15 rounded-lg p-5 space-y-2.5 shadow-none"
                >
                  <div className="inline-flex items-center justify-center size-8 rounded-md text-xs font-bold bg-[#DDF19B] border border-[#9FB944] text-[#1B2710]">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-bold text-[#171914]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#5A5D55] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" className="border-t border-[#1A1A1A]/15 bg-[#172013] text-white">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#DDF19B]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9EB382]">
                Platform Capabilities
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-white">
              Everything you need to land the role
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: File02Icon,
                  title: "Resume Studio",
                  desc: "Store and re-parse master resumes with automated ATS skill parsing and structured profile updates.",
                },
                {
                  icon: UserIcon,
                  title: "Candidate Profile",
                  desc: "Fine-tune skills, work history, projects, and target roles with deterministic completeness metrics.",
                },
                {
                  icon: Task01Icon,
                  title: "Application Pipeline",
                  desc: "Dual Kanban and List view to track applications from wishlist to offer with notes and interview prep.",
                },
                {
                  icon: Briefcase02Icon,
                  title: "Verified ATS Sources",
                  desc: "Browse live listings directly from Greenhouse, Lever, Workable, Wellfound, Indeed, and Remotive.",
                },
                {
                  icon: SparklesIcon,
                  title: "Match Ranking Engine",
                  desc: "Instantly see match percentage based on required skills vs your candidate profile qualifications.",
                },
                {
                  icon: SecurityCheckIcon,
                  title: "Sequential Automation",
                  desc: "Safe agentic browser session handling with missing-field alerts and manual verification safeguards.",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="border border-white/10 rounded-lg p-4.5 bg-[#20291C] hover:border-[#DDF19B]/40 transition-all group"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-[#DDF19B]/15 text-[#DDF19B] border border-[#DDF19B]/30 mb-2.5">
                    <HugeiconsIcon icon={feat.icon} className="size-4" />
                  </div>
                  <h3 className="text-sm font-bold mb-1 text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#9EB382] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ SECTION ═══════════ */}
        <section id="faq" className="border-t border-[#1A1A1A]/15 bg-[#f1f0e8]">
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#7B9E32]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#687064]">
                FAQ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171914] mb-8">
              Frequently Asked Questions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  q: "How does JobBuddy AI find and verify job openings?",
                  a: "JobBuddy scans public verified job feeds and career portals (Greenhouse, Lever, Workable, Wellfound, Remotive, Arbeitnow) to ensure listings are authentic with direct application links.",
                },
                {
                  q: "How does the Resume Parser work?",
                  a: "When you upload a PDF or DOCX resume, our AI extraction pipeline parses your contact information, skill proficiencies, previous work experiences, education, and projects, automatically syncing them into your Candidate Profile.",
                },
                {
                  q: "Can I manually add jobs I applied to elsewhere?",
                  a: "Yes! The Application Tracker allows you to manually log any job application, set its current stage, add interview notes, and track your progress in both Kanban and Table views.",
                },
                {
                  q: "Is my personal data secure?",
                  a: "Yes. All resumes and profile details are securely stored and encrypted in Supabase with Row Level Security (RLS) ensuring only you can view and access your documents.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#1A1A1A]/15 rounded-lg p-4 space-y-1.5 shadow-none"
                >
                  <h3 className="text-xs font-bold text-[#171914]">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-[#5A5D55] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CTA BANNER ═══════════ */}
        <section className="border-t border-[#1A1A1A]/15 bg-[#DDF19B] border-b border-[#9FB944] text-[#171914]">
          <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-[#171914]">
                Ready to take control of your career?
              </h2>
              <p className="text-xs text-[#1B2710]/80 font-medium mt-1">
                Join ambitious candidates using JobBuddy AI to accelerate their job hunt.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="flex items-center gap-2 bg-[#172013] text-white hover:bg-[#26321E] px-4.5 h-9 text-xs font-semibold rounded-md transition-all shadow-none"
              >
                <span>{user ? "Go to Dashboard" : "Get Started — It's Free"}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#DDF19B]" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#1A1A1A]/15 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#687064] font-medium bg-[#f1f0e8]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171914]">
          <span>© {new Date().getFullYear()} JobBuddy AI</span>
          <span>•</span>
          <span className="text-[#687064]">Autonomous Career Workspace</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-[#687064]">
          <Link href="#how" className="hover:text-[#171914] transition-colors">
            How It Works
          </Link>
          <Link href="#features" className="hover:text-[#171914] transition-colors">
            Features
          </Link>
          <Link href="/login" className="hover:text-[#171914] transition-colors">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
