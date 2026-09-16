"use client";

import { useEffect, useRef, useState } from "react";
import { Sigma, Sparkles, Plus, ArrowUp } from "lucide-react";
import { UserMessageRenderer, AssistantMessageRenderer } from "./message-part-renderers";
import { FinancialTableRow } from "./financial-table";
import { SseStepPayload } from "@/lib/sse-types";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: string[];
  tableData?: FinancialTableRow[];
  model?: string;
  steps?: SseStepPayload[];
  evidence?: string[];
  rerouted?: boolean;
}

export interface ThreadCanvasProps {
  messages: MessageItem[];
  isStreaming?: boolean;
  streamingSteps?: SseStepPayload[];
  streamingText?: string;
  activeModelName: string;
  isStopped?: boolean;
  onSelectPrompt?: (prompt: string) => void;
  onSendMessage?: (text: string, files?: string[]) => void;
}

const emptyStatePrompts = [
  {
    title: "Variance & Flux Analysis",
    prompt: "Compare Q3 actuals vs budget and flag opex lines with >10% variance.",
    icon: "📊",
    meta: "Budget variance · GL ties",
  },
  {
    title: "Cloud Infrastructure Audit",
    prompt: "Reconcile cloud infrastructure spend and isolate unbudgeted contractor costs.",
    icon: "⚡",
    meta: "AWS · Datadog · Snowflake",
  },
  {
    title: "13-Week Cash Forecasting",
    prompt: "Model rolling 13-week cash runway assuming 15% revenue growth and working capital flux.",
    icon: "💰",
    meta: "Cash runway · DSO · DPO",
  },
  {
    title: "Board Deck Executive Memo",
    prompt: "Draft the FP&A executive commentary for the upcoming Q3 board meeting pack.",
    icon: "📝",
    meta: "Board ready · Synthesis",
  },
];

export function ThreadCanvas({
  messages,
  isStreaming,
  streamingSteps,
  streamingText,
  activeModelName,
  isStopped,
  onSelectPrompt,
  onSendMessage,
}: ThreadCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [heroInput, setHeroInput] = useState("");
  const [showWhatCanYouDo, setShowWhatCanYouDo] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamingText]);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = heroInput.trim();
    if (!text) return;
    if (onSendMessage) {
      onSendMessage(text);
    } else if (onSelectPrompt) {
      onSelectPrompt(text);
    }
    setHeroInput("");
  };

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-between px-4 py-8 select-none">
        <div className="w-full" />

        {/* Centered Hero: Heading, Capsule Input, What Can You Do */}
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-tight mb-6 sm:mb-8">
            What are you working on?
          </h1>

          {/* Capsule / Pill Input Bar */}
          <form
            onSubmit={handleHeroSubmit}
            className="group relative flex w-full items-center gap-2.5 rounded-full border border-stone-800 bg-[#212121] px-3.5 py-2 sm:py-2.5 shadow-2xl transition-all focus-within:border-stone-700"
          >
            {/* Plus / Attach Button */}
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("composer-file-upload") as HTMLInputElement | null;
                input?.click();
              }}
              aria-label="Attach documents"
              title="Attach documents, spreadsheets, policies"
              className="grid size-8.5 shrink-0 place-items-center rounded-full text-stone-300 transition-colors hover:bg-[#2f2f2f] hover:text-white active:scale-95"
            >
              <Plus className="size-5" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={heroInput}
              onChange={(e) => setHeroInput(e.target.value)}
              placeholder={`Ask ${activeModelName}...`}
              aria-label={`Ask ${activeModelName}`}
              className="min-w-0 flex-1 bg-transparent text-[15px] sm:text-[16px] text-white outline-none placeholder:text-stone-400"
              autoFocus
            />

            {/* Send / Up-Arrow Button */}
            <button
              type="submit"
              disabled={!heroInput.trim()}
              aria-label="Send prompt"
              className={`grid size-8.5 shrink-0 place-items-center rounded-full transition-all ${
                heroInput.trim()
                  ? "bg-white text-black hover:opacity-90 shadow-xs cursor-pointer"
                  : "bg-[#383838] text-stone-400 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="size-4.5 stroke-[2.5]" />
            </button>
          </form>

          {/* "What can you do?" Pill Button */}
          <button
            type="button"
            onClick={() => setShowWhatCanYouDo((v) => !v)}
            className="mt-4.5 inline-flex items-center gap-2 rounded-full border border-stone-800 bg-[#212121] px-4.5 py-2 text-[13px] font-medium text-stone-200 shadow-sm transition-colors hover:bg-[#2a2a2a] hover:text-white active:scale-98"
          >
            What can you do?
          </button>

          {/* Capabilities & Suggested Analysis Prompts */}
          {showWhatCanYouDo && (
            <div className="mt-5 grid w-full grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in zoom-in-95 duration-200 text-left">
              {emptyStatePrompts.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    if (onSendMessage) {
                      onSendMessage(s.prompt);
                    } else if (onSelectPrompt) {
                      onSelectPrompt(s.prompt);
                    }
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-stone-800 bg-[#191919] p-3.5 transition-all hover:bg-[#242424] hover:border-stone-700"
                >
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold text-stone-200 group-hover:text-white truncate">
                      {s.title}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-stone-400 truncate">
                      {s.prompt}
                    </p>
                  </div>
                  <Sparkles className="size-3.5 text-stone-500 group-hover:text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Disclaimer matching ChatGPT */}
        <div className="pb-2 text-center">
          <p className="text-[11.5px] text-stone-500">
            Fintra is AI. By using it, you agree to our{" "}
            <a href="#" className="underline text-stone-400 hover:text-stone-300">Terms</a> &amp;{" "}
            <a href="#" className="underline text-stone-400 hover:text-stone-300">Privacy Policy</a>.{" "}
            Verified calculations &amp; model audit trail included.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessageRenderer key={msg.id} content={msg.content} files={msg.files} />
          ) : (
            <AssistantMessageRenderer
              key={msg.id}
              content={msg.content}
              modelName={msg.model || activeModelName}
              steps={msg.steps}
              tableData={msg.tableData}
              evidence={msg.evidence}
              rerouted={msg.rerouted}
            />
          )
        )}

        {/* Live Streaming Turn */}
        {isStreaming && (
          <AssistantMessageRenderer
            content={streamingText || ""}
            modelName={activeModelName}
            steps={streamingSteps}
            isStreaming={true}
            isStopped={isStopped}
          />
        )}
      </div>
    </div>
  );
}
