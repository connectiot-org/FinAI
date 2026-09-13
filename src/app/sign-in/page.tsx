"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/landing/logo";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/agent";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg("");

    try {
      await new Promise((r) => setTimeout(r, 600));
      router.push(next);
    } catch {
      setErrorMsg("Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-card">
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-moss-soft text-moss-deep">
          <Lock className="size-5" />
        </span>
        <h1 className="mt-4 text-[22px] font-semibold text-stone-950">
          Sign in to Fintra
        </h1>
        <p className="mt-1 text-[13.5px] text-stone-500">
          Financial intelligence workspace for CFOs and controllers
        </p>
      </div>

      {errorMsg && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSignIn} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-[12.5px] font-medium text-stone-700"
          >
            Work Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="controller@company.com"
            required
            className="mt-1.5 w-full rounded-xl border border-line bg-paper-soft/40 px-3.5 py-2.5 text-[13.5px] text-stone-900 outline-none transition-colors focus:border-moss"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[12.5px] font-medium text-stone-700"
            >
              Password
            </label>
            <span className="text-[11.5px] text-stone-400">Default: any for demo</span>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-line bg-paper-soft/40 px-3.5 py-2.5 text-[13.5px] text-stone-900 outline-none transition-colors focus:border-moss"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-950 text-[14px] font-medium text-white transition-colors hover:bg-moss-deep disabled:opacity-50"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Continue to Workspace</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Pilot Entry */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-white px-3 text-[11px] font-mono uppercase tracking-wider text-stone-400">
          or instant pilot access
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setEmail("cfo@northline.example");
          router.push(next);
        }}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-paper-soft/70 text-[13px] font-medium text-stone-700 transition-colors hover:bg-paper-soft hover:text-stone-900"
      >
        <Sparkles className="size-3.5 text-moss" />
        <span>Launch as Enterprise Pilot Demo</span>
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 border-t border-line/60 pt-4 text-[11.5px] text-stone-400">
        <ShieldCheck className="size-4 text-moss" />
        <span>SOC 2 Type II controls & encryption at rest</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-foreground">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-line px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-600 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Website</span>
        </Link>
        <Logo />
        <div className="w-20" />
      </header>

      {/* Main Container with Suspense boundary */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<div className="text-[13px] text-stone-400">Loading sign in...</div>}>
          <SignInContent />
        </Suspense>
      </main>
    </div>
  );
}
