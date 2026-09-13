"use client";

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
}

export function ThreadSidebar({
  activeView,
  onChangeView,
  onNewThread,
  threads = [],
  activeThreadId,
  onSelectThread,
  onDeleteThread,
}: ThreadSidebarProps) {
  const navItems: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "analysis", label: "Analysis", icon: ChartNoAxesCombined },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "runs", label: "History", icon: History },
  ];

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-line bg-paper-soft/60 p-3 sm:w-[240px]">
      {/* Org Switcher */}
      <div className="mb-3 hidden items-center justify-between rounded-xl border border-line bg-white p-2 shadow-xs sm:flex">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-moss text-white">
            <Building className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-stone-900">Acme Corp</p>
            <p className="text-[10px] text-stone-400">Enterprise Pilot</p>
          </div>
        </div>
        <ChevronDown className="size-3.5 text-stone-400" />
      </div>

      {/* New Thread Button */}
      <button
        type="button"
        onClick={onNewThread}
        aria-label="Start new thread"
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 py-2.5 text-[13px] font-semibold text-white shadow-xs transition-all hover:bg-moss-deep active:scale-[0.98]"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">New Thread</span>
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
              onClick={() => onChangeView(item.id, item.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-white font-semibold text-stone-950 shadow-card ring-1 ring-line"
                  : "text-stone-500 hover:bg-white/70 hover:text-stone-900"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Thread History List */}
      {threads.length > 0 && (
        <div className="mt-4 hidden sm:block">
          <div className="flex items-center justify-between px-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
              Recent Threads
            </p>
            <span className="font-mono text-[10px] text-stone-400">
              {threads.length}
            </span>
          </div>

          <div className="mt-1.5 max-h-[260px] space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {threads.map((t) => {
              const isActive = activeThreadId === t.id && activeView === "chat";
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectThread?.(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectThread?.(t.id);
                    }
                  }}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-[12px] transition-all ${
                    isActive
                      ? "bg-white font-semibold text-stone-950 shadow-card ring-1 ring-line"
                      : "text-stone-600 hover:bg-white/70 hover:text-stone-900"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isActive && (
                      <span className="size-1.5 shrink-0 rounded-full bg-moss" />
                    )}
                    <span className="truncate text-left" title={t.title}>
                      {t.title}
                    </span>
                  </div>

                  {onDeleteThread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteThread(t.id);
                      }}
                      title={`Delete "${t.title}"`}
                      aria-label={`Delete "${t.title}"`}
                      className="ml-1 shrink-0 rounded-md p-1 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credits & Security Footer */}
      <div className="mt-auto hidden space-y-3 pt-4 sm:block">
        <div className="rounded-xl border border-line bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="font-mono uppercase tracking-wider">Credits</span>
            <span className="font-mono font-semibold text-stone-900">72%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full w-[72%] rounded-full bg-moss transition-all duration-500" />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-stone-400">
            Smart routing optimizes token spend
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <ShieldCheck className="size-3.5 text-moss" />
          <span>SOC 2-aligned audit trail</span>
        </div>
      </div>
    </aside>
  );
}
