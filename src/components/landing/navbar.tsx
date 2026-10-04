"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "./logo";

const productLinks = [
  { label: "Multi-model chat", href: "/agent#models", desc: "GPT, Claude, Gemini, DeepSeek" },
  { label: "Financial analysis", href: "/agent#analysis", desc: "Variance, ratios, scenarios" },
  { label: "Report builder", href: "/agent#reports", desc: "Draft to board-ready" },
  { label: "Error checking", href: "/#checking", desc: "Ties, formulas, inconsistencies" },
  { label: "Presentation builder", href: "/#presentations", desc: "Branded decks in minutes" },
  { label: "Finance agents", href: "/agent", desc: "Automate recurring work" },
];

function Dropdown({
  label,
  items,
  rich = false,
}: {
  label: string;
  items: { label: string; href: string; desc?: string }[];
  rich?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex h-9 items-center gap-1 rounded-full px-3.5 text-[14px] font-medium text-stone-600 transition-colors hover:text-stone-950 focus-visible:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss group-focus-within:text-stone-950"
      >
        {label}
        <ChevronDown
          className="size-3.5 text-stone-400 transition-transform duration-200 group-hover:rotate-180"
          aria-hidden="true"
        />
      </button>
      <div
        className={`invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`}
      >
        <div
          role="menu"
          aria-label={label}
          className={`w-max rounded-2xl border border-line bg-white p-2 shadow-float ${
            rich ? "min-w-[300px]" : "min-w-[200px]"
          }`}
        >
          {items.map((item) => (
            <a
              key={item.label}
              role="menuitem"
              href={item.href}
              className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-paper-soft focus-visible:bg-paper-soft focus-visible:outline-none"
            >
              <span className="block text-[14px] font-medium text-stone-900">
                {item.label}
              </span>
              {item.desc && (
                <span className="mt-0.5 block text-[12.5px] text-stone-500">
                  {item.desc}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line/80 bg-paper/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 md:h-[68px] md:px-8"
      >
        <div className="flex items-center gap-1">
          <Logo />
        </div>

        {/* Desktop nav */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
          <Dropdown label="Product" items={productLinks} rich />
          {[
            { label: "Workspace", href: "/agent" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Compare", href: "/compare" },
            { label: "Security", href: "/security" },
            { label: "Routing", href: "/#routing" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                l.label === "Workspace"
                  ? "text-moss hover:text-moss-deep font-semibold"
                  : l.label === "Pricing"
                  ? "text-stone-900 font-semibold hover:text-moss"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href="/sign-in"
            className="flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium text-stone-600 transition-colors hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            Log in
          </a>
          <a
            href="/agent"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-stone-950 px-4.5 text-[14px] font-medium text-white transition-colors hover:bg-moss-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            Start free
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-stone-800 transition-colors hover:bg-stone-100 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-b border-line bg-paper lg:hidden"
          >
            <div className="max-h-[calc(100dvh-64px)] space-y-6 overflow-y-auto px-5 pb-8 pt-2">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
                  Product
                </p>
                <div className="grid gap-1">
                  {productLinks.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white"
                    >
                      <span className="text-[15px] font-medium">{l.label}</span>
                      <ArrowRight className="size-4 text-stone-400" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
                  Explore
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: "Workspace", href: "/agent" },
                    { label: "Pricing", href: "/#pricing" },
                    { label: "Compare", href: "/compare" },
                    { label: "Security", href: "/security" },
                    { label: "Routing", href: "/#routing" },
                    { label: "Log in", href: "/sign-in" },
                  ].map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-white ${
                        l.label === "Workspace"
                          ? "text-moss font-semibold"
                          : l.label === "Pricing"
                          ? "text-stone-900 font-semibold"
                          : ""
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <a
                href="/agent"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-stone-950 text-[15px] font-medium text-white transition-colors hover:bg-moss-deep"
              >
                Start free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
