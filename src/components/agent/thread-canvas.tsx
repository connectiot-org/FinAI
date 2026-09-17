"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sigma,
  Sparkles,
  Plus,
  ArrowUp,
  X,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Database,
} from "lucide-react";
import { UserMessageRenderer, AssistantMessageRenderer } from "./message-part-renderers";
import { FinancialTableRow } from "./financial-table";
import { SseStepPayload } from "@/lib/sse-types";
import { AttachedFile, formatFileSize, processFilesAsync } from "@/lib/attached-file";
import { ParsedFinancialDataset } from "@/lib/financial-dataset-engine";

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
  /** Send a message with optional file attachments (hero input supports files) */
  onSendMessage?: (text: string, files?: AttachedFile[]) => void;
  /** Active thread dataset if already uploaded */
  dataset?: ParsedFinancialDataset;
  /** Active thread attached files */
  attachedFiles?: AttachedFile[];
  /** Callback when files are uploaded/attached */
  onAttachFiles?: (files: AttachedFile[]) => void;
  /** Callback to remove a specific file */
  onRemoveFile?: (fileId: string) => void;
  /** Callback to unload dataset */
  onRemoveDataset?: () => void;
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

function getFileChipIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["xlsx", "xls", "csv", "tsv"].includes(ext)) {
    return <FileSpreadsheet className="size-3.5 text-emerald-400" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileText className="size-3.5 text-rose-400" />;
  }
  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
    return <ImageIcon className="size-3.5 text-sky-400" />;
  }
  if (["json", "sql", "ts", "js", "py", "html", "css", "xml", "yml", "yaml"].includes(ext)) {
    return <FileCode className="size-3.5 text-indigo-300" />;
  }
  if (["doc", "docx", "txt", "md"].includes(ext)) {
    return <FileText className="size-3.5 text-amber-300" />;
  }
  return <File className="size-3.5 text-stone-400" />;
}

export function ThreadCanvas({
  messages,
  isStreaming,
  streamingSteps,
  streamingText,
  activeModelName,
  isStopped,
  onSelectPrompt,
  onSendMessage,
  dataset,
  attachedFiles = [],
  onAttachFiles,
  onRemoveFile,
  onRemoveDataset,
}: ThreadCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [heroInput, setHeroInput] = useState("");
  const [heroFiles, setHeroFiles] = useState<AttachedFile[]>([]);
  const [showWhatCanYouDo, setShowWhatCanYouDo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamingText]);

  const handleFilesAdded = async (fileList: FileList | File[]) => {
    const processed = await processFilesAsync(fileList);
    if (processed.length > 0) {
      if (onAttachFiles) {
        onAttachFiles(processed);
      } else {
        setHeroFiles((prev) => [...prev, ...processed]);
      }
    }
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = heroInput.trim();
    const allFiles = [...attachedFiles, ...heroFiles];
    if (!text && allFiles.length === 0) return;
    if (onSendMessage) {
      onSendMessage(text, heroFiles.length > 0 ? heroFiles : undefined);
    } else if (onSelectPrompt && text) {
      onSelectPrompt(text);
    }
    setHeroInput("");
    setHeroFiles([]);
  };

  const allFilesAvailable = [...attachedFiles, ...heroFiles];
  const canSubmit = Boolean(heroInput.trim()) || allFilesAvailable.length > 0;

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-between px-4 py-8 select-none">
        <div className="w-full" />

        {/* Centered Hero: Heading, Dataset Badge / Dropzone, Capsule Input, What Can You Do */}
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-white tracking-tight mb-4 sm:mb-6">
            What finance questions or analysis are you working on?
          </h1>

          {/* Prominent Dataset Badge if attached */}
          {dataset && (
            <div className="mb-4 flex w-full items-center justify-between rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-left text-emerald-200 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-900/60 text-emerald-300">
                  <Database className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">{dataset.filename}</span>
                    <span className="rounded-full bg-emerald-900/80 px-2 py-0.5 font-mono text-[10.5px] text-emerald-300">
                      {dataset.rowCount} rows · {dataset.columns.length} columns
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-emerald-300/80 truncate">
                    Companies: {dataset.companies.join(", ")} · Years: {dataset.yearMin}–{dataset.yearMax}
                  </p>
                </div>
              </div>
              {onRemoveDataset && (
                <button
                  type="button"
                  onClick={onRemoveDataset}
                  aria-label="Remove dataset"
                  title="Remove dataset from thread"
                  className="rounded-full p-1.5 text-emerald-400 hover:bg-emerald-900/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Capsule / Pill Input Bar */}
          <form
            onSubmit={handleHeroSubmit}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                void handleFilesAdded(e.dataTransfer.files);
              }
            }}
            className="group relative flex w-full flex-col rounded-3xl border border-stone-800 bg-[#212121] p-2 shadow-2xl transition-all focus-within:border-stone-700"
          >
            {/* Attached Files Preview Shelf */}
            {heroFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
                {heroFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 rounded-xl border border-stone-700 bg-[#2b2b2b] px-2.5 py-1.5 text-[12px] shadow-sm text-stone-200"
                  >
                    {getFileChipIcon(file.name)}
                    <div className="flex flex-col min-w-0">
                      <span className="max-w-[180px] truncate font-medium text-white" title={file.name}>
                        {file.name}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
                        setHeroFiles((prev) => prev.filter((f) => f.id !== file.id));
                        onRemoveFile?.(file.id);
                      }}
                      aria-label={`Remove ${file.name}`}
                      className="ml-0.5 rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-700 hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              {/* Plus / Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach documents"
                title="Attach documents, spreadsheets, datasets"
                className="grid size-8.5 shrink-0 place-items-center rounded-full text-stone-300 transition-colors hover:bg-[#2f2f2f] hover:text-white active:scale-95"
              >
                <Plus className="size-5" />
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    void handleFilesAdded(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              {/* Input Field */}
              <input
                type="text"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                placeholder={
                  dataset
                    ? `Ask about ${dataset.companies.slice(0, 4).join(", ")} or financial metrics…`
                    : allFilesAvailable.length > 0
                    ? `Add instructions (${allFilesAvailable.length} file${allFilesAvailable.length > 1 ? "s" : ""})…`
                    : "Ask finance questions or analysis…"
                }
                aria-label="Ask finance questions or analysis"
                className="min-w-0 flex-1 bg-transparent text-[15px] sm:text-[16px] text-white outline-none placeholder:text-stone-400"
                autoFocus
              />

              {/* Send / Up-Arrow Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                aria-label="Send prompt"
                className={`grid size-8.5 shrink-0 place-items-center rounded-full transition-all ${
                  canSubmit
                    ? "bg-white text-black hover:opacity-90 shadow-xs cursor-pointer"
                    : "bg-[#383838] text-stone-400 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="size-4.5 stroke-[2.5]" />
              </button>
            </div>
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
