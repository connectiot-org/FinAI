"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  SquarePen,
  Check,
  ClipboardList,
  Copy,
  X,
  Lock,
} from "lucide-react";
import { ModelSelector } from "./model-selector";
import { ModelConfig } from "@/config/models.config";
import { toast } from "sonner";

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

function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
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
  const [shareCopied, setShareCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://finai.ai/agent";
  const shareText = activeThreadTitle
    ? `${activeThreadTitle} — FInAI Workspace\n${currentUrl}`
    : currentUrl;

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setShareCopied(true);
      toast.success("Workspace share link copied to clipboard!");
      setTimeout(() => setShareCopied(false), 2500);
    } else {
      toast.error("Unable to copy automatically. Please copy the link manually.");
    }
  };

  const handleExport = async () => {
    if (onExportWorkspace) {
      onExportWorkspace();
      setExportCopied(true);
      toast.success("Full workspace transcript & financial report copied!");
      setTimeout(() => setExportCopied(false), 2500);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0d0d0d] font-sans text-stone-100">
      {/* Top Header */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[#212121] bg-[#0d0d0d] px-3 sm:px-4 md:px-5 z-20">
        {/* Left Side: Circular Menu & Back Link */}
        <div className="flex items-center gap-2">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              aria-label="Toggle navigation drawer"
              className="grid size-9 place-items-center rounded-full bg-[#212121] text-stone-200 transition-colors hover:bg-[#2f2f2f] hover:text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="9" x2="19" y2="9" />
                <line x1="5" y1="15" x2="19" y2="15" />
              </svg>
            </button>
          )}

          <Link
            href="/"
            aria-label="Return to FInAI Home"
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Answer Mode Toggle (Quick vs Deep Analysis) */}
          <div className="hidden rounded-full border border-stone-800 bg-[#1a1a1a] p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => onChangeAnswerMode("quick")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
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
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
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
              className="grid size-9 place-items-center rounded-full bg-[#212121] text-stone-300 transition-colors hover:bg-[#2f2f2f] hover:text-white cursor-pointer"
            >
              <SquarePen className="size-4" />
            </button>
          )}

          {/* Copy Full Workspace (Chat + Analysis + Report) */}
          {onExportWorkspace && (
            <button
              type="button"
              onClick={handleExport}
              aria-label="Copy Full Workspace (Chat + Analysis + Report)"
              title={exportCopied ? "Copied to Clipboard!" : "Copy Full Workspace (Chat + Analysis + Report)"}
              className={`grid size-9 place-items-center rounded-full transition-all duration-200 cursor-pointer ${
                exportCopied
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-[#212121] text-stone-400 hover:text-white hover:bg-[#2f2f2f]"
              }`}
            >
              {exportCopied ? <Check className="size-4" /> : <ClipboardList className="size-4" />}
            </button>
          )}

          {/* Share Button with Modal */}
          <button
            type="button"
            onClick={handleShareClick}
            aria-label="Share workspace link"
            title="Share workspace link"
            className="grid size-9 place-items-center rounded-full bg-[#212121] text-stone-400 transition-colors hover:bg-[#2f2f2f] hover:text-white cursor-pointer"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </header>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-stone-800 bg-[#161616] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-[15px]">
                <Share2 className="size-4 text-emerald-400" />
                <span>Share Financial Thread</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-2 text-[13px] text-stone-400 leading-relaxed">
              Anyone with this link can view this thread&apos;s analysis, financial tables, and model findings.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-stone-800 bg-[#111111] p-1.5 pl-3">
              <span className="truncate text-[12.5px] font-mono text-stone-300 flex-1">
                {currentUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-emerald-400 transition-colors cursor-pointer shrink-0"
              >
                {shareCopied ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-500">
              <Lock className="size-3 text-stone-400" />
              <span>Financial credentials and underlying secrets remain encrypted on server.</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {sidebar}
        <main className="flex flex-1 flex-col overflow-hidden bg-[#0d0d0d]">{children}</main>
      </div>
    </div>
  );
}
