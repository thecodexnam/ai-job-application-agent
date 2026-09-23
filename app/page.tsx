import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  ZapIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen flex flex-col bg-[#EDEBE0] text-[#0F0F0F] overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 78% 16%, rgba(197,241,53,0.28), transparent 22rem), radial-gradient(circle at 12% 38%, rgba(99,102,241,0.12), transparent 24rem), linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
        backgroundSize: "2.5rem 2.5rem",
      }}
    >
      {/* ── Lavender page border frame ── */}
      <div className="pointer-events-none fixed inset-0 z-50 border-4 border-[#B8AEF5]" />

      {/* ══════════════════════════ NAV ══════════════════════════ */}
      <header className="relative z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b-2 border-[#1A1A1A] bg-[#EDEBE0]/90 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#0F0F0F] text-[#C5F135] border-2 border-[#0F0F0F] transition-transform group-hover:scale-105">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-4.5" />
          </div>
          <span className="text-base font-bold tracking-tight text-[#0F0F0F]" style={{ fontFamily: "'Playfair Display', serif" }}>
            JobBuddy
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#6366F1] text-white px-2 py-0.5 rounded-sm">
            AI
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3A3A3A]">
          <Link href="#features" className="hover:text-[#0F0F0F] transition-colors">Features</Link>
          <Link href="#how" className="hover:text-[#0F0F0F] transition-colors">How it works</Link>
          <Link href="/login" className="hover:text-[#0F0F0F] transition-colors">Sign in</Link>
        </nav>

        {/* CTA */}
        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#C5F135] text-[#0F0F0F] border-2 border-[#0F0F0F] px-4 py-2 text-sm font-bold rounded-md hover:bg-[#B0DC1A] transition-colors shadow-[3px_3px_0px_#0F0F0F]"
          >
            Dashboard
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Link>
        ) : (
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-[#C5F135] text-[#0F0F0F] border-2 border-[#0F0F0F] px-4 py-2 text-sm font-bold rounded-md hover:bg-[#B0DC1A] transition-colors shadow-[3px_3px_0px_#0F0F0F]"
          >
            <span className="hidden sm:inline">Get Started Free</span>
            <span className="sm:hidden">Start free</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Link>
        )}
      </header>

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Social Proof Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-8 sm:pt-10 px-4">
          <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-[2px_2px_0px_#1A1A1A]">
            <span className="text-[#F59E0B]">✦</span>
            <span className="text-[#6366F1] font-bold">Built for the job hunt</span>
          </div>
          <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-[2px_2px_0px_#1A1A1A]">
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-[#6366F1]" />
            <span>Autonomous AI Agent</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] items-center gap-10 lg:gap-16 max-w-6xl mx-auto px-6 sm:px-10 pt-10 sm:pt-14 pb-10">
          <div className="text-center lg:text-left">
          <h1
            className="text-5xl sm:text-7xl lg:text-[5.5rem] font-black leading-[0.98] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-[#6366F1] italic">AI</span> applies
            <br />
            to jobs{" "}
            <span className="relative inline-block">
              <span className="relative z-10">for you</span>
              <span
                className="absolute inset-x-0 bottom-1 h-4 bg-[#C5F135] z-0 -rotate-1"
              />
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#5A5A5A] max-w-xl leading-relaxed font-medium">
            Tailor your resume, craft company-specific cover letters, and track every application — fully automated by your personal AI career agent.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="flex items-center gap-2 bg-[#C5F135] text-[#0F0F0F] border-2 border-[#0F0F0F] px-7 py-3.5 text-sm font-bold rounded-md hover:bg-[#B0DC1A] transition-all shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-0.5 hover:translate-y-0.5"
            >
              <span>{user ? "Open Dashboard" : "Start for Free"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Link>
            <Link
              href="#how"
              className="flex items-center gap-2 bg-transparent text-[#0F0F0F] border-2 border-[#1A1A1A] px-7 py-3.5 text-sm font-semibold rounded-md hover:bg-[#E8E5D4] transition-all"
            >
              See how it works
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            </Link>
          </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-xl">
              <div className="absolute -top-5 -right-2 sm:right-4 z-10 flex items-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-[#C5F135] px-3 py-2 text-xs font-bold shadow-[3px_3px_0px_#1A1A1A] rotate-2">
                <span className="size-2 rounded-full bg-[#0F0F0F] animate-pulse" />
                Agent is working
              </div>
              <div className="relative border-2 border-[#1A1A1A] rounded-2xl overflow-hidden shadow-[8px_8px_0px_#1A1A1A] bg-white">
                <Image
                  src="/hero-illustration.jpg"
                  alt="JobBuddy AI — resumes, briefcases, and spark icons in editorial style"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="absolute -bottom-5 -left-2 sm:left-4 flex items-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-white px-3 py-2 text-xs font-bold shadow-[3px_3px_0px_#1A1A1A] -rotate-2">
                <span className="text-[#6366F1]">94%</span>
                resume match
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 pb-12 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B6B63]">
          <span>Resume tailoring</span>
          <span className="size-1.5 rounded-full bg-[#6366F1]" />
          <span>Smart matching</span>
          <span className="size-1.5 rounded-full bg-[#6366F1]" />
          <span>Application tracking</span>
        </div>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" className="border-t-2 border-[#1A1A1A] mt-10">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="flex items-center gap-3 mb-10">
              <span className="size-2 rounded-full bg-[#C5F135] border border-[#1A1A1A]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A5A]">How it works</span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-black mb-12 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Three steps to your<br />
              <span className="text-[#6366F1] italic">dream job</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  title: "Upload your resume",
                  desc: "Drop your master resume — AI parses your skills, experience, and education automatically.",
                  color: "#C5F135",
                },
                {
                  num: "02",
                  title: "AI matches & tailors",
                  desc: "JobBuddy scores each job against your profile, rewrites your resume, and crafts a cover letter.",
                  color: "#6366F1",
                },
                {
                  num: "03",
                  title: "Track every application",
                  desc: "One pipeline view — wishlist, applied, interviewing, offer. Never lose track of a lead again.",
                  color: "#0F0F0F",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-white border-2 border-[#1A1A1A] rounded-xl p-6 shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <div
                    className="inline-flex items-center justify-center size-10 rounded-lg text-sm font-black border-2 border-[#1A1A1A] mb-4"
                    style={{ backgroundColor: step.color, color: step.color === "#0F0F0F" ? "#C5F135" : "#0F0F0F" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#5A5A5A] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" className="border-t-2 border-[#1A1A1A] bg-[#0F0F0F] text-white">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="flex items-center gap-3 mb-10">
              <span className="size-2 rounded-full bg-[#C5F135]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">Features</span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-black mb-12 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Everything you need to<br />
              <span className="text-[#C5F135] italic">land the role</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: ZapIcon, title: "Instant ATS Scoring", desc: "Match your resume to any job description in seconds with real keyword analysis." },
                { icon: SparklesIcon, title: "AI Cover Letters", desc: "Personalized, company-specific cover letters written in your voice — not generic templates." },
                { icon: CheckmarkCircle01Icon, title: "Application Pipeline", desc: "Kanban-style tracking from wishlist to offer. Know exactly where every application stands." },
                { icon: Briefcase02Icon, title: "Multi-Platform Jobs", desc: "Browse from Greenhouse, Lever, Workable, and Wellfound in one unified feed." },
                { icon: ArrowRight01Icon, title: "Auto Profile Fill", desc: "Upload your resume once — AI extracts skills, work history, and builds your profile." },
                { icon: ZapIcon, title: "Smart Matching", desc: "Ranked job recommendations that improve as the AI learns your preferences." },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="border border-[#3F3F46] rounded-xl p-5 hover:border-[#C5F135] transition-all group"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#C5F135]/10 text-[#C5F135] border border-[#C5F135]/30 mb-3 group-hover:bg-[#C5F135] group-hover:text-[#0F0F0F] transition-all">
                    <HugeiconsIcon icon={feat.icon} className="size-4" />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>{feat.title}</h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CTA BANNER ═══════════ */}
        <section className="border-t-2 border-[#1A1A1A]">
          <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
            <h2
              className="text-3xl sm:text-4xl font-black leading-tight max-w-md"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to let{" "}
              <span className="text-[#6366F1] italic">AI</span>{" "}
              do the heavy lifting?
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="flex items-center gap-2 bg-[#C5F135] text-[#0F0F0F] border-2 border-[#0F0F0F] px-6 py-3 text-sm font-bold rounded-md hover:bg-[#B0DC1A] transition-all shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-0.5 hover:translate-y-0.5"
              >
                {user ? "Go to Dashboard" : "Get Started — It's Free"}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t-2 border-[#1A1A1A] px-6 py-6 flex items-center justify-between text-xs text-[#5A5A5A] font-medium bg-[#EDEBE0]">
        <span>© {new Date().getFullYear()} JobBuddy AI</span>
        <span>Built with Next.js & Supabase</span>
      </footer>
    </div>
  );
}
