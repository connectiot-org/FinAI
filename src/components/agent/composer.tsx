"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { ModelConfig } from "@/config/models.config";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  textContent?: string;
}

export interface ComposerProps {
  selectedModel: ModelConfig;
  answerMode: "quick" | "deep";
  onChangeAnswerMode: (mode: "quick" | "deep") => void;
  isStreaming: boolean;
  onSend: (message: string, files?: AttachedFile[]) => void;
  onStop: () => void;
}

export const defaultSuggestions = [
  "Compare Q3 actuals vs. budget and flag unusual opex",
  "Reconcile cash flow statement to the balance sheet",
  "Explain gross margin variance and calculate EBITDA bridge",
  "Draft the revenue section of the board report",
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileChipIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["xlsx", "xls", "csv", "tsv"].includes(ext)) {
    return <FileSpreadsheet className="size-3.5 text-emerald-600" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileText className="size-3.5 text-rose-500" />;
  }
  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
    return <ImageIcon className="size-3.5 text-sky-500" />;
  }
  if (["json", "sql", "ts", "js", "py", "html", "css", "xml", "yml", "yaml"].includes(ext)) {
    return <FileCode className="size-3.5 text-indigo-500" />;
  }
  if (["doc", "docx", "txt", "md"].includes(ext)) {
    return <FileText className="size-3.5 text-amber-600" />;
  }
  return <File className="size-3.5 text-stone-500" />;
}

export function Composer({
  selectedModel,
  answerMode,
  onChangeAnswerMode,
  isStreaming,
  onSend,
  onStop,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    filesArray.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isTextLike =
        ["txt", "csv", "tsv", "json", "md", "sql", "xml", "log", "yml", "yaml", "html", "js", "ts"].includes(ext) ||
        file.type.startsWith("text/");

      if (isTextLike) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              type: file.type || ext,
              textContent: typeof reader.result === "string" ? reader.result : undefined,
            },
          ]);
        };
        reader.readAsText(file);
      } else if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setAttachedFiles((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl,
          },
        ]);
      } else {
        // Binary files: spreadsheets (.xlsx), documents (.pdf, .docx), archives, etc.
        setAttachedFiles((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            type: file.type || ext,
          },
        ]);
      }
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value so re-selecting same file triggers event
      e.target.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const canSubmit = Boolean(value.trim() || attachedFiles.length > 0);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }
    if (!canSubmit) return;

    onSend(value.trim(), attachedFiles);
    setValue("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape" && isStreaming) {
      e.preventDefault();
      onStop();
    }
  };

  return (
    <div className="border-t border-line bg-white/95 p-4 backdrop-blur md:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Top Controls: Answer Mode Toggle */}
        <div className="mb-2 flex items-center justify-between text-[11.5px] text-stone-500">
          <div className="flex items-center gap-1 rounded-full border border-line bg-paper-soft p-0.5">
            <button
              type="button"
              onClick={() => onChangeAnswerMode("quick")}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                answerMode === "quick"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Quick Answer
            </button>
            <button
              type="button"
              onClick={() => onChangeAnswerMode("deep")}
              className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                answerMode === "deep"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Deep Analysis
            </button>
          </div>
          <span className="font-mono text-[10.5px] text-stone-400">
            Enter to send · Shift+Enter newline
          </span>
        </div>

        {/* Input Form with Drag-and-Drop and File Support */}
        <form
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border bg-white p-2 shadow-card transition-all ${
            isDragging
              ? "border-dashed border-moss ring-2 ring-moss/30 bg-moss-soft/20"
              : "border-line focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-moss/20"
          }`}
        >
          {/* Attached Files Preview Shelf */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 border-b border-stone-100 px-1 pb-2">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-2 rounded-xl border border-stone-200 bg-paper-soft/90 px-2.5 py-1.5 text-[12px] shadow-2xs transition-all hover:border-stone-300"
                >
                  {getFileChipIcon(file.name)}
                  <div className="flex flex-col min-w-0">
                    <span className="max-w-[180px] truncate font-medium text-stone-800" title={file.name}>
                      {file.name}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    aria-label={`Remove ${file.name}`}
                    className="ml-1 rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden File Input supporting ANY file */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="composer-file-upload"
          />

          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach any file (Excel, CSV, PDF, images, docs)"
              title="Attach any file (Excel, CSV, PDF, images, docs, etc.)"
              className="mb-0.5 grid size-8.5 shrink-0 place-items-center rounded-xl text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-95"
            >
              <Paperclip className="size-4.5" />
            </button>

            {/* Model Badge */}
            <span className="mb-0.5 grid size-8.5 shrink-0 place-items-center rounded-xl bg-moss-soft font-mono text-[11px] font-bold text-moss-deep">
              {selectedModel.badge.slice(0, 2).toUpperCase()}
            </span>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                attachedFiles.length > 0
                  ? `Add instructions for ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""} or press Enter…`
                  : `Ask a financial question or attach any file with ${selectedModel.displayName}…`
              }
              aria-label="Ask a financial question or attach any file"
              disabled={isStreaming}
              className="min-h-[36px] max-h-[160px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed text-stone-900 outline-none placeholder:text-stone-400"
            />

            {/* Send / Stop Button */}
            <button
              type="submit"
              disabled={!canSubmit && !isStreaming}
              aria-label={isStreaming ? "Stop generating" : "Send message"}
              className={`mb-0.5 grid size-9 shrink-0 place-items-center rounded-xl transition-all ${
                isStreaming
                  ? "bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                  : canSubmit
                  ? "bg-stone-950 text-white hover:bg-moss-deep shadow-xs cursor-pointer"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
            >
              {isStreaming ? (
                <Square className="size-4 fill-white" />
              ) : (
                <ArrowUp className="size-4.5" />
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {defaultSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              className="shrink-0 rounded-full border border-line bg-white px-3.5 py-1 text-[12px] text-stone-600 shadow-xs transition-colors hover:border-stone-400 hover:text-stone-900"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
