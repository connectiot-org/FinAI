"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { modelsConfig, ModelConfig } from "@/config/models.config";

export interface ModelSelectorProps {
  selectedModel: ModelConfig;
  onSelectModel: (model: ModelConfig) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click / Escape (previously the list could only be
  // closed by re-clicking the trigger).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const freeCount = useMemo(() => modelsConfig.filter((m) => m.isFree).length, []);

  const filteredModels = useMemo(() => {
    const rawQ = search.toLowerCase().trim();
    // Normalize typos and common search queries (e.g. "cloude" -> "claude", "chatgpt" -> "gpt")
    const q = rawQ.replace(/cloude/g, "claude").replace(/chat\s*gpt/g, "gpt");

    return modelsConfig.filter((m) => {
      const matchesSearch =
        !rawQ ||
        m.displayName.toLowerCase().includes(rawQ) ||
        m.displayName.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(rawQ) ||
        m.provider.toLowerCase().includes(q) ||
        m.desc.toLowerCase().includes(rawQ) ||
        m.desc.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(rawQ) ||
        m.modelId.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(rawQ)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (rawQ === "free" && m.isFree) ||
        ((rawQ === "popular" || rawQ === "known") && m.isPopular);

      const matchesTier =
        tierFilter === "All"
          ? true
          : tierFilter === "Popular"
          ? Boolean(m.isPopular)
          : tierFilter === "Free"
          ? Boolean(m.isFree)
          : m.tier === tierFilter;

      return matchesSearch && matchesTier;
    });
  }, [search, tierFilter]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[15px] sm:text-[16px] font-semibold text-white transition-colors hover:bg-[#212121]"
      >
        <span className="truncate max-w-[140px] sm:max-w-[220px]">{selectedModel.displayName}</span>
        {selectedModel.isFree && (
          <span className="hidden sm:inline-flex rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            FREE
          </span>
        )}
        <ChevronDown
          className={`size-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-[calc(100vw-24px)] sm:w-[460px] max-w-[460px] rounded-2xl border border-stone-800 bg-[#181818] p-3 shadow-2xl text-stone-200"
        >
          <div className="mb-2.5 flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400">
              Model Catalog ({modelsConfig.length} total · {freeCount} Free)
            </span>
            <span className="rounded-full bg-stone-800 px-2 py-0.5 font-mono text-[9.5px] font-medium text-stone-300">
              OpenRouter Gateway
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, provider, free, or ID..."
              className="w-full rounded-xl border border-stone-700 bg-[#242424] py-1.5 pl-8 pr-3 text-[12px] text-white outline-none placeholder:text-stone-400 focus:border-stone-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Tier Filter Tabs */}
          <div className="mb-2.5 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {["All", "Popular", "Free", "Reasoning", "Balanced", "Fast", "Finance Specialist", "Open"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`shrink-0 rounded-lg px-2 py-1 text-[10.5px] font-medium transition-colors cursor-pointer ${
                  tierFilter === t
                    ? t === "Popular"
                      ? "bg-sky-500 text-black font-semibold"
                      : t === "Free"
                      ? "bg-emerald-500 text-black font-semibold"
                      : "bg-white text-black font-semibold"
                    : t === "Popular"
                    ? "bg-sky-950/70 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-900/80"
                    : t === "Free"
                    ? "bg-emerald-950/70 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-900/80"
                    : "bg-[#242424] text-stone-400 hover:bg-[#2f2f2f] hover:text-white"
                }`}
              >
                {t === "Popular" ? "⭐ Popular" : t === "Free" ? `⚡ Free (${freeCount})` : t}
              </button>
            ))}
          </div>

          {/* Models Scrollable List */}
          <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
            {filteredModels.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-stone-400">
                No models matching &ldquo;{search}&rdquo;
              </p>
            ) : (
              filteredModels.map((opt) => {
                const isSelected = selectedModel.modelId === opt.modelId;
                return (
                  <button
                    key={opt.modelId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectModel(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start justify-between rounded-xl p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#282828] text-white ring-1 ring-stone-700"
                        : "text-stone-300 hover:bg-[#222222] hover:text-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-white">
                          {opt.displayName}
                        </span>
                        {opt.isPopular && (
                          <span className="rounded bg-sky-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-sky-300 ring-1 ring-sky-500/40">
                            POPULAR
                          </span>
                        )}
                        {opt.isFree && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                            FREE
                          </span>
                        )}
                        <span className="rounded bg-[#2a2a2a] px-1.5 py-0.2 font-mono text-[9px] text-stone-400">
                          {opt.provider}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-medium ${
                            opt.tier === "Reasoning"
                              ? "bg-purple-950/80 text-purple-300 ring-1 ring-purple-800/40"
                              : opt.tier === "Finance Specialist"
                              ? "bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-800/40"
                              : opt.tier === "Fast"
                              ? "bg-amber-950/80 text-amber-300 ring-1 ring-amber-800/40"
                              : "bg-stone-800 text-stone-300"
                          }`}
                        >
                          {opt.tier}
                        </span>
                        <span className="font-mono text-[9.5px] text-stone-400">
                          {Math.round(opt.contextWindow / 1000)}k ctx
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-400">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && <Check className="mt-1 size-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
