"use client";

import { useState } from "react";
import {
  MessageSquare,
  ChartNoAxesCombined,
  FileText,
  LayoutTemplate,
  History,
  Check,
  ChevronDown,
  Lock,
} from "lucide-react";
import {
  ChatView,
  AnalysisView,
  ReportView,
  TemplatesView,
  RunsView,
} from "./mockup-views";
import { Logo } from "./logo";

type ViewId = "chat" | "analysis" | "reports" | "templates" | "runs";

const navItems: {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "analysis", label: "Analysis", icon: ChartNoAxesCombined },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "runs", label: "History", icon: History },
];

const modelOptions = [
  { name: "Auto", desc: "Routes to the best available model" },
  { name: "GPT", desc: "Versatile reasoning & drafting" },
  { name: "Claude", desc: "Long-document review" },
  { name: "Gemini", desc: "Multimodal analysis" },
  { name: "DeepSeek", desc: "Cost-efficient depth" },
];

function ModelSelector({
  active,
  onChange,
}: {
  active: string;
  onChange: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current =
    modelOptions.find((m) => m.name === active) ?? modelOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Model selector, current: ${current.name}`}
        className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[12px] font-medium text-stone-800 transition-colors hover:border-stone-300"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-moss" />
        {current.name}
        <ChevronDown
          className={`size-3 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Choose a model"
          className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-float"
        >
          {modelOptions.map((m) => (
            <li key={m.name}>
              <button
                type="button"
                role="option"
                aria-selected={m.name === active}
                onClick={() => {
                  onChange(m.name);
                  setOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  m.name === active ? "bg-paper-soft" : "hover:bg-paper-soft"
                }`}
              >
                <span>
                  <span className="block text-[12.5px] font-medium text-stone-900">
                    {m.name}
                  </span>
                  <span className="block text-[11px] text-stone-500">{m.desc}</span>
                </span>
                {m.name === active && (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-moss" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductMockup() {
  const [view, setView] = useState<ViewId>("chat");
  const [model, setModel] = useState("Auto");

  const modelLabel =
    model === "Auto" ? "Claude" : model;

  return (
    <div
      role="group"
      aria-label="Interactive preview of the Fintra workspace"
      className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-float"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-paper-soft/80 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-stone-300" />
          <span className="size-2.5 rounded-full bg-stone-300" />
          <span className="size-2.5 rounded-full bg-stone-300" />
        </div>
        <div
          className="mx-auto flex h-6 w-full max-w-[260px] items-center justify-center gap-1.5 rounded-md bg-white font-mono text-[10.5px] text-stone-400 ring-1 ring-line"
          aria-hidden="true"
        >
          <Lock className="size-2.5" />
          app.fintra.ai/workspace
        </div>
        <div className="w-10" aria-hidden="true" />
      </div>

      <div className="flex h-[560px] md:h-[600px]">
        {/* Sidebar */}
        <nav
          aria-label="Workspace demo sections"
          className="hidden w-[200px] shrink-0 flex-col border-r border-line bg-paper-soft/50 p-3 sm:flex"
        >
          <div className="mb-4 flex items-center justify-between px-2 pt-1">
            <Logo mark />
            <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-stone-700 ring-1 ring-line">
              Acme Corp
              <ChevronDown className="size-3 text-stone-400" aria-hidden="true" />
            </span>
          </div>

          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const activeItem = view === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setView(item.id)}
                    aria-current={activeItem ? "page" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      activeItem
                        ? "bg-white font-medium text-stone-950 shadow-card ring-1 ring-line"
                        : "text-stone-500 hover:bg-white/70 hover:text-stone-900"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto space-y-3 px-2">
            <div className="rounded-xl bg-white p-3 ring-1 ring-line">
              <div className="flex items-center justify-between text-[10.5px] text-stone-500">
                <span className="font-mono uppercase tracking-wider">Credits</span>
                <span className="font-mono">68%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full w-[68%] rounded-full bg-moss" />
              </div>
              <p className="mt-2 text-[10px] leading-snug text-stone-400">
                Auto-routing preserves budget across models
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] text-stone-400">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-moss" />
              SOC 2-aligned controls
            </p>
          </div>
        </nav>

        {/* Main panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 md:px-5">
            <div className="flex min-w-0 items-center gap-2">
              {/* Mobile view switcher */}
              <div
                className="flex rounded-lg bg-paper-soft p-0.5 sm:hidden"
                role="tablist"
                aria-label="Workspace demo views"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={view === item.id}
                      aria-label={item.label}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`grid size-7 place-items-center rounded-md transition-colors ${
                        view === item.id
                          ? "bg-white text-stone-950 shadow-card"
                          : "text-stone-400"
                      }`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <p className="truncate font-mono text-[11px] text-stone-400">
                Workspace / {navItems.find((n) => n.id === view)?.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector active={model} onChange={setModel} />
              <button
                type="button"
                className="hidden h-8 items-center rounded-full bg-stone-950 px-3 text-[12px] font-medium text-white transition-colors hover:bg-moss-deep md:flex"
              >
                Share
              </button>
            </div>
          </div>

          {/* Views (desktop tablist mirrors sidebar) */}
          <div
            className="min-h-0 flex-1 bg-paper-soft/40"
            role="tabpanel"
            aria-label={`${navItems.find((n) => n.id === view)?.label} view`}
          >
            {view === "chat" && <ChatView activeModel={modelLabel} />}
            {view === "analysis" && <AnalysisView />}
            {view === "reports" && <ReportView />}
            {view === "templates" && <TemplatesView />}
            {view === "runs" && <RunsView />}
          </div>
        </div>
      </div>
    </div>
  );
}
