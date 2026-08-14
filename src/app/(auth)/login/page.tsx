"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldAlert, Eye, EyeOff, ChevronDown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE, DEMO_ROLES } from "@/config/app";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ParticleTextEffect } from "@/components/ParticleTextEffect";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    if (errorParam === "not_onboarded") return "Your email is not registered on this portal. Please contact your administrator to get onboarded.";
    if (errorParam === "auth_failed") return "Authentication failed. Please try again.";
    if (errorParam === "no_user") return "Could not verify your identity. Please try again.";
    return "";
  });

  // Admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const supabase = createClient();

  /** Which role button is mid-sign-in, so only that one shows a spinner. */
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  /**
   * One-click entry for a given role.
   *
   * This portal is the one where roles matter most — hidden rubrics and dean
   * moderation only make sense seen from four sides — so a visitor needs to be
   * able to switch seats without ever being handed a credential to type.
   */
  const handleDemoSignIn = async (roleKey: string) => {
    const role = DEMO_ROLES.find((r) => r.key === roleKey);
    if (!role) return;

    setDemoLoading(roleKey);
    setError("");
    setResetSuccess("");

    const { error } = await supabase.auth.signInWithPassword({
      email: role.email,
      password: role.password,
    });

    if (error) {
      // Never surface the provider's message here: it distinguishes "no such
      // user" from "wrong password", which is free reconnaissance on a login
      // page anyone can reach.
      setError("Could not open the demo account. Please try another role.");
      setDemoLoading(null);
      return;
    }

    router.push("/auth/post-login");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
      // Browser will redirect to Google — no further action needed
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google Sign-In");
      setLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        throw error;
      }

      router.push("/auth/post-login");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
      setAdminLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!adminEmail) {
      setError("Please enter your email address first.");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess("Password reset link sent! Check your email inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08111F] text-white flex flex-col md:flex-row">
      {/* Left side: branding & particles */}
      <div className="relative hidden md:flex w-full md:w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-white/10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,2,2,0.15),transparent_40%),radial-gradient(ellipse_at_top_right,rgba(62,189,250,0.1),transparent_40%)]">
        <div>
          <Image
            src="/institute-logo.svg"
            alt="Northbridge Institute"
            width={128}
            height={128}
            className="rounded-xl shadow-lg"
            unoptimized
          />
          <h1 className="mt-8 text-4xl font-semibold tracking-tight">
            Faculty Performance <br />
            <span className="text-[#F9C205]">Appraisal Portal</span>
          </h1>
          <p className="mt-4 max-w-sm text-white/60">
            A secure, role-based platform for annual self-reviews and internal evaluations.
          </p>
        </div>

        <div className="w-full max-w-md">
          <ParticleTextEffect />
        </div>
      </div>

      {/* Right side: Login */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="absolute inset-0 bg-[#FFFDF7] rounded-l-3xl md:block hidden shadow-[-20px_0_40px_rgba(0,0,0,0.2)] z-0" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto relative z-10"
        >
          <div className="md:hidden mb-8 flex justify-center">
            <Image
              src="/institute-logo.svg"
              alt="Northbridge Institute"
              width={96}
              height={96}
              className="rounded-xl shadow-lg"
              unoptimized
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Welcome to the Portal
            </h2>
            <p className="text-sm text-[#6B7280] mt-2">
              {DEMO_MODE
                ? "Pick a role to look around. Nothing to type, nothing to sign up for."
                : "Sign in with your institutional Google account to access your appraisal forms."}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetSuccess && (
            <Alert className="mb-6 border-green-300 bg-green-50 text-green-800">
              <AlertDescription>{resetSuccess}</AlertDescription>
            </Alert>
          )}

          {/* One button per role. The whole point of this portal is that the same
              cycle looks different from four seats, so a single shared login
              would hide the feature rather than demonstrate it. No credentials
              are published anywhere — the buttons sign in behind the scenes. */}
          {DEMO_MODE && DEMO_ROLES.length > 0 && (
            <div className="mb-8">
              <div className="grid gap-2.5">
                {DEMO_ROLES.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleDemoSignIn(role.key)}
                    disabled={demoLoading !== null}
                    className="group w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-[#3EBDFA] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827]">
                          {role.label}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                          {role.blurb}
                        </p>
                      </div>
                      {demoLoading === role.key ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3EBDFA]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-gray-300 transition-colors group-hover:text-[#3EBDFA]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-[#6B7280]">
                Every record behind these accounts is invented. Edit and delete
                whatever you like — account management is the only thing switched off.
              </p>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400">
                    or sign in normally
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-[#111827] border border-gray-300 shadow-sm font-medium text-base transition-all hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E3120B]" />
                  Redirecting to Google...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  Sign in with Google
                </div>
              )}
            </Button>

            {/* Admin Login Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(!showAdminLogin);
                  setError("");
                  setResetSuccess("");
                }}
                className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#E3120B] transition-colors cursor-pointer"
              >
                <span>Administrator? Click here to login</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showAdminLogin ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Collapsible Admin Login Form */}
            <AnimatePresence>
              {showAdminLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    {/* Admin Login Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-[#FFFDF7] text-[#9CA3AF] font-medium">
                          Admin Login
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleAdminSignIn} className="space-y-4">
                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="admin-email"
                          className="block text-sm font-medium text-[#374151] mb-1.5"
                        >
                          Email
                        </label>
                        <input
                          id="admin-email"
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin@northbridge.demo"
                          required
                          className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E3120B]/30 focus:border-[#E3120B] transition-colors"
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label
                          htmlFor="admin-password"
                          className="block text-sm font-medium text-[#374151] mb-1.5"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="admin-password"
                            type={showPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full h-11 px-3 pr-10 rounded-md border border-gray-300 bg-white text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E3120B]/30 focus:border-[#E3120B] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Admin Login Button */}
                      <Button
                        type="submit"
                        disabled={adminLoading}
                        className="w-full h-11 bg-[#E3120B] hover:bg-[#C7100A] text-white font-medium text-sm transition-all"
                      >
                        {adminLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          "Sign in as Admin"
                        )}
                      </Button>

                      {/* Forgot Password */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={resetLoading}
                          className="text-sm text-[#3EBDFA] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resetLoading ? "Sending reset link..." : "Forgot Password?"}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#FFFDF7] text-[#9CA3AF]">How it works</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[#6B7280]">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E3120B]/10 text-[#E3120B] flex items-center justify-center text-xs font-bold">1</div>
                <p>Your administrator adds your university email to the portal.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E3120B]/10 text-[#E3120B] flex items-center justify-center text-xs font-bold">2</div>
                <p>Click &quot;Sign in with Google&quot; using that same email account.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E3120B]/10 text-[#E3120B] flex items-center justify-center text-xs font-bold">3</div>
                <p>You&apos;re automatically verified and directed to your dashboard.</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Not registered? Contact Program Office support at{" "}
            <a href="mailto:appraisal.support@northbridge.demo" className="text-[#3EBDFA] hover:underline">
              appraisal.support@northbridge.demo
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08111F]" />}>
      <LoginContent />
    </Suspense>
  );
}
