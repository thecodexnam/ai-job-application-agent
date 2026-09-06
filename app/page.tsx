import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase02Icon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  SecurityCheckIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <HugeiconsIcon icon={Briefcase02Icon} className="size-5" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            ApplyAI
            <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
              <HugeiconsIcon icon={SparklesIcon} className="size-2.5" />
              Agent
            </Badge>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-1.5 font-semibold shadow-sm"
              )}
            >
              <span>Go to Dashboard</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-xs"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "gap-1.5 text-xs font-semibold shadow-sm"
                )}
              >
                <span>Get Started</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <Badge
          variant="outline"
          className="gap-2 border-primary/30 bg-primary/10 text-primary px-4 py-1 text-xs font-medium mb-6 backdrop-blur-md"
        >
          <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
          Autonomous Job Application System
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Supercharge your career with an{" "}
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AI Job Agent
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Tailor your resume, craft company-specific cover letters, and track every application in one intuitive dashboard built with Shadcn UI and Supabase.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href={user ? "/dashboard" : "/signup"}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 px-6 text-sm font-semibold shadow-lg shadow-primary/20 gap-2"
            )}
          >
            <span>{user ? "Open Dashboard" : "Start Applying for Free"}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Link>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 px-6 text-sm"
            )}
          >
            Sign In with Email or Google
          </Link>
        </div>

        {/* Feature Highlights using Shadcn Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <Card className="border-border/70 bg-card/40 backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <HugeiconsIcon icon={ZapIcon} className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Instant AI Tailoring</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Match your experience directly to job descriptions in seconds.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/40 backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Application Pipeline</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Track status from wishlist to interview to final offer.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/40 backdrop-blur-md">
            <CardContent className="p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <HugeiconsIcon icon={SecurityCheckIcon} className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Protected & Private</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Protected by Supabase Auth, Row Level Security, and Next.js Middleware.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} ApplyAI. Built with Shadcn UI, Next.js & Supabase</p>
      </footer>
    </div>
  );
}
