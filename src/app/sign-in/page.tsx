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
  Building,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { Logo } from "@/components/landing/logo";

type AuthMode = "signin" | "signup";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/agent";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password || "fintra-demo-pass",
        name: name.trim() || undefined,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg("Authentication failed. Please check your email or password.");
      } else {
        setSuccessMsg(mode === "signup" ? "Account created! Redirecting to workspace…" : "Authenticated! Loading workspace…");
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 500);
      }
    } catch {
      setErrorMsg("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handlePilotDemo = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await signIn("credentials", {
        email: "cfo@northline.example",
        password: "pilot-demo-password",
        name: "Elena Vance (CFO)",
        redirect: false,
      });

      if (!res?.error) {
        setSuccessMsg("Logging in as Enterprise Pilot CFO…");
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 500);
      } else {
        router.push(next);
      }
    } catch {
      router.push(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-[#161616] p-7 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Header / Brand Icon */}
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shadow-inner">
          <Lock className="size-5" />
        </span>
        <h1 className="mt-4 text-[24px] font-bold tracking-tight text-white">
          {mode === "signin" ? "Sign in to Fintra" : "Create your Fintra Account"}
        </h1>
        <p className="mt-1 text-[13.5px] text-stone-400">
          Professional multi-model AI workspace for finance & FP&A
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#212121] p-1 border border-stone-800">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg("");
          }}
          className={`rounded-lg py-1.5 text-[13px] font-semibold transition-all cursor-pointer ${
            mode === "signin"
              ? "bg-[#2d2d2d] text-white shadow-xs"
              : "text-stone-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMsg("");
          }}
          className={`rounded-lg py-1.5 text-[13px] font-semibold transition-all cursor-pointer ${
            mode === "signup"
              ? "bg-[#2d2d2d] text-white shadow-xs"
              : "text-stone-400 hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-[12.5px] text-rose-300 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-[12.5px] text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3.5">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="name"
              className="block text-[12.5px] font-medium text-stone-300"
            >
              Full Name
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3.5 top-3 size-4 text-stone-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full rounded-xl border border-stone-800 bg-[#212121] py-2.5 pl-10 pr-3.5 text-[13.5px] text-white outline-none placeholder:text-stone-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-[12.5px] font-medium text-stone-300"
          >
            Work Email
          </label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3.5 top-3 size-4 text-stone-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="controller@company.com"
              required
              className="w-full rounded-xl border border-stone-800 bg-[#212121] py-2.5 pl-10 pr-3.5 text-[13.5px] text-white outline-none placeholder:text-stone-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="organization"
              className="block text-[12.5px] font-medium text-stone-300"
            >
              Company / Entity Name (Optional)
            </label>
            <div className="relative mt-1">
              <Building className="pointer-events-none absolute left-3.5 top-3 size-4 text-stone-500" />
              <input
                id="organization"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Northline Capital"
                className="w-full rounded-xl border border-stone-800 bg-[#212121] py-2.5 pl-10 pr-3.5 text-[13.5px] text-white outline-none placeholder:text-stone-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[12.5px] font-medium text-stone-300"
            >
              Password
            </label>
            <span className="text-[11px] text-stone-500">Any password for pilot demo</span>
          </div>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute left-3.5 top-3 size-4 text-stone-500" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-800 bg-[#212121] py-2.5 pl-10 pr-3.5 text-[13.5px] text-white outline-none placeholder:text-stone-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[13.5px] font-semibold text-black transition-all hover:bg-stone-200 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin text-black" />
              <span>Authenticating…</span>
            </div>
          ) : (
            <>
              <span>{mode === "signin" ? "Enter Workspace" : "Complete Registration"}</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-800" />
        </div>
        <span className="relative bg-[#161616] px-3 font-mono text-[10.5px] uppercase tracking-wider text-stone-500">
          or instant sandbox
        </span>
      </div>

      {/* Instant Pilot Demo Button */}
      <button
        type="button"
        onClick={handlePilotDemo}
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-[#212121] text-[13px] font-medium text-stone-200 transition-colors hover:border-emerald-700/60 hover:bg-[#282828] hover:text-white cursor-pointer"
      >
        <Sparkles className="size-3.5 text-emerald-400" />
        <span>Launch as Enterprise Pilot Demo (CFO)</span>
      </button>

      {/* Security Footer */}
      <div className="mt-5 flex items-center justify-center gap-2 border-t border-stone-800/80 pt-4 text-[11.5px] text-stone-500">
        <ShieldCheck className="size-4 text-emerald-400" />
        <span>SOC 2 Type II controls & verified encryption</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-white">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-stone-800 px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Overview</span>
        </Link>
        <Logo />
        <div className="w-24 text-right">
          <Link
            href="/agent"
            className="text-[12px] font-medium text-stone-400 hover:text-emerald-400 transition-colors"
          >
            Workspace Demo →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<div className="text-[13px] text-stone-400">Loading sign in…</div>}>
          <SignInContent />
        </Suspense>
      </main>
    </div>
  );
}
