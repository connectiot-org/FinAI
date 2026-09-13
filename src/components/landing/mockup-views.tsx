"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Paperclip,
  ArrowUp,
  FileText,
  Presentation,
  Sigma,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Route,
  Clock,
} from "lucide-react";

/* ---------------------------------- Chat ---------------------------------- */

const opexRows = [
  { line: "Payroll & benefits", budget: "$4.82M", actual: "$4.97M", var: "+3.2%", flag: false },
  { line: "Cloud & infrastructure", budget: "$0.92M", actual: "$1.09M", var: "+18.4%", flag: true },
  { line: "Contractors", budget: "$0.63M", actual: "$0.71M", var: "+12.7%", flag: true },
  { line: "Marketing programs", budget: "$1.10M", actual: "$1.01M", var: "-8.1%", flag: false },
  { line: "Travel & T&E", budget: "$0.40M", actual: "$0.42M", var: "+5.0%", flag: false },
];

const suggestions = [
  "Compare Q3 actuals vs. budget and flag unusual opex",
  "Reconcile cash flow statement to the balance sheet",
  "Draft the revenue section of the board report",
  "Turn last month's flux analysis into a memo",
];

export function ChatView({ activeModel }: { activeModel: string }) {
  const reduce = useReducedMotion();
  const fullText =
    "I compared Q3 actuals to budget across all opex lines. Overall spend is $23.1M vs. a $22.4M plan (+3.1%). Two lines stand out — cloud infrastructure is +18.4% over plan, driven by the July data-platform migration, and contractor spend is +12.7% ahead of budget with no matching PO increase. Payroll, marketing, and travel are within normal bands. Want me to draft the variance memo and attach the supporting schedules?";
  const [typed, setTyped] = useState(reduce ? fullText.length : 0);
  const [input, setInput] = useState("");
  const [previewNote, setPreviewNote] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduce) return;
    timer.current = setInterval(() => {
      setTyped((t) => {
        if (t >= fullText.length) {
          if (timer.current) clearInterval(timer.current);
          return t;
        }
        return t + 4;
      });
    }, 16);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [reduce]);

  const done = typed >= fullText.length;

  return (
    <div className="flex h-full flex-col">
      {/* Thread */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6" aria-live="off">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-stone-950 px-4 py-3 text-[13.5px] leading-relaxed text-white md:max-w-[70%]">
            Compare Q3 actuals vs. budget and flag anything unusual in opex.
            <span className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50">
              <Paperclip className="size-3" aria-hidden="true" />
              q3_actuals.xlsx · q3_budget.xlsx
            </span>
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-stone-950 text-white"
          >
            <Sigma className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-relaxed text-stone-800">
              {fullText.slice(0, typed)}
              {!done && (
                <span
                  aria-hidden="true"
                  className="caret-blink ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] bg-moss"
                />
              )}
            </p>

            {done && (
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
                <table className="w-full text-left text-[12px]">
                  <caption className="sr-only">
                    Operating expense variance versus budget
                  </caption>
                  <thead>
                    <tr className="border-b border-line bg-paper-soft/70 font-mono text-[10.5px] uppercase tracking-wider text-stone-500">
                      <th scope="col" className="px-3 py-2 font-medium">Opex line</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Budget</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Actual</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Var</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opexRows.map((r) => (
                      <tr key={r.line} className="border-b border-line/60 last:border-0">
                        <td className="px-3 py-2 font-medium text-stone-800">
                          {r.line}
                          {r.flag && (
                            <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-amber-700 ring-1 ring-amber-200">
                              REVIEW
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-500">{r.budget}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-800">{r.actual}</td>
                        <td
                          className={`px-3 py-2 text-right font-mono tabular-nums ${
                            r.flag ? "font-semibold text-amber-700" : "text-stone-600"
                          }`}
                        >
                          {r.var}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {done && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-moss-soft px-2.5 py-1 font-medium text-moss-deep">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-moss" />
                  Answered by {activeModel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1">
                  <FileText className="size-3" aria-hidden="true" /> 2 files referenced
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700 transition-colors hover:bg-stone-200"
                >
                  <Presentation className="size-3" aria-hidden="true" />
                  Turn into deck
                </button>
              </div>
            )}
          </div>
        </div>

        {previewNote && (
          <p
            role="status"
            className="rounded-xl border border-line bg-paper-soft px-4 py-3 text-[12.5px] text-stone-600"
          >
            Preview mode — create a free workspace to run this prompt with GPT,
            Claude, Gemini, or DeepSeek.
          </p>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-white/70 p-4 backdrop-blur md:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPreviewNote(true);
          }}
          className="mx-auto max-w-2xl"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-card focus-within:border-stone-300">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-moss-soft text-[11px] font-semibold text-moss-deep">
              {activeModel.slice(0, 2).toUpperCase()}
            </span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${activeModel}…`}
              aria-label="Message the AI assistant"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-stone-900 outline-none placeholder:text-stone-400"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-stone-950 text-white transition-colors hover:bg-moss-deep"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------- Analysis -------------------------------- */

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const actualBars = [5.1, 5.4, 5.9, 6.3, 6.1, 6.5];
const budgetBars = [5.0, 5.2, 5.6, 5.8, 6.0, 6.2];

const metrics = [
  { label: "Revenue", value: "$24.8M", delta: "+12.4%", good: true, note: "vs. $22.1M LY" },
  { label: "Gross margin", value: "61.3%", delta: "-0.8pp", good: false, note: "mix shift" },
  { label: "Opex ratio", value: "34.2%", delta: "+1.1pp", good: false, note: "vs. plan 33.1%" },
  { label: "Cash", value: "$18.2M", delta: "+$2.1M", good: true, note: "11.2 mo runway" },
];

function BarChart() {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);
  const max = 7;
  const chartH = 150;
  const grow = (v: number) =>
    reduce || mounted ? (v / max) * chartH : 0;

  return (
    <figure className="rounded-xl border border-line bg-white p-4 md:p-5">
      <figcaption className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-stone-900">Opex: actual vs. budget</p>
          <p className="text-[11.5px] text-stone-500">$M per month · H2 FY26</p>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-moss" aria-hidden="true" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-stone-300" aria-hidden="true" /> Budget
          </span>
        </div>
      </figcaption>
      <svg
        viewBox="0 0 560 170"
        className="h-auto w-full"
        role="img"
        aria-label="Bar chart comparing monthly operating expense actuals against budget, April through September. Actuals run above budget from June onward."
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2="560"
            y1={12 + i * 44}
            y2={12 + i * 44}
            stroke="#e7e5e0"
            strokeWidth="1"
          />
        ))}
        {months.map((m, i) => {
          const cx = 28 + i * 90;
          return (
            <g key={m}>
              <rect
                x={cx}
                y={162 - grow(budgetBars[i])}
                width="16"
                height={grow(budgetBars[i])}
                rx="3"
                fill="#d6d3d1"
              />
              <rect
                x={cx + 20}
                y={162 - grow(actualBars[i])}
                width="16"
                height={grow(actualBars[i])}
                rx="3"
                fill="#0e6245"
              />
              <text x={cx + 18} y="170" textAnchor="middle" className="fill-stone-400" fontSize="10">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function Sparkline() {
  const pts = useMemo(() => {
    const vals = [18.0, 17.4, 16.9, 16.1, 17.2, 18.2];
    return vals
      .map((v, i) => `${(i / (vals.length - 1)) * 100},${28 - ((v - 16) / 2.4) * 22}`)
      .join(" ");
  }, []);
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#0e6245" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function AnalysisView() {
  return (
    <div className="grid gap-4 overflow-y-auto p-5 md:p-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
              {m.label}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-[19px] font-semibold tracking-tight text-stone-950">{m.value}</p>
              <span
                className={`font-mono text-[11px] font-medium ${
                  m.good ? "text-moss" : "text-amber-700"
                }`}
              >
                {m.delta}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">{m.note}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BarChart />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[13px] font-semibold text-stone-900">Cash position</p>
            <p className="text-[11.5px] text-stone-500">Trailing 6 months · $M</p>
            <div className="mt-3">
              <Sparkline />
            </div>
            <p className="mt-2 font-mono text-[11px] text-stone-500">
              Low 16.1 · High 18.2 · Runway 11.2 mo
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-line bg-stone-950 p-4 text-white">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/50">
              AI summary
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
              Spend momentum is above plan since June. If the cloud run-rate holds,
              full-year opex lands ~2.3% over budget — review contractor POs before
              the October close.
            </p>
            <p className="mt-3 font-mono text-[10px] text-white/40">Generated by Gemini</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Report --------------------------------- */

const reportSections = [
  { name: "Executive summary", status: "done" },
  { name: "Financial highlights", status: "done" },
  { name: "Variance analysis", status: "active" },
  { name: "Cash & runway", status: "queued" },
  { name: "Risks & asks", status: "queued" },
  { name: "Appendix: schedules", status: "queued" },
];

export function ReportView() {
  return (
    <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-[240px_1fr] md:p-6">
      <aside className="rounded-xl border border-line bg-white p-4">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400">
          Outline
        </p>
        <ul className="mt-3 space-y-1">
          {reportSections.map((s) => (
            <li
              key={s.name}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] ${
                s.status === "active"
                  ? "bg-moss-soft font-medium text-moss-deep"
                  : "text-stone-600"
              }`}
            >
              {s.status === "done" ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-moss" aria-hidden="true" />
              ) : s.status === "active" ? (
                <LoaderCircle className="size-3.5 shrink-0 animate-spin text-moss" aria-hidden="true" />
              ) : (
                <CircleDashed className="size-3.5 shrink-0 text-stone-300" aria-hidden="true" />
              )}
              {s.name}
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] text-stone-500">Sources</p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {["q3_actuals.xlsx", "board_template", "flux_history"].map((s) => (
              <span
                key={s}
                className="rounded-md bg-paper-soft px-1.5 py-1 font-mono text-[10px] text-stone-500"
              >
                {s}
              </span>
            ))}
          </p>
        </div>
      </aside>
      <div className="rounded-xl border border-line bg-white p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400">
              Draft · v0.9
            </p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-stone-950">
              Q3 FY26 Board Report
            </h3>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-stone-950 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-moss-deep"
          >
            Export PDF
          </button>
        </div>
        <div className="mt-5 space-y-4 text-[12.5px] leading-relaxed text-stone-700">
          <p>
            <span className="font-medium text-stone-950">3. Variance analysis.</span>{" "}
            Total operating expense of $23.1M ran $0.7M (+3.1%) ahead of the
            approved plan, driven primarily by unplanned cloud infrastructure
            spend associated with the data-platform migration ($0.17M) and
            contractor utilization ahead of forecast ($0.08M).
          </p>
          <div className="h-24 rounded-lg bg-gradient-to-b from-moss-soft to-white ring-1 ring-moss-soft" />
          <p>
            Partially offset by marketing efficiencies of $0.09M, as program
            spend was deferred into Q4. No budget amendments were processed
            during the quarter.
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800">
            <span className="font-semibold">Consistency check:</span> revenue
            figure in section 2 ($24.8M) matches q3_actuals.xlsx. One unresolved
            tie remains in the cash schedule — flagged for reviewer attention.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Templates ------------------------------- */

const templateCards = [
  { name: "Monthly board pack", meta: "Deck · 12 slides", uses: "1.2k runs" },
  { name: "Budget vs. actual memo", meta: "Report · 4 pages", uses: "860 runs" },
  { name: "Flux analysis write-up", meta: "Report · 2 pages", uses: "740 runs" },
  { name: "Audit PBC checklist", meta: "Tracker · 38 items", uses: "410 runs" },
  { name: "13-week cash review", meta: "Analysis · model", uses: "295 runs" },
  { name: "Investor update", meta: "Email + deck", uses: "230 runs" },
];

export function TemplatesView() {
  return (
    <div className="overflow-y-auto p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-stone-950">Team templates</p>
          <p className="text-[11.5px] text-stone-500">
            Save any prompt, outline, or workflow — then run it in one click
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-line bg-white px-3.5 py-2 text-[12px] font-medium text-stone-800 transition-colors hover:border-stone-300"
        >
          New template
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templateCards.map((t) => (
          <button
            key={t.name}
            type="button"
            className="group rounded-xl border border-line bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-paper-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-stone-500">
                {t.meta}
              </span>
              <span className="font-mono text-[10px] text-stone-400">{t.uses}</span>
            </div>
            <p className="mt-3 text-[13.5px] font-medium text-stone-900">{t.name}</p>
            <p className="mt-1 text-[12px] text-moss opacity-0 transition-opacity group-hover:opacity-100">
              Run template →
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Runs ---------------------------------- */

const runs = [
  {
    name: "Board Pack Agent",
    detail: "October board pack · 12 steps",
    models: "Claude + Gemini",
    time: "Today, 9:41",
    status: "done" as const,
  },
  {
    name: "Flux analysis sweep",
    detail: "All opex accounts · 41 checks",
    models: "DeepSeek → GPT",
    time: "Today, 8:15",
    status: "rerouted" as const,
  },
  {
    name: "Close checklist review",
    detail: "September close · 38 items",
    models: "Claude",
    time: "Yesterday",
    status: "done" as const,
  },
  {
    name: "QoE question list",
    summary: true,
    detail: "Project Meridian data room · 24 questions",
    models: "GPT",
    time: "Mon, 16:02",
    status: "done" as const,
  },
];

export function RunsView() {
  return (
    <div className="overflow-y-auto p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-stone-950">Workflow history</p>
          <p className="text-[11.5px] text-stone-500">
            Every run is logged — inputs, model, outputs, and reviewer
          </p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-stone-400">
          <Clock className="size-3" aria-hidden="true" /> Last 7 days
        </span>
      </div>
      <ul className="space-y-2.5">
        {runs.map((r) => (
          <li
            key={r.name}
            className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                  r.status === "rerouted"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-moss-soft text-moss-deep"
                }`}
              >
                {r.status === "rerouted" ? (
                  <Route className="size-4" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-[13px] font-medium text-stone-900">
                  {r.name}
                  {r.status === "rerouted" && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9.5px] font-medium text-amber-700 ring-1 ring-amber-200">
                      MODEL REROUTED
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11.5px] text-stone-500">{r.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-11 sm:pl-0">
              <span className="font-mono text-[10.5px] text-stone-500">{r.models}</span>
              <span className="font-mono text-[10.5px] text-stone-400">{r.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
