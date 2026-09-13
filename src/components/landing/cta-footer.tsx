"use client";

import { ArrowRight } from "lucide-react";
import { Container } from "./section-heading";
import { Reveal } from "./reveal";
import { Logo } from "./logo";

const footerCols = [
  {
    title: "Product",
    links: [
      { label: "Workspace", href: "/agent" },
      { label: "Multi-model chat", href: "#models" },
      { label: "Financial analysis", href: "#analysis" },
      { label: "Report builder", href: "#reports" },
      { label: "Presentation builder", href: "#presentations" },
      { label: "Finance agents", href: "#agents" },
      { label: "Model routing", href: "#routing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "FP&A teams", href: "#analysis" },
      { label: "Accounting & close", href: "#checking" },
      { label: "Auditors", href: "#agents" },
      { label: "Advisory & diligence", href: "#agents" },
      { label: "CFO office", href: "#reports" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Template gallery", href: "#templates" },
      { label: "Compare", href: "#compare" },
      { label: "Security", href: "#security" },
      { label: "Product demo", href: "#demo" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Careers", href: "#top" },
      { label: "Contact sales", href: "#pricing" },
      { label: "Press", href: "#top" },
    ],
  },
];

export function FinalCTA() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-stone-950 pb-16 pt-20 text-white md:pb-20 md:pt-28"
      aria-label="Get started"
    >
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent px-6 py-16 text-center md:px-12 md:py-24">
            <div aria-hidden="true" className="bg-grid-dark absolute inset-0 opacity-60" />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-[-160px] h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-moss/30 blur-[100px]"
            />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                Get started
              </p>
              <h2 className="display mx-auto mt-5 max-w-2xl text-balance text-[34px] sm:text-[46px] md:text-[58px]">
                Your finance team&apos;s AI workspace is{" "}
                <span className="font-serif-accent font-normal text-emerald-400">
                  ready
                </span>
                .
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-[15.5px] leading-relaxed text-stone-400">
                Bring every model, every workflow, and every file into one
                place. Free to start — no credit card required.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/agent"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-stone-950 transition-colors hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Start free
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
                <a
                  href="#top"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Talk to sales
                </a>
              </div>
              <p className="mt-6 font-mono text-[11px] text-stone-500">
                Free plan includes limited monthly credits across models
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-stone-950 pb-10 text-stone-400" aria-label="Footer">
      <Container>
        <div className="grid gap-10 border-t border-white/10 pt-12 md:grid-cols-[1.3fr_repeat(4,1fr)] md:gap-6">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed">
              Multiple AI models. One finance workspace. Built for the people
              who run the numbers.
            </p>
            <p className="mt-5 flex items-center gap-2 text-[12px]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </p>
          </div>
          {footerCols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-stone-500">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13.5px] transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center">
          <p className="text-[12px] text-stone-500">
            © 2026 Fintra Technologies, Inc. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
            {["Privacy", "Terms", "Security", "Status", "Cookies"].map((l) => (
              <li key={l}>
                <a href="#top" className="transition-colors hover:text-white">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
