"use client";

import { useState, useMemo } from "react";
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

  const filteredModels = useMemo(() => {
    return modelsConfig.filter((m) => {
      const matchesSearch =
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase()) ||
        m.desc.toLowerCase().includes(search.toLowerCase());
      const matchesTier = tierFilter === "All" || m.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [search, tierFilter]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded-full border border-line bg-white px-3 text-[12.5px] font-medium text-stone-800 shadow-xs transition-colors hover:border-stone-300"
      >
        <span className="size-1.5 rounded-full bg-moss" aria-hidden="true" />
        <span className="max-w-[140px] truncate">{selectedModel.displayName}</span>
        <span className="hidden rounded bg-paper-soft px-1.5 py-0.2 font-mono text-[9px] text-stone-500 md:inline">
          {Math.round(selectedModel.contextWindow / 1000)}k
        </span>
        <ChevronDown
          className={`size-3.5 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-[340px] sm:w-[420px] rounded-2xl border border-line bg-white p-3 shadow-float"
        >
          <div className="mb-2 flex items-center justify-between border-b border-line/60 pb-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-stone-500">
              Frontier Model Catalog ({modelsConfig.length})
            </span>
            <span className="rounded-full bg-moss-soft px-2 py-0.5 font-mono text-[9.5px] font-medium text-moss-deep">
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
              placeholder="Search frontier & specialist models..."
              className="w-full rounded-xl border border-line bg-paper-soft/60 py-1.5 pl-8 pr-3 text-[12px] text-stone-800 outline-none placeholder:text-stone-400 focus:border-moss"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Tier Filter Tabs */}
          <div className="mb-2.5 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {["All", "Reasoning", "Balanced", "Fast", "Finance Specialist", "Open"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`shrink-0 rounded-lg px-2 py-1 text-[10.5px] font-medium transition-colors ${
                  tierFilter === t
                    ? "bg-stone-950 text-white"
                    : "bg-paper-soft text-stone-600 hover:bg-stone-200"
                }`}
              >
                {t}
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
                    className={`flex w-full items-start justify-between rounded-xl p-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-moss-soft/80 ring-1 ring-moss/30"
                        : "hover:bg-paper-soft"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-stone-900">
                          {opt.displayName}
                        </span>
                        <span className="rounded bg-paper px-1.5 py-0.2 font-mono text-[9px] text-stone-500">
                          {opt.provider}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-medium ${
                            opt.tier === "Reasoning"
                              ? "bg-purple-100 text-purple-800"
                              : opt.tier === "Finance Specialist"
                              ? "bg-emerald-100 text-emerald-800"
                              : opt.tier === "Fast"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {opt.tier}
                        </span>
                        <span className="font-mono text-[9.5px] text-stone-400">
                          {Math.round(opt.contextWindow / 1000)}k ctx
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && <Check className="mt-1 size-4 text-moss shrink-0" />}
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
