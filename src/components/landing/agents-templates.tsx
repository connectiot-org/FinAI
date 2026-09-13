"use client";

import {
  TrendingUp,
  ListChecks,
  ClipboardCheck,
  Search,
  Presentation,
  FileText,
  ArrowRight,
  Play,
  Zap,
  Workflow,
} from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Stagger, StaggerItem, Reveal } from "./reveal";
import { agents, templates } from "@/lib/site-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  checklist: ListChecks,
  audit: ClipboardCheck,
  search: Search,
  deck: Presentation,
  file: FileText,
};

export function Agents() {
  return (
    <section
      id="agents"
      className="scroll-mt-24 border-y border-line bg-paper-soft/60 py-20 md:py-28"
      aria-label="Finance AI agents"
    >
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionHeading
            eyebrow="Finance AI agents"
            title={
              <>
                Hire agents for the work{" "}
                <span className="font-serif-accent font-normal text-moss">you repeat</span>.
              </>
            }
            description="Agents combine your instructions, templates, and chosen models into semi-autonomous coworkers. They prepare the first pass — you keep the final say. Every output arrives as a draft with sources attached."
          />
          <Reveal delay={0.1} className="lg:justify-self-end">
            <p className="max-w-xs rounded-2xl border border-line bg-white p-4 text-[12.5px] leading-relaxed text-ink-soft shadow-card">
              <span className="font-medium text-stone-950">Human-in-the-loop by design.</span>{" "}
              Agents propose, you approve. Nothing posts, sends, or files itself.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {agents.map((a) => {
            const Icon = iconMap[a.icon] ?? FileText;
            return (
              <StaggerItem key={a.name}>
                <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span
                      aria-hidden="true"
                      className="grid size-10 place-items-center rounded-xl bg-stone-950 text-white transition-colors group-hover:bg-moss-deep"
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
                      {a.role}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-stone-950">
                    {a.name}
                  </h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
                    {a.description}
                  </p>
                  <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 text-[12px] font-medium text-moss-deep">
                    <Zap className="size-3.5" aria-hidden="true" />
                    Output: {a.output}
                  </p>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}

/* ------------------------- Templates & workflows -------------------------- */

const workflowSteps = [
  { label: "Trigger", value: "1st business day, 8:00" },
  { label: "Step 1", value: "Pull ERP export → normalize" },
  { label: "Step 2", value: "Run flux analysis (DeepSeek)" },
  { label: "Step 3", value: "Draft variance memo (GPT)" },
  { label: "Step 4", value: "Consistency sweep + flags" },
  { label: "Review", value: "Assign to: you + controller" },
];

export function TemplatesWorkflows() {
  return (
    <section
      id="templates"
      className="scroll-mt-24 py-20 md:py-28"
      aria-label="Reusable templates and workflows"
    >
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Templates & workflows"
          title={
            <>
              Turn recurring work into{" "}
              <span className="font-serif-accent font-normal text-moss">one click</span>.
            </>
          }
          description="The monthly board pack, the flux memo, the audit checklist — you do the same things every month. Save any prompt, outline, or multi-step process once, then run it forever with your files and your format."
        />

        <div className="mt-12 grid gap-6 md:mt-14 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Template gallery */}
          <Reveal>
            <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card md:p-7">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[14.5px] font-semibold text-stone-950">
                  <Workflow className="size-4 text-moss" aria-hidden="true" />
                  Template gallery
                </p>
                <span className="font-mono text-[10.5px] text-stone-400">8 of 120+</span>
              </div>
              <ul className="mt-5 divide-y divide-line">
                {templates.map((t) => (
                  <li
                    key={t.name}
                    className="group flex cursor-default items-center justify-between gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-paper-soft/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-stone-900">
                        {t.name}
                      </p>
                      <p className="text-[11.5px] text-stone-500">{t.uses}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-md bg-paper-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-stone-500">
                        {t.category}
                      </span>
                      <ArrowRight
                        className="size-3.5 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-moss"
                        aria-hidden="true"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Workflow builder */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-2xl border border-line bg-stone-950 p-6 text-white shadow-card md:p-7">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[14.5px] font-semibold">
                  <Play className="size-4 text-emerald-400" aria-hidden="true" />
                  Saved workflow: Monthly flux memo
                </p>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-400/25">
                  RUNS MONTHLY
                </span>
              </div>
              <ol className="mt-6 flex-1 space-y-0">
                {workflowSteps.map((s, i) => (
                  <li key={s.label} className="relative flex gap-3.5 pb-5 last:pb-0">
                    {i < workflowSteps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[7px] top-5 h-full w-px bg-white/10"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`mt-1 size-3.5 shrink-0 rounded-full ring-4 ${
                        s.label === "Review"
                          ? "bg-emerald-400 ring-emerald-400/15"
                          : "bg-stone-600 ring-white/5"
                      }`}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 flex-1">
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-stone-500">
                        {s.label}
                      </p>
                      <p className="text-[12.5px] text-stone-300">{s.value}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-4 text-[12px] leading-relaxed text-stone-400">
                Reuse means leverage: your workflow already knows the sources,
                the model for each step, and who reviews the output.
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
