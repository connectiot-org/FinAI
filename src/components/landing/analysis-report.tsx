"use client";

import {
  TrendingUp,
  Scale,
  GitBranch,
  FileSearch,
  Table2,
  Calculator,
  Percent,
  BarChart3,
} from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Stagger, StaggerItem, Reveal } from "./reveal";

const features = [
  {
    icon: TrendingUp,
    title: "Variance & flux analysis",
    desc: "Compare actuals, budget, prior periods, and forecasts. Get driver-level commentary you can defend in a review meeting.",
    tag: "FP&A",
  },
  {
    icon: Scale,
    title: "Ratio & trend analysis",
    desc: "Liquidity, leverage, margin, and working-capital ratios computed from your own schedules — with the formula shown.",
    tag: "Analysis",
  },
  {
    icon: GitBranch,
    title: "Scenario modeling",
    desc: "Flex revenue, headcount, or rates and see the cascading effect on P&L, cash, and covenants before you commit.",
    tag: "Planning",
  },
  {
    icon: FileSearch,
    title: "Document intelligence",
    desc: "Extract key figures from filings, contracts, and statements with page-level citations back to the source.",
    tag: "Research",
  },
  {
    icon: Table2,
    title: "Spreadsheet review",
    desc: "Point FInAI at a workbook to map its structure, trace precedents, and summarize what each tab actually does.",
    tag: "Excel",
  },
  {
    icon: Calculator,
    title: "Calculation checks",
    desc: "Re-run formulas and reconciliation logic independently, then show you exactly where results diverge.",
    tag: "Controls",
  },
];

const stats = [
  { value: "5+", label: "frontier model families" },
  { value: "30+", label: "file types supported" },
  { value: "1", label: "workspace for every task" },
];

export function Analysis() {
  return (
    <section
      id="analysis"
      className="scroll-mt-24 border-y border-line bg-paper-soft/60 py-20 md:py-28"
      aria-label="Financial analysis features"
    >
      <Container>
        <SectionHeading
          eyebrow="Financial analysis"
          title={
            <>
              Analysis that starts from{" "}
              <span className="font-serif-accent font-normal text-moss">your</span>{" "}
              numbers.
            </>
          }
          description="General-purpose chatbots guess. FInAI grounds every answer in the files and figures you attach — spreadsheets, statements, filings, and policies — and shows its sources so reviewers can verify."
        />

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-xl bg-moss-soft text-moss-deep transition-colors group-hover:bg-stone-950 group-hover:text-white"
                  >
                    <f.icon className="size-4.5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-stone-950">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                  {f.desc}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.1} className="mt-12">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-3 bg-white px-7 py-6">
                <span className="text-[30px] font-semibold tracking-tight text-stone-950">
                  {s.value}
                </span>
                <span className="text-[13.5px] text-ink-soft">{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------ Report builder ----------------------------- */

const steps = [
  { n: "01", title: "Attach sources", desc: "Drop in spreadsheets, ERP exports, or last quarter's pack." },
  { n: "02", title: "Set the outline", desc: "Use a saved template or let FInAI propose the structure." },
  { n: "03", title: "Generate the draft", desc: "Narrative, tables, and charts written from your actual figures." },
  { n: "04", title: "Review & export", desc: "Edit inline, resolve flags, then export PDF, DOCX, or slides." },
];

export function ReportBuilder() {
  return (
    <section id="reports" className="scroll-mt-24 py-20 md:py-28" aria-label="Report builder">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Report builder"
              title={
                <>
                  From raw files to{" "}
                  <span className="font-serif-accent font-normal text-moss">
                    board-ready
                  </span>{" "}
                  reports.
                </>
              }
              description="Give FInAI your sources and a template. It drafts the narrative, builds the tables, inserts the charts, and keeps every number traceable to the file it came from — so the review pass takes minutes, not days."
            />
            <Reveal delay={0.15}>
              <ol className="mt-10 space-y-0">
                {steps.map((s, i) => (
                  <li key={s.n} className="relative flex gap-5 pb-7 last:pb-0">
                    {i < steps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[19px] top-11 h-[calc(100%-28px)] w-px bg-line"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white font-mono text-[11px] font-semibold text-moss-deep"
                    >
                      {s.n}
                    </span>
                    <div className="pt-1.5">
                      <p className="text-[15.5px] font-medium text-stone-950">{s.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
                        {s.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>

          {/* Report artifact mockup */}
          <Reveal delay={0.1}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-moss-soft/80 via-transparent to-amber-100/50 blur-2xl"
              />
              <div className="relative rounded-2xl border border-line bg-white p-6 shadow-float md:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="size-4 text-moss" aria-hidden="true" />
                    <p className="text-[13.5px] font-semibold text-stone-950">
                      Monthly finance report — October
                    </p>
                  </div>
                  <span className="rounded-full bg-moss-soft px-2.5 py-1 font-mono text-[10px] font-medium text-moss-deep">
                    DRAFT v0.9
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    { w: "w-3/4", h: "h-3" },
                    { w: "w-full", h: "h-2.5" },
                    { w: "w-5/6", h: "h-2.5" },
                    { w: "w-2/3", h: "h-2.5" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className={`${r.h} ${r.w} rounded-full bg-stone-100`}
                    />
                  ))}
                  {/* mini chart */}
                  <div aria-hidden="true" className="flex h-24 items-end gap-2 rounded-xl border border-line bg-paper-soft/50 p-3">
                    {[42, 58, 38, 66, 50, 74, 61, 82].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-md ${i === 7 ? "bg-moss" : "bg-stone-200"}`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  {[
                    { w: "w-full", h: "h-2.5" },
                    { w: "w-11/12", h: "h-2.5" },
                    { w: "w-1/2", h: "h-3" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className={`${r.h} ${r.w} rounded-full bg-stone-100`}
                    />
                  ))}
                  <div className="flex items-center justify-between rounded-xl border border-moss/20 bg-moss-soft/50 px-4 py-3">
                    <p className="text-[12px] font-medium text-moss-deep">
                      6 of 7 sections drafted · 1 consistency flag resolved
                    </p>
                    <span className="font-mono text-[10px] text-stone-400">GPT + Gemini</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
