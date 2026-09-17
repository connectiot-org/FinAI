"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  ChartNoAxesCombined,
  FileText,
  LayoutTemplate,
  History,
  Plus,
  Building,
  ChevronDown,
  ShieldCheck,
  Trash2,
  X,
  Pencil,
  Check,
} from "lucide-react";

export type ViewId = "chat" | "analysis" | "reports" | "templates" | "runs";

export interface ThreadItem {
  id: string;
  title: string;
  updatedAt?: string;
}

export interface ThreadSidebarProps {
  activeView: ViewId;
  onChangeView: (view: ViewId, label: string) => void;
  onNewThread: () => void;
  threads?: ThreadItem[];
  activeThreadId?: string;
  onSelectThread?: (id: string) => void;
  onDeleteThread?: (id: string) => void;
  onRenameThread?: (id: string, newTitle: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function ThreadSidebar({
  activeView,
  onChangeView,
  onNewThread,
  threads = [],
  activeThreadId,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  isMobileOpen = false,
  onCloseMobile,
}: ThreadSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleStartRename = (id: string, currentTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault?.();
    const trimmed = editingTitle.trim();
    if (trimmed && onRenameThread) {
      onRenameThread(id, trimmed);
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };
  const navItems: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "analysis", label: "Analysis", icon: ChartNoAxesCombined },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "runs", label: "History", icon: History },
  ];

  const renderSidebarContent = (isMobileDrawer = false) => (
    <>
      {/* Org Switcher / Drawer Header */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-stone-800 bg-[#212121] p-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-lg bg-emerald-700 text-white">
            <Building className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-white">Acme Corp</p>
            <p className="text-[10px] text-stone-400">Enterprise Pilot</p>
          </div>
        </div>
        {isMobileDrawer && onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar drawer"
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className="size-3.5 text-stone-400" />
        )}
      </div>

      {/* New Thread Button */}
      <button
        type="button"
        onClick={() => {
          onNewThread();
          if (isMobileDrawer) onCloseMobile?.();
        }}
        aria-label="Start new thread"
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-[#212121] py-2.5 text-[13px] font-semibold text-white shadow-xs transition-all hover:bg-[#2a2a2a] active:scale-[0.98]"
      >
        <Plus className="size-4" />
        <span>New Thread</span>
      </button>

      {/* Nav Views */}
      <nav className="space-y-1" aria-label="Workspace views">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChangeView(item.id, item.label);
                if (isMobileDrawer) onCloseMobile?.();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-[#282828] font-semibold text-white shadow-sm ring-1 ring-stone-700"
                  : "text-stone-400 hover:bg-[#212121] hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Thread History List */}
      <div className="mt-4 flex flex-1 flex-col min-h-0">
        <div className="flex items-center justify-between px-2">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400">
            Recent Threads
          </p>
          <span suppressHydrationWarning className="font-mono text-[10px] text-stone-500">
            {threads.length}
          </span>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-h-[300px] md:max-h-[260px]">
          {threads.length === 0 ? (
            <p className="px-2 py-3 text-[11.5px] text-stone-500">No active threads</p>
          ) : (
            threads.map((t, idx) => {
              const isActive = activeThreadId === t.id && activeView === "chat";
              return (
                <div
                  key={`${t.id}-${idx}`}
                  onClick={() => {
                    if (editingId !== t.id) {
                      onSelectThread?.(t.id);
                      if (isMobileDrawer) onCloseMobile?.();
                    }
                  }}
                  onDoubleClick={(e) => handleStartRename(t.id, t.title, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (editingId === t.id) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectThread?.(t.id);
                      if (isMobileDrawer) onCloseMobile?.();
                    }
                  }}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-[12px] transition-all ${
                    isActive
                      ? "bg-[#282828] font-semibold text-white shadow-sm ring-1 ring-stone-700"
                      : "text-stone-300 hover:bg-[#212121] hover:text-white"
                  }`}
                >
                  {editingId === t.id ? (
                    <form
                      onSubmit={(e) => handleSaveRename(t.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex w-full items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        autoFocus
                        aria-label="Rename thread title"
                        className="min-w-0 flex-1 rounded bg-[#191919] px-2 py-1 text-[12px] text-white outline-none ring-1 ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(t.id, e)}
                        title="Save title (Enter)"
                        aria-label="Save thread title"
                        className="rounded p-1 text-emerald-400 hover:bg-emerald-950/60 hover:text-emerald-300"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCancelRename(e)}
                        title="Cancel (Esc)"
                        aria-label="Cancel renaming"
                        className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {isActive && (
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                        )}
                        <span className="truncate text-left" title={t.title}>
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 ml-1 shrink-0">
                        {/* Pencil Edit Icon */}
                        {onRenameThread && (
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(t.id, t.title, e)}
                            title={`Rename "${t.title}"`}
                            aria-label={`Rename "${t.title}"`}
                            className="rounded-md p-1 text-stone-500 transition-all hover:bg-stone-700 hover:text-stone-200 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Pencil className="size-3" />
                          </button>
                        )}

                        {onDeleteThread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteThread(t.id);
                            }}
                            title={`Delete "${t.title}"`}
                            aria-label={`Delete "${t.title}"`}
                            className="rounded-md p-1 text-stone-500 transition-all hover:bg-rose-950/80 hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Credits & Security Footer */}
      <div className="mt-auto space-y-3 pt-4">
        <div className="rounded-xl border border-stone-800 bg-[#212121] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="font-mono uppercase tracking-wider">Credits</span>
            <span className="font-mono font-semibold text-white">72%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-800">
            <div className="h-full w-[72%] rounded-full bg-emerald-500 transition-all duration-500" />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-stone-500">
            Smart routing optimizes token spend
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>SOC 2-aligned audit trail</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (md and up) */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[#212121] bg-[#171717] p-3 text-stone-200">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (screens under md) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside className="relative z-10 flex h-full w-[300px] max-w-[85vw] flex-col border-r border-stone-800 bg-[#171717] p-4 shadow-2xl animate-in slide-in-from-left duration-200 text-stone-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
