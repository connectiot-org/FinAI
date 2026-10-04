"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowLeft,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  TrendingUp,
  Cpu,
} from "lucide-react";
import { Logo } from "@/components/landing/logo";

type AuthMode = "signin" | "signup";

/** Only allow same-origin relative redirect targets. */
function safeNext(raw: string | null): string {
  if (!raw) return "/agent";
  // Must be a relative path (starts with "/") and not a protocol-relative URL.
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) {
    return raw;
  }
  return "/agent";
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validate = (): string | null => {
    if (!email.trim().includes("@")) return "Please enter a valid email address.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (mode === "signup" && !name.trim())
      return "Please enter your full name.";
    return null;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        name: mode === "signup" ? name.trim() : undefined,
        redirect: false,
      });

      if (res?.error) {
        // Real failure — show it. Never fabricate success on auth errors.
        setErrorMsg(
          mode === "signup"
            ? "Could not create the account. If this email is already registered, sign in instead."
            : "Invalid email or password."
        );
      } else {
        setSuccessMsg(
          mode === "signup"
            ? "Account created! Loading workspace…"
            : "Authenticated! Loading workspace…"
        );
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 400);
      }
    } catch {
      setErrorMsg("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await signIn("google", { callbackUrl: next, redirect: false });

      if (res?.error || !res?.ok) {
        // Google OAuth is not configured on this deployment. Fail honestly —
        // do NOT silently sign the user in with a fabricated identity.
        setErrorMsg(
          "Google sign-in is not configured on this deployment. Use email and password instead."
        );
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setErrorMsg("Google sign-in is temporarily unavailable.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-stone-100">
      {/* Left Column: Auth Card */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 lg:w-[52%] xl:w-[48%]">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-stone-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to website
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="mx-auto my-auto w-full max-w-[420px] py-8">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight text-white">
              {mode === "signin" ? "Sign in to FInAI" : "Get started with FInAI"}
            </h1>
            <p className="mt-2 text-[14px] text-stone-400">
              {mode === "signin"
                ? "Enter your credentials to access your financial intelligence workspace."
                : "Create your financial workspace account in less than a minute."}
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-stone-800 bg-[#161616] px-4 text-[13.5px] font-medium text-stone-200 transition-colors hover:border-stone-700 hover:bg-[#1f1f1f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <LoaderCircle className="size-4 animate-spin text-stone-400" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center text-xs">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-stone-800" />
            </div>
            <span className="relative bg-[#0a0a0a] px-3 font-mono uppercase tracking-wider text-stone-500">
              or continue with email
            </span>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-[13px] text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-[13px] text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-[13px] font-medium text-stone-300">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Vance"
                    className="h-11 w-full rounded-xl border border-stone-800 bg-[#141414] pl-10 pr-4 text-[14px] text-white placeholder-stone-600 transition-colors focus:border-emerald-500 focus:bg-[#181818] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-stone-300">
                Work Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-stone-800 bg-[#141414] pl-10 pr-4 text-[14px] text-white placeholder-stone-600 transition-colors focus:border-emerald-500 focus:bg-[#181818] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-stone-300">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() =>
                      setErrorMsg(
                        "Password reset email feature is in private preview."
                      )
                    }
                    className="text-[12px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-stone-800 bg-[#141414] pl-10 pr-10 text-[14px] text-white placeholder-stone-600 transition-colors focus:border-emerald-500 focus:bg-[#181818] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="mt-1.5 text-[11.5px] text-stone-500">
                  Minimum 8 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-[14px] font-semibold text-black transition-all hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 cursor-pointer disabled:opacity-60 shadow-lg shadow-emerald-950/50"
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin text-black" />
              ) : (
                <>
                  <span>
                    {mode === "signin" ? "Sign In to Workspace" : "Create FInAI Account"}
                  </span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Switcher */}
          <div className="mt-6 text-center text-[13px] text-stone-400">
            {mode === "signin" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11.5px] text-stone-500">
          <span>
            Protected by SOC 2-aligned controls &amp; finance-grade isolation.
          </span>
        </div>
      </div>

      {/* Right Column: High-End Visual Editorial Showcase (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-10 xl:p-14 bg-radial from-[#12281e] via-[#0d1612] to-[#080808] border-l border-stone-800/80 relative overflow-hidden">
        {/* Subtle grid and decorative rings */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2f2510_1px,transparent_1px),linear-gradient(to_bottom,#1f2f2510_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Top Feature Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1 text-[12px] font-medium text-emerald-300 backdrop-blur-md">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>FInAI Workspace v2.0 Live</span>
          </div>
          <span className="font-mono text-[11px] text-stone-400">Enterprise AI</span>
        </div>

        {/* Center Showcase Card */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="space-y-3">
            <h2 className="text-[34px] xl:text-[40px] font-bold tracking-tight text-white leading-tight">
              Reach financial goals{" "}
              <span className="text-emerald-400 font-serif-accent font-normal italic">
                faster
              </span>
              .
            </h2>
            <p className="text-[15px] leading-relaxed text-stone-300">
              The simplest way to orchestrate frontier AI models across financial
              data, variance decomposition, board decks, and ledger tie-outs.
            </p>
          </div>

          {/* Interactive Floating Metric Card */}
          <div className="rounded-2xl border border-stone-700/60 bg-[#161f1a]/80 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    Monthly Close Variance
                  </p>
                  <p className="text-[11px] text-stone-400">General Ledger Tie-Outs</p>
                </div>
              </div>
              <span className="rounded-md bg-emerald-950/90 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400 border border-emerald-800/40">
                +24.5% Favorable
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-black/40 p-2.5 border border-stone-800/50">
                <p className="text-[10px] uppercase font-mono text-stone-400">
                  Median Review
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-white">12.4s</p>
              </div>
              <div className="rounded-xl bg-black/40 p-2.5 border border-stone-800/50">
                <p className="text-[10px] uppercase font-mono text-stone-400">
                  Model Failover
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-emerald-400">0.1s</p>
              </div>
              <div className="rounded-xl bg-black/40 p-2.5 border border-stone-800/50">
                <p className="text-[10px] uppercase font-mono text-stone-400">
                  Audit Trace
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-white">100%</p>
              </div>
            </div>

            {/* Model Roster Pills */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800/80 text-[11.5px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="size-3.5 text-emerald-400" />
                <span>Multi-Model Engine</span>
              </span>
              <span className="font-mono text-[11px] text-stone-300">
                Claude · GPT · Gemini · DeepSeek
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Guarantee */}
        <div className="relative z-10 flex items-center gap-3 text-[12.5px] text-stone-400">
          <ShieldCheck className="size-4.5 text-emerald-400 shrink-0" />
          <span>
            Workspace data is never used to train third-party frontier AI models.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#0a0a0a] text-stone-400">
          <LoaderCircle className="size-7 animate-spin text-emerald-400" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
