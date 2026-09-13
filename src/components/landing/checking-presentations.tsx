"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Link2Off, Sigma, FileWarning, Database, ShieldCheck } from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Reveal } from "./reveal";

const findings = [
  {
    icon: Link2Off,
    severity: "High",
    title: "Cash flow doesn't tie to balance sheet",
    detail:
      "Change in cash of $2.1M in the cash flow statement differs from the balance sheet delta ($1.9M) by $0.2M. Possible FX translation line missing.",
  },
  {
    icon: Sigma,
    severity: "High",
    title: "Depreciation formula references wrong range",
    detail:
      "Cell F42 in 'Fixed Assets' sums rows 12–30; the schedule extends to row 34. Two new assets added in September are excluded.",
  },
  {
    icon: FileWarning,
    severity: "Medium",
    title: "Revenue mismatch between deck and model",
    detail:
      "Board deck slide 4 shows Q3 revenue of $24.9M; the model tab and actuals file both show $24.8M. Rounding or a stale export is likely.",
  },
  {
    icon: Database,
    severity: "Low",
    title: "Unmapped accounts in flux schedule",
    detail:
      "Three GL accounts (6410, 6412, 6415) are missing mapping rules and were excluded from the flux analysis rollup.",
  },
];

const severityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function ErrorChecking() {
  const reduce = useReducedMotion();

  return (
    <section
      id="checking"
      className="scroll-mt-24 bg-stone-950 py-20 text-white md:py-28"
      aria-label="Error and consistency checking"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Reveal className="flex max-w-xl flex-col gap-4">
              <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
                <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-emerald-400" />
                Consistency engine
              </p>
              <h2 className="display text-balance text-[32px] sm:text-[42px] md:text-[52px]">
                Every number,{" "}
                <span className="font-serif-accent font-normal text-emerald-400">
                  checked
                </span>{" "}
                before anyone else sees it.
              </h2>
              <p className="max-w-lg text-pretty text-[16px] leading-relaxed text-stone-400">
                Spreadsheets don't ship with a spell-checker for figures. Fintra
                cross-examines your work — statements against schedules, decks
                against models, this month against last month — and flags
                potential issues for your review before they reach the CFO.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <ul className="mt-9 space-y-4">
                {[
                  {
                    icon: Link2Off,
                    title: "Broken ties",
                    desc: "Cross-statement and cross-tab reconciliation checks",
                  },
                  {
                    icon: Sigma,
                    title: "Formula errors",
                    desc: "Range checks, broken references, and logic sweeps",
                  },
                  {
                    icon: FileWarning,
                    title: "Inconsistencies",
                    desc: "The same figure quoted differently across documents",
                  },
                ].map((c) => (
                  <li key={c.title} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10"
                    >
                      <c.icon className="size-4.5 text-emerald-400" />
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-white">{c.title}</p>
                      <p className="mt-0.5 text-[13px] text-stone-400">{c.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-9 flex max-w-md items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4 text-[12.5px] leading-relaxed text-stone-400">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                Findings are advisory. Fintra surfaces potential issues with
                citations — a human always makes the final call.
              </p>
            </Reveal>
          </div>

          {/* Findings panel */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur md:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
                  <AlertTriangle className="size-4 text-amber-400" aria-hidden="true" />
                  Review queue — q3_close_v4.xlsx
                </p>
                <span className="font-mono text-[10.5px] text-stone-400">4 findings</span>
              </div>
              <ul className="mt-4 space-y-3">
                {findings.map((f, i) => (
                  <motion.li
                    key={f.title}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
                    className="rounded-xl border border-white/10 bg-stone-900/60 p-4 transition-colors hover:border-white/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-white">
                        <f.icon className="size-4 shrink-0 text-stone-400" aria-hidden="true" />
                        {f.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-wide ring-1 ${severityStyles[f.severity]}`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="mt-2 pl-[26px] text-[12px] leading-relaxed text-stone-400">
                      {f.detail}
                    </p>
                  </motion.li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-white py-3 text-[13px] font-semibold text-stone-950 transition-colors hover:bg-emerald-200"
              >
                Resolve all flagged items
              </button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------- Presentation builder -------------------------- */

const slides = [
  { title: "Q3 FY26 — Board Summary", type: "Title", w: "w-4/5" },
  { title: "Financial highlights", type: "KPIs + charts", w: "w-11/12" },
  { title: "Revenue performance", type: "Chart + narrative", w: "w-full" },
  { title: "Opex & variance drivers", type: "Table", w: "w-3/5" },
  { title: "Cash & runway", type: "Chart", w: "w-4/5" },
  { title: "Risks & asks", type: "Narrative", w: "w-2/3" },
];

export function PresentationBuilder() {
  const reduce = useReducedMotion();
  return (
    <section
      id="presentations"
      className="scroll-mt-24 py-20 md:py-28"
      aria-label="Presentation builder"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Deck mockup */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                {slides.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={reduce ? false : { opacity: 0, y: 20, rotate: i % 2 ? 1.2 : -1.2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.55 }}
                    className="group aspect-[4/3] rounded-xl border border-line bg-white p-3.5 shadow-card transition-transform hover:-translate-y-1"
                  >
                    <div className="flex h-full flex-col">
                      <p className="text-[10.5px] font-semibold leading-snug text-stone-900">
                        {s.title}
                      </p>
                      <div className="mt-2 flex flex-1 flex-col justify-center gap-1.5" aria-hidden="true">
                        <div className={`h-1.5 ${s.w} rounded-full bg-stone-100`} />
                        <div className="h-1.5 w-3/4 rounded-full bg-stone-100" />
                        {i % 2 === 0 ? (
                          <div className="mt-1 flex h-10 items-end gap-1">
                            {[55, 75, 45, 88, 62, 95].map((h, j) => (
                              <div
                                key={j}
                                className={`flex-1 rounded-sm ${j === 5 ? "bg-moss" : "bg-stone-200"}`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 h-10 rounded-md bg-gradient-to-tr from-moss-soft to-stone-100" />
                        )}
                      </div>
                      <p className="font-mono text-[8.5px] uppercase tracking-wider text-stone-400">
                        {s.type}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-6 -top-6 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-float"
              >
                <p className="font-mono text-[10px] text-stone-400">EXPORT</p>
                <p className="text-[12px] font-semibold text-stone-900">board_pack_q3.pptx</p>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Presentation builder"
              title={
                <>
                  Decks your{" "}
                  <span className="font-serif-accent font-normal text-moss">CFO</span>{" "}
                  will actually read.
                </>
              }
              description="Turn any analysis into a branded presentation. Fintra follows your house template — fonts, colors, chart styles — writes the storyline, and keeps slide numbers in sync with the underlying model."
            />
            <Reveal delay={0.15}>
              <ul className="mt-9 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Your brand, enforced",
                    desc: "Templates lock typography, palette, and chart styling.",
                  },
                  {
                    title: "Numbers stay in sync",
                    desc: "Slide figures link back to the analysis that produced them.",
                  },
                  {
                    title: "Narrative included",
                    desc: "Speaker notes and commentary drafted per slide.",
                  },
                  {
                    title: "Export anywhere",
                    desc: "PPTX and PDF output that survives round-tripping.",
                  },
                ].map((b) => (
                  <li
                    key={b.title}
                    className="rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-card"
                  >
                    <p className="text-[14px] font-medium text-stone-950">{b.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{b.desc}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
