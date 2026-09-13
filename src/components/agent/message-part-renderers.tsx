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
          <div className="select-text text-[14.5px] leading-relaxed text-stone-850 selection:bg-moss/20 selection:text-stone-950">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mt-5 mb-2.5 text-[18px] font-bold tracking-tight text-stone-950">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-4 mb-2 text-[16px] font-semibold text-stone-950">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-3.5 mb-1.5 text-[15px] font-semibold text-stone-900">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3.5 last:mb-0 leading-relaxed text-stone-800">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-stone-950">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="my-3 space-y-1.5 pl-5 list-disc text-stone-800 marker:text-stone-400">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3 space-y-1.5 pl-5 list-decimal text-stone-800 marker:font-semibold marker:text-stone-500">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-0.5">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 rounded-r-lg border-l-3 border-moss/60 bg-paper-soft/80 py-2 pl-3.5 italic text-stone-700">
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
                      className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-stone-800 ring-1 ring-stone-200/70"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-line bg-white shadow-xs">
                    <table className="w-full border-collapse text-left text-[12.5px]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="border-b border-line bg-stone-50/90 font-mono text-[10.5px] uppercase tracking-wider text-stone-600">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 font-semibold text-stone-700">
                    {children}
                  </th>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-line/60">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="transition-colors hover:bg-stone-50/50">{children}</tr>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-stone-800">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-moss-deep underline underline-offset-2 transition-colors hover:text-moss"
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-4 border-t border-stone-200" />,
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
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11.5px] text-stone-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-soft px-3 py-1 font-medium text-moss-deep">
            <span className="size-1.5 rounded-full bg-moss" />
            Answered by {modelName}
          </span>

          {rerouted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[10.5px] text-amber-700 ring-1 ring-amber-200">
              <Route className="size-3" /> Auto-Rerouted
            </span>
          )}

          {evidence && evidence.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-stone-600">
              <FileText className="size-3" /> {evidence.length} sources referenced
            </span>
          )}

          {content && <CopyResponseButton text={content} />}

          <button
            type="button"
            onClick={() => alert("Deck export generated for board distribution")}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 transition-colors hover:bg-stone-200"
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
      <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-br-md bg-stone-950 px-5 py-3.5 text-[14px] leading-relaxed text-white shadow-card">
        <p className="whitespace-pre-wrap">{content}</p>
        {files && files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/15 pt-2.5">
            {files.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-white/90 shadow-2xs backdrop-blur-xs ring-1 ring-white/15"
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
