"use client";

import { useEffect, useRef } from "react";
import { Sigma, Sparkles } from "lucide-react";
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
}: ThreadCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamingText]);

  return (
    <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span
              aria-hidden="true"
              className="mb-4 grid size-12 place-items-center rounded-2xl bg-stone-950 text-white shadow-card ring-4 ring-moss/10"
            >
              <Sigma className="size-6" />
            </span>

            <h2 className="text-[21px] font-bold tracking-tight text-stone-950">
              Financial Intelligence Workspace
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-stone-500">
              Ask any question with <span className="font-semibold text-stone-800">{activeModelName}</span>, attach any financial document, or start with a suggested analysis below.
            </p>

            <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 text-left">
              {emptyStatePrompts.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => onSelectPrompt?.(s.prompt)}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-card"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{s.icon}</span>
                      <span className="font-mono text-[10px] text-stone-400">{s.meta}</span>
                    </div>
                    <h3 className="mt-3 text-[13.5px] font-semibold text-stone-900 group-hover:text-moss-deep">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
                      {s.prompt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[11px] font-medium text-moss opacity-0 transition-opacity group-hover:opacity-100">
                    <Sparkles className="size-3" />
                    <span>Run prompt</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) =>
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
