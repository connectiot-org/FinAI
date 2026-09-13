"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Share2, Sparkles, FileSpreadsheet, X } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { ModelSelector } from "./model-selector";
import { ModelConfig } from "@/config/models.config";

export interface WorkspaceShellProps {
  activeTabLabel: string;
  selectedModel: ModelConfig;
  onSelectModel: (model: ModelConfig) => void;
  answerMode: "quick" | "deep";
  onChangeAnswerMode: (mode: "quick" | "deep") => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function WorkspaceShell({
  activeTabLabel,
  selectedModel,
  onSelectModel,
  answerMode,
  onChangeAnswerMode,
  sidebar,
  children,
}: WorkspaceShellProps) {
  const [showToastLeft, setShowToastLeft] = useState(true);
  const [showToastRight, setShowToastRight] = useState(true);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-paper font-sans text-foreground">
      {/* Top Banner & Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Return to Fintra Home"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-soft px-2.5 py-1 text-[12px] font-medium text-stone-600 transition-colors hover:bg-white hover:text-stone-900"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to</span> Website
          </Link>
          <div className="h-4 w-px bg-line" />
          <Logo mark={false} />
          <span className="hidden text-[12px] font-mono text-stone-400 md:inline">
            / {activeTabLabel}
          </span>
        </div>

        {/* Center Breadcrumb */}
        <div className="hidden items-center gap-2 rounded-full border border-line bg-paper-soft/70 px-3 py-1 text-[12px] font-mono text-stone-500 lg:flex">
          <Lock className="size-3 text-stone-400" />
          <span>app.fintra.ai/workspace</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          {/* Answer Mode Toggle */}
          <div className="hidden rounded-full border border-line bg-paper-soft p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => onChangeAnswerMode("quick")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                answerMode === "quick"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Quick
            </button>
            <button
              type="button"
              onClick={() => onChangeAnswerMode("deep")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                answerMode === "deep"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Deep Analysis
            </button>
          </div>

          {/* Model Selector */}
          <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />

          {/* Share Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard?.writeText(window.location.href);
                alert("Workspace link copied to clipboard!");
              }
            }}
            className="hidden h-8 items-center gap-1.5 rounded-full bg-stone-950 px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-moss-deep sm:flex"
          >
            <Share2 className="size-3" />
            Share
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Floating Notification Toasts */}
        {showToastLeft && (
          <div className="absolute left-6 top-4 z-40 hidden animate-fade-in items-center gap-2.5 rounded-xl border border-line bg-white/95 px-3.5 py-2.5 text-[12px] font-medium text-stone-800 shadow-float backdrop-blur xl:flex">
            <span className="grid size-6 place-items-center rounded-md bg-amber-50 text-amber-700">
              <Sparkles className="size-3.5" />
            </span>
            <span>Rerouted to GPT — credit limit reached on Claude</span>
            <button
              type="button"
              onClick={() => setShowToastLeft(false)}
              className="ml-1 text-stone-400 hover:text-stone-600"
              aria-label="Dismiss toast"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {showToastRight && (
          <div className="absolute right-6 top-4 z-40 hidden animate-fade-in items-center gap-2.5 rounded-xl border border-line bg-white/95 px-3.5 py-2.5 text-[12px] font-medium text-stone-800 shadow-float backdrop-blur xl:flex">
            <span className="grid size-6 place-items-center rounded-md bg-moss-soft text-moss-deep">
              <FileSpreadsheet className="size-3.5" />
            </span>
            <span>Q3 board pack exported · 12 slides</span>
            <button
              type="button"
              onClick={() => setShowToastRight(false)}
              className="ml-1 text-stone-400 hover:text-stone-600"
              aria-label="Dismiss toast"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Sidebar */}
        {sidebar}

        {/* Main Workspace Surface */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-paper-soft/40">
          {children}
        </main>
      </div>
    </div>
  );
}
