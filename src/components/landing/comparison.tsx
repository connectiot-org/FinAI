"use client";

import { Check, Minus, CircleDot, ExternalLink, ChevronDown, Info } from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Reveal } from "./reveal";
import { competitors, comparisonRows, type CellStatus } from "@/lib/site-data";

function CellMark({ status, note }: { status: CellStatus; note?: string }) {
  if (status === "yes")
    return (
      <span title={note} className="inline-grid place-items-center">
        <Check className="size-4.5 text-moss" aria-label="Yes, core capability" />
      </span>
    );
  if (status === "partial")
    return (
      <span title={note} className="inline-grid place-items-center">
        <CircleDot className="size-4.5 text-amber-600" aria-label="Partial or adjacent capability" />
      </span>
    );
  return (
    <span title={note ?? "Not publicly verified"} className="inline-grid place-items-center">
      <Minus className="size-4.5 text-stone-300" aria-label="Not publicly verified" />
    </span>
  );
}

export function Comparison() {
  return (
    <section id="compare" className="scroll-mt-24 py-20 md:py-28" aria-label="Competitor comparison">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="How Fintra compares"
          title={
            <>
              A different{" "}
              <span className="font-serif-accent font-normal text-moss">category</span>{" "}
              of tool.
            </>
          }
          description="Research platforms, FP&A suites, and close tools each solve one slice of finance work. Fintra is the general workspace above them: every model, every workflow, one place. Competitor facts are compiled from public sources as of September 2026."
        />

        {/* Matrix */}
        <Reveal className="mt-12 md:mt-14">
          <div className="mb-2 flex items-center justify-end text-[11px] text-stone-400 md:hidden">
            <span>← Scroll table to compare competitors →</span>
          </div>
          <div className="overflow-x-auto touch-pan-x [scrollbar-width:thin] rounded-2xl border border-line bg-white shadow-card">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <caption className="sr-only">
                Feature comparison between Fintra and five publicly known
                competitors across nine capability areas
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-white px-5 py-4 text-[12px] font-medium text-stone-400 md:px-6"
                  >
                    Capability
                  </th>
                  <th scope="col" className="bg-moss-soft/70 px-4 py-4">
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-950">
                      <span
                        aria-hidden="true"
                        className="grid size-5 place-items-center rounded-md bg-stone-950 text-[10px] text-white"
                      >
                        Σ
                      </span>
                      Fintra
                    </span>
                  </th>
                  {competitors.map((c) => (
                    <th
                      key={c.id}
                      scope="col"
                      className="px-4 py-4 text-[13px] font-medium text-stone-700"
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr
                    key={row.label}
                    className={`border-b border-line/70 last:border-0 ${
                      ri % 2 === 1 ? "bg-paper-soft/40" : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-inherit px-5 py-3.5 text-[13px] font-medium text-stone-900 md:px-6"
                    >
                      {row.label}
                    </th>
                    <td className="bg-moss-soft/50 px-4 py-3.5">
                      <span className="flex items-center gap-2">
                        <CellMark status="yes" />
                        <span className="hidden text-[11.5px] leading-snug text-moss-deep xl:inline">
                          {row.fintraNote ?? row.summaNote}
                        </span>
                      </span>
                    </td>
                    {competitors.map((c) => {
                      const cell = row.cells[c.id];
                      return (
                        <td key={c.id} className="px-4 py-3.5 align-middle">
                          <span className="flex items-center gap-2">
                            <CellMark status={cell.status} note={cell.note} />
                            {cell.note && (
                              <span className="hidden text-[11px] leading-snug text-stone-500 2xl:inline">
                                {cell.note}
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-[12px] text-stone-500">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-moss" aria-hidden="true" /> Core capability
            </span>
            <span className="flex items-center gap-1.5">
              <CircleDot className="size-3.5 text-amber-600" aria-hidden="true" /> Partial / adjacent
            </span>
            <span className="flex items-center gap-1.5">
              <Minus className="size-3.5 text-stone-400" aria-hidden="true" /> Not publicly verified
            </span>
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5 text-stone-400" aria-hidden="true" />
              Hover a mark for detail
            </span>
          </div>
        </Reveal>

        {/* Deep dives */}
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {competitors.map((c, i) => (
            <Reveal key={c.id} delay={0.05 * (i % 2)}>
              <details className="group h-full rounded-2xl border border-line bg-white transition-shadow open:shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-[16px] font-semibold tracking-tight text-stone-950">
                      {c.name}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-soft">{c.tagline}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-stone-500 transition-transform group-open:rotate-180"
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </summary>
                <div className="space-y-5 border-t border-line px-6 pb-6 pt-5 text-[13px] leading-relaxed text-ink-soft">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                      Core features
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {c.coreFeatures.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-moss" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Target users
                      </dt>
                      <dd className="mt-1">{c.targetUsers}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Pricing {c.pricingVerified === "partial" && "(market-reported)"}
                      </dt>
                      <dd className="mt-1">{c.pricing}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        AI models
                      </dt>
                      <dd className="mt-1">{c.aiModels}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Finance features
                      </dt>
                      <dd className="mt-1">{c.financeFeatures}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Templates & workflows
                      </dt>
                      <dd className="mt-1">{c.templatesWorkflows}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Marketing & acquisition
                      </dt>
                      <dd className="mt-1">{c.marketingAcquisition}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400">
                        Partnerships / integrations
                      </dt>
                      <dd className="mt-1">{c.partnerships}</dd>
                    </div>
                  </dl>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-moss-soft/60 p-4">
                      <p className="text-[12px] font-semibold text-moss-deep">Strengths</p>
                      <ul className="mt-2 space-y-1.5 text-[12.5px] text-moss-deep/90">
                        {c.strengths.map((s) => (
                          <li key={s}>+ {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-paper-soft p-4">
                      <p className="text-[12px] font-semibold text-stone-700">Weaknesses</p>
                      <ul className="mt-2 space-y-1.5 text-[12.5px] text-stone-600">
                        {c.weaknesses.map((w) => (
                          <li key={w}>− {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900"
                  >
                    Visit {c.name.toLowerCase().replace(/\s/g, "")}.com
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <p className="mx-auto max-w-3xl rounded-xl border border-line bg-paper-soft/70 p-4 text-[11.5px] leading-relaxed text-stone-500">
            Source note: competitor information is summarized from publicly
            available materials — company websites, vendor comparison pages, and
            third-party pricing guides — accessed September 2026. Figures from
            third-party trackers are market-reported and may not reflect current
            official pricing. Where information could not be confirmed publicly,
            it is marked &ldquo;Not publicly verified.&rdquo; This comparison is
            provided for general information and is not an endorsement or claim
            about any third party.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
