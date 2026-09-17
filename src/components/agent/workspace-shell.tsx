"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Sparkles, FileSpreadsheet, X, SquarePen, Check, ClipboardList } from "lucide-react";
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
  onToggleMobileSidebar?: () => void;
  onNewThread?: () => void;
  /** Pass the active thread title so the share action can include it */
  activeThreadTitle?: string;
  /** Copy / Export entire workspace (Chat + Analysis + Report) */
  onExportWorkspace?: () => void;
}

export function WorkspaceShell({
  activeTabLabel: _activeTabLabel,
  selectedModel,
  onSelectModel,
  answerMode,
  onChangeAnswerMode,
  sidebar,
  children,
  onToggleMobileSidebar,
  onNewThread,
  activeThreadTitle,
  onExportWorkspace,
}: WorkspaceShellProps) {
  const [showToastLeft, setShowToastLeft] = useState(false);
  const [showToastRight, setShowToastRight] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  const handleShare = () => {
    if (typeof window === "undefined") return;
    const shareText = activeThreadTitle
      ? `${activeThreadTitle} — Fintra AI Workspace\n${window.location.href}`
      : window.location.href;
    navigator.clipboard?.writeText(shareText).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleExport = () => {
    if (onExportWorkspace) {
      onExportWorkspace();
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0d0d0d] font-sans text-stone-100">
      {/* Top Header matching ChatGPT */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[#212121] bg-[#0d0d0d] px-3 sm:px-4 md:px-5 z-20">
        {/* Left Side: Circular Menu & Back Link */}
        <div className="flex items-center gap-2">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              aria-label="Toggle navigation drawer"
              className="grid size-9 place-items-center rounded-full bg-[#212121] text-stone-200 transition-colors hover:bg-[#2f2f2f] hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="9" x2="19" y2="9" />
                <line x1="5" y1="15" x2="19" y2="15" />
              </svg>
            </button>
          )}

          <Link
            href="/"
            aria-label="Return to Fintra Home"
            title="Return to Home"
            className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-stone-400 transition-colors hover:bg-[#212121] hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>Website</span>
          </Link>
        </div>

        {/* Center: Agent / Model Selection dropdown */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <ModelSelector selectedModel={selectedModel} onSelectModel={onSelectModel} />
        </div>

        {/* Right Side: New Chat & Tools */}
        <div className="flex items-center gap-2">
          {/* Answer Mode Toggle (Quick vs Deep Analysis) */}
          <div className="hidden rounded-full border border-stone-800 bg-[#1a1a1a] p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => onChangeAnswerMode("quick")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                answerMode === "quick"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Quick
            </button>
            <button
              type="button"
              onClick={() => onChangeAnswerMode("deep")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                answerMode === "deep"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Deep
            </button>
          </div>

          {/* New Chat Button */}
          {onNewThread && (
            <button
              type="button"
              onClick={onNewThread}
              aria-label="Start new chat"
              title="Start new chat"
              className="grid size-9 place-items-center rounded-full bg-[#212121] text-stone-300 transition-colors hover:bg-[#2f2f2f] hover:text-white"
            >
              <SquarePen className="size-4.5" />
            </button>
          )}

          {/* Issue 3 Fix: Copy Full Workspace (Chat + Analysis + Report) */}
          {onExportWorkspace && (
            <button
              type="button"
              onClick={handleExport}
              aria-label="Copy Full Workspace (Chat + Analysis + Report)"
              title={exportCopied ? "Full Workspace Copied to Clipboard!" : "Copy Full Workspace (Chat + Analysis + Report)"}
              className={`relative hidden size-9 place-items-center rounded-full transition-all duration-200 md:grid ${
                exportCopied
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-stone-400 hover:text-white hover:bg-[#212121]"
              }`}
            >
              {exportCopied ? <Check className="size-4" /> : <ClipboardList className="size-4" />}
            </button>
          )}

          {/* Share Button with in-app copy confirmation (no alert/popup) */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share workspace link"
            title={shareCopied ? "Copied!" : "Copy workspace link"}
            className={`relative hidden size-9 place-items-center rounded-full transition-all duration-200 md:grid ${
              shareCopied
                ? "bg-emerald-600/20 text-emerald-400"
                : "text-stone-400 hover:text-white hover:bg-[#212121]"
            }`}
          >
            {shareCopied ? (
              <Check className="size-4" />
            ) : (
              <Share2 className="size-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative flex flex-1 overflow-hidden bg-[#0d0d0d]">
        {/* Floating Notification Toasts */}
        {showToastLeft && (
          <div className="absolute left-6 top-4 z-40 hidden animate-fade-in items-center gap-2.5 rounded-xl border border-stone-800 bg-[#181818]/95 px-3.5 py-2.5 text-[12px] font-medium text-stone-200 shadow-2xl backdrop-blur xl:flex">
            <span className="grid size-6 place-items-center rounded-md bg-amber-950/80 text-amber-300">
              <Sparkles className="size-3.5" />
            </span>
            <span>Rerouted to GPT — credit limit reached on Claude</span>
            <button
              type="button"
              onClick={() => setShowToastLeft(false)}
              className="ml-1 text-stone-400 hover:text-stone-200"
              aria-label="Dismiss toast"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {showToastRight && (
          <div className="absolute right-6 top-4 z-40 hidden animate-fade-in items-center gap-2.5 rounded-xl border border-stone-800 bg-[#181818]/95 px-3.5 py-2.5 text-[12px] font-medium text-stone-200 shadow-2xl backdrop-blur xl:flex">
            <span className="grid size-6 place-items-center rounded-md bg-emerald-950/80 text-emerald-300">
              <FileSpreadsheet className="size-3.5" />
            </span>
            <span>Q3 board pack exported · 12 slides</span>
            <button
              type="button"
              onClick={() => setShowToastRight(false)}
              className="ml-1 text-stone-400 hover:text-stone-200"
              aria-label="Dismiss toast"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Sidebar */}
        {sidebar}

        {/* Main Workspace Surface */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0d0d0d]">
          {children}
        </main>
      </div>
    </div>
  );
}
