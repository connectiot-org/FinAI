"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessagesSquare, GitCompareArrows, Pin } from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { aiModels } from "@/lib/site-data";

const workflow = [
  {
    icon: MessagesSquare,
    title: "Chat in one thread",
    desc: "Start a task with any model. Attach spreadsheets, statements, and policies.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare answers",
    desc: "Run the same prompt across two models side-by-side when the stakes are high.",
  },
  {
    icon: Pin,
    title: "Keep the best output",
    desc: "Pin the version you trust — full history stays attached to the thread.",
  },
];

export function MultiModel() {
  const reduce = useReducedMotion();

  return (
    <section id="models" className="scroll-mt-24 py-20 md:py-28" aria-label="Multi-model AI">
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionHeading
            eyebrow="Multi-model workspace"
            title={
              <>
                One conversation.{" "}
                <span className="font-serif-accent font-normal text-moss">Every</span>{" "}
                frontier model.
              </>
            }
            description="No more tab-hopping between AI tools or losing your place mid-task. In Fintra, GPT, Claude, Gemini, DeepSeek, and other supported models live in the same thread — switch mid-conversation without losing context."
          />
          <Reveal delay={0.1} className="lg:justify-self-end">
            <a
              href="/agent"
              className="group inline-flex items-center gap-2 text-[14.5px] font-medium text-stone-900"
            >
              Explore all supported models
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full border border-stone-300 transition-colors group-hover:border-stone-950 group-hover:bg-stone-950 group-hover:text-white"
              >
                <ArrowRight className="size-3.5" />
              </span>
            </a>
          </Reveal>
        </div>

        {/* Model cards */}
        <Stagger className="mt-12 grid grid-cols-2 gap-4 md:mt-14 lg:grid-cols-4">
          {aiModels.map((m) => (
            <StaggerItem key={m.id}>
              <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-card md:p-6">
                <span
                  aria-hidden="true"
                  className={`grid size-10 place-items-center rounded-xl text-[13px] font-semibold ${m.accentClass}`}
                >
                  {m.mark}
                </span>
                <h3 className="mt-4 text-[16.5px] font-semibold tracking-tight text-stone-950">
                  {m.family}
                </h3>
                <p className="text-[11.5px] font-medium uppercase tracking-wide text-stone-400">
                  {m.vendor}
                </p>
                <p className="mt-3 inline-flex w-fit rounded-full bg-paper-soft px-2.5 py-1 text-[11px] font-medium text-stone-600">
                  {m.strength}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{m.blurb}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Thread switching visual */}
        <Reveal delay={0.1} className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
              {/* Thread demo */}
              <div className="border-b border-line p-6 md:border-b-0 md:border-r md:p-8">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-stone-400">
                  Same thread · same context
                </p>
                <div className="mt-5 space-y-3.5">
                  {[
                    { m: "Claude", text: "Reviewed the 48-page credit agreement…", active: false },
                    { m: "GPT", text: "Now stress-testing the covenant model…", active: true },
                    { m: "DeepSeek", text: "Sweeping all 214 line items overnight…", active: false },
                  ].map((row, i) => (
                    <motion.div
                      key={row.m}
                      initial={reduce ? false : { opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                        row.active
                          ? "border-moss/25 bg-moss-soft/60"
                          : "border-line bg-paper-soft/40"
                      }`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-stone-950 text-[10px] font-semibold text-white">
                        {row.m.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-stone-900">{row.m}</p>
                        <p className="truncate text-[11.5px] text-stone-500">{row.text}</p>
                      </div>
                      {row.active && (
                        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-2 py-1 font-mono text-[9.5px] font-medium text-moss-deep ring-1 ring-moss/20">
                          <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-moss" />
                          LIVE
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="mt-5 text-[12.5px] leading-relaxed text-stone-500">
                  Switch models mid-task — files, prior answers, and your notes
                  travel with the thread where technically possible.
                </p>
              </div>

              {/* Workflow steps */}
              <div className="p-6 md:p-8">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-stone-400">
                  How teams use it
                </p>
                <ol className="mt-5 space-y-6">
                  {workflow.map((s, i) => (
                    <li key={s.title} className="relative flex gap-4">
                      {i < workflow.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[17px] top-10 h-[calc(100%-8px)] w-px bg-line"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-paper-soft"
                      >
                        <s.icon className="size-4 text-stone-700" />
                      </span>
                      <div>
                        <p className="text-[14.5px] font-medium text-stone-950">
                          <span className="mr-1.5 font-mono text-[11px] text-stone-400">
                            0{i + 1}
                          </span>
                          {s.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                          {s.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
