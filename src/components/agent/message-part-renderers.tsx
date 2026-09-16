"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sigma,
  Paperclip,
  Route,
  FileText,
  Presentation,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { RunSteps } from "./run-steps";
import { FinancialTable, FinancialTableRow } from "./financial-table";
import { SseStepPayload } from "@/lib/sse-types";

export interface AssistantMessageProps {
  content: string;
  modelName: string;
  steps?: SseStepPayload[];
  tableData?: FinancialTableRow[];
  evidence?: string[];
  rerouted?: boolean;
  isStreaming?: boolean;
  isStopped?: boolean;
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-stone-800 bg-stone-950 text-stone-100 shadow-md">
      <div className="flex items-center justify-between border-b border-stone-800/90 bg-stone-900/90 px-4 py-1.5 font-mono text-[11.5px] text-stone-400">
        <span className="font-semibold uppercase tracking-wider">{language || "Code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-stone-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyResponseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 transition-colors hover:bg-stone-200"
      title="Copy response"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-600" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export function AssistantMessageRenderer({
  content,
  modelName,
  steps,
  tableData,
  evidence,
  rerouted,
  isStreaming,
  isStopped,
}: AssistantMessageProps) {
  return (
    <div className="flex w-full items-start gap-3.5">
      <span
        aria-hidden="true"
        className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-stone-950 text-white shadow-xs"
      >
        <Sigma className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-3.5">
        {/* RunSteps */}
        {steps && steps.length > 0 && <RunSteps steps={steps} isStreaming={isStreaming} />}

        {/* Rich ChatGPT-style Markdown Text Content */}
        {content && (
          <div className="select-text text-[14.5px] leading-relaxed text-stone-100 selection:bg-stone-700 selection:text-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mt-5 mb-2.5 text-[19px] font-bold tracking-tight text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-4 mb-2 text-[17px] font-semibold text-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-3.5 mb-1.5 text-[15.5px] font-semibold text-stone-100">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3.5 last:mb-0 leading-relaxed text-stone-200">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="my-3 space-y-1.5 pl-5 list-disc text-stone-200 marker:text-stone-500">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3 space-y-1.5 pl-5 list-decimal text-stone-200 marker:font-semibold marker:text-stone-400">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-0.5">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 rounded-r-lg border-l-3 border-emerald-500 bg-stone-900/80 py-2 pl-3.5 italic text-stone-300">
                    {children}
                  </blockquote>
                ),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isMultiline = String(children).includes("\n") || Boolean(match);
                  if (isMultiline) {
                    return (
                      <CodeBlock
                        language={match ? match[1] : undefined}
                        code={String(children).replace(/\n$/, "")}
                      />
                    );
                  }
                  return (
                    <code
                      className="rounded-md bg-stone-800/80 px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-stone-200 ring-1 ring-stone-700"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto [scrollbar-width:thin] touch-pan-x rounded-xl border border-stone-800 bg-[#171717] shadow-md">
                    <table className="w-full border-collapse text-left text-[12.5px]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="border-b border-stone-800 bg-stone-900/90 font-mono text-[10.5px] uppercase tracking-wider text-stone-400">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3.5 py-2.5 font-semibold text-stone-300">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-stone-800/60">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="transition-colors hover:bg-stone-800/30">{children}</tr>
                ),
                td: ({ children }) => (
                  <td className="px-3.5 py-2.5 text-stone-200">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400 underline underline-offset-2 transition-colors hover:text-emerald-300"
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-4 border-t border-stone-800" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {/* Stopped Badge */}
        {isStopped && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-medium text-amber-800">
            Generation stopped by user
          </div>
        )}

        {/* Financial Table */}
        {tableData && tableData.length > 0 && <FinancialTable rows={tableData} />}

        {/* Evidence & Action Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11.5px] text-stone-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-800/80 px-3 py-1 font-medium text-stone-200 border border-stone-700/60">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Answered by {modelName}
          </span>

          {rerouted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-1 font-mono text-[10.5px] text-amber-300 ring-1 ring-amber-700/40">
              <Route className="size-3" /> Auto-Rerouted
            </span>
          )}

          {evidence && evidence.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-800/60 px-3 py-1 text-stone-300 border border-stone-700/50">
              <FileText className="size-3 text-stone-400" /> {evidence.length} sources referenced
            </span>
          )}

          {content && <CopyResponseButton text={content} />}

          <button
            type="button"
            onClick={() => alert("Deck export generated for board distribution")}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-800/60 px-3 py-1 font-medium text-stone-300 border border-stone-700/50 transition-colors hover:bg-stone-700 hover:text-white"
          >
            <Presentation className="size-3" />
            Turn into deck
          </button>
        </div>
      </div>
    </div>
  );
}

function getFileIcon(filename: string) {
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

export interface UserMessageProps {
  content: string;
  files?: string[];
}

export function UserMessageRenderer({ content, files }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] md:max-w-[75%] rounded-3xl bg-[#212121] border border-stone-800 px-5 py-3 text-[14.5px] leading-relaxed text-white shadow-sm">
        <p className="whitespace-pre-wrap">{content}</p>
        {files && files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-700 pt-2.5">
            {files.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800/80 px-2.5 py-1 text-[11.5px] font-medium text-stone-200 border border-stone-700"
              >
                {getFileIcon(f)}
                <span className="max-w-[200px] truncate" title={f}>
                  {f}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
