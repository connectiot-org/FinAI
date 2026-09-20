"use client";

import React from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Image as ImageIcon,
  File,
  X,
  Pin,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { AttachedFile, formatFileSize } from "@/lib/attached-file";

export interface FileAttachmentCardProps {
  file: AttachedFile | { id?: string; name: string; size?: number; type?: string; previewUrl?: string };
  variant?: "card" | "pill";
  onRemove?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  isUploading?: boolean;
  statusText?: string;
  className?: string;
}

interface FileTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  containerClass: string;
  iconClass: string;
  badgeClass: string;
  glowClass: string;
}

export function getFileTypeConfig(filename: string): FileTypeConfig {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  // Spreadsheets (Excel, CSV, TSV) — Emerald Theme
  if (["xlsx", "xls", "csv", "tsv", "ods"].includes(ext)) {
    return {
      icon: FileSpreadsheet,
      badge: ext.toUpperCase(),
      containerClass: "border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-950/60 hover:border-emerald-500/80",
      iconClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      glowClass: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.18)]",
    };
  }

  // PDFs — Rose / Crimson Theme
  if (["pdf"].includes(ext)) {
    return {
      icon: FileText,
      badge: "PDF",
      containerClass: "border-rose-700/60 bg-rose-950/40 hover:bg-rose-950/60 hover:border-rose-500/80",
      iconClass: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
      badgeClass: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
      glowClass: "shadow-[0_0_15px_-3px_rgba(244,63,94,0.18)]",
    };
  }

  // Text & Word Documents — Amber Theme
  if (["doc", "docx", "txt", "rtf", "md", "pages"].includes(ext)) {
    return {
      icon: FileText,
      badge: ext.toUpperCase(),
      containerClass: "border-amber-700/60 bg-amber-950/40 hover:bg-amber-950/60 hover:border-amber-500/80",
      iconClass: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      glowClass: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.18)]",
    };
  }

  // Code & Structured Data — Indigo / Violet Theme
  if (["json", "sql", "ts", "js", "py", "html", "css", "xml", "yml", "yaml", "sh"].includes(ext)) {
    return {
      icon: FileCode,
      badge: ext.toUpperCase(),
      containerClass: "border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-950/60 hover:border-indigo-500/80",
      iconClass: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
      badgeClass: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      glowClass: "shadow-[0_0_15px_-3px_rgba(99,102,241,0.18)]",
    };
  }

  // Images — Sky / Cyan Theme
  if (["png", "jpg", "jpeg", "webp", "svg", "gif", "avif"].includes(ext)) {
    return {
      icon: ImageIcon,
      badge: ext.toUpperCase(),
      containerClass: "border-sky-700/60 bg-sky-950/40 hover:bg-sky-950/60 hover:border-sky-500/80",
      iconClass: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
      badgeClass: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
      glowClass: "shadow-[0_0_15px_-3px_rgba(14,165,233,0.18)]",
    };
  }

  // Default File
  return {
    icon: File,
    badge: ext ? ext.toUpperCase() : "FILE",
    containerClass: "border-stone-700 bg-stone-900/80 hover:bg-stone-900 hover:border-stone-600",
    iconClass: "bg-stone-800 text-stone-300 border border-stone-700",
    badgeClass: "bg-stone-800 text-stone-400 border border-stone-700",
    glowClass: "shadow-sm",
  };
}

export function FileAttachmentCard({
  file,
  variant = "card",
  onRemove,
  onPin,
  isPinned = false,
  isUploading = false,
  statusText = "Uploaded",
  className = "",
}: FileAttachmentCardProps) {
  const config = getFileTypeConfig(file.name);
  const Icon = config.icon;
  const sizeFormatted = file.size ? formatFileSize(file.size) : null;

  // Compact Pill Variant (used in UserMessage bubbles and minimal spaces)
  if (variant === "pill") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[12px] font-medium transition-all shadow-sm ${config.containerClass} ${className}`}
        title={file.name}
      >
        <span className={`grid size-5.5 shrink-0 place-items-center rounded-md ${config.iconClass}`}>
          <Icon className="size-3" />
        </span>
        <span className="max-w-[180px] truncate text-white font-medium">
          {file.name}
        </span>
        <span className={`rounded px-1 py-0.2 text-[9px] font-bold tracking-wider ${config.badgeClass}`}>
          {config.badge}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
        </span>
      </span>
    );
  }

  // Full Claude-style Card Variant
  return (
    <div
      className={`group relative flex items-center gap-2.5 rounded-xl border p-2 text-xs transition-all duration-200 animate-in fade-in zoom-in-95 ${config.containerClass} ${config.glowClass} ${className}`}
    >
      {/* File Icon Box */}
      <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${config.iconClass}`}>
        <Icon className="size-4.5" />
      </div>

      {/* File Details */}
      <div className="flex flex-col min-w-0 pr-1">
        <span
          className="max-w-[180px] sm:max-w-[220px] truncate font-semibold text-white text-[12.5px] leading-tight"
          title={file.name}
        >
          {file.name}
        </span>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
            {config.badge}
          </span>
          {sizeFormatted && (
            <span className="font-mono text-[10.5px] text-stone-400">
              {sizeFormatted}
            </span>
          )}
          <span className="text-stone-600">·</span>
          {isUploading ? (
            <span className="inline-flex items-center gap-1 font-medium text-[10.5px] text-amber-400 animate-pulse">
              <Loader2 className="size-3 animate-spin" />
              <span>Uploading</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-[10.5px] text-emerald-400">
              <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
              <span>{statusText}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ml-auto flex items-center gap-1 pl-1">
        {onPin && (
          <button
            type="button"
            onClick={onPin}
            aria-label={isPinned ? "Unpin file" : "Pin file"}
            title={isPinned ? "Pinned context" : "Pin file across model switches"}
            className={`rounded-full p-1 transition-colors ${
              isPinned
                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
            }`}
          >
            <Pin className="size-3.5" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            title={`Remove ${file.name}`}
            className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-800/80 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
