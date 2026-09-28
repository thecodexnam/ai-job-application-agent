"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/google-button";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffSlashIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setSuccessMessage(
          "Account created! Please check your email inbox to confirm your account."
        );
        setIsLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border border-[#1A1A1A]/15 bg-white rounded-lg shadow-sm">
      <CardHeader className="text-center pb-3 pt-6 px-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#687064] mb-1">
          Registration
        </span>
        <CardTitle className="text-xl font-bold tracking-tight text-[#171914]">
          Create Your Account
        </CardTitle>
        <CardDescription className="text-xs text-[#5A5D55] mt-1">
          Supercharge your job search with your AI assistant
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 px-6 sm:px-8">
        {/* Success Notice */}
        {successMessage && (
          <Alert className="border border-[#9FB944] bg-[#F4F9E4] py-2.5 px-3 text-xs text-[#1B2710] rounded-md">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 shrink-0 text-[#7B9E32]" />
            <AlertDescription className="ml-1 font-semibold leading-relaxed">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" className="py-2.5 px-3 text-xs border border-red-200 bg-red-50 text-red-700 rounded-md">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 text-red-600" />
            <AlertDescription className="ml-1 font-semibold leading-relaxed">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Google Sign Up Button */}
        <GoogleButton label="Sign up with Google" next={next} />

        {/* Divider */}
        <div className="relative my-3">
          <Separator className="bg-[#1A1A1A]/15" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#687064]">
            Or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold text-[#171914]">
              Full Name
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#687064]">
                <HugeiconsIcon icon={UserIcon} className="size-3.5" />
              </div>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Johnson"
                className="h-9 pl-9 text-xs rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white text-[#171914] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[#171914]">
              Email Address
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#687064]">
                <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-9 pl-9 text-xs rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white text-[#171914] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#171914]">
              Password <span className="text-[#687064] font-normal text-[11px]">(min. 6 characters)</span>
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#687064]">
                <HugeiconsIcon icon={LockPasswordIcon} className="size-3.5" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-9 pl-9 pr-9 text-xs rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white text-[#171914] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#687064] hover:text-[#171914] transition-colors cursor-pointer"
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                  className="size-3.5"
                />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#171914]">
              Confirm Password
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#687064]">
                <HugeiconsIcon icon={LockPasswordIcon} className="size-3.5" />
              </div>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-9 pl-9 text-xs rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] focus:bg-white text-[#171914] font-medium"
              />
            </div>
          </div>

          <Button
            id="signup-submit-button"
            type="submit"
            disabled={isLoading}
            className="w-full h-9 gap-2 text-xs font-semibold rounded-md bg-[#172013] hover:bg-[#26321E] text-white transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <>
                <span>Create Account</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#DDF19B]" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-[#1A1A1A]/10 py-3.5 text-xs font-medium text-[#5A5D55]">
        Already have an account?{" "}
        <Link
          href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="ml-1 font-bold text-[#171914] hover:underline transition-colors"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full h-96 flex items-center justify-center border border-[#1A1A1A]/15 bg-white rounded-lg shadow-sm">
          <Spinner className="size-6 text-[#171914]" />
        </Card>
      }
    >
      <SignUpFormContent />
    </Suspense>
  );
}
