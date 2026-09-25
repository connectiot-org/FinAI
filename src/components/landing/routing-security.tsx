"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { User, Building2, Check, ArrowRight, ShieldCheck, ScrollText, SlidersHorizontal, RefreshCw } from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Reveal } from "./reveal";

type Phase = "normal" | "limit" | "rerouted";

const phases: {
  id: Phase;
  chip: string;
  chipCls: string;
  note: string;
}[] = [
  {
    id: "normal",
    chip: "Task running on Claude",
    chipCls: "bg-white/10 text-white ring-white/20",
    note: "Your task is routed to the model best suited for it.",
  },
  {
    id: "limit",
    chip: "Credit limit reached on Claude",
    chipCls: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
    note: "If a model reaches an applicable usage or credit limitation, FInAI detects it mid-task.",
  },
  {
    id: "rerouted",
    chip: "Continued on GPT — context preserved",
    chipCls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
    note: "The task continues on another suitable available model, carrying workflow context forward where technically possible.",
  },
];

const guarantees = [
  {
    icon: SlidersHorizontal,
    title: "Task-aware selection",
    desc: "Admins set which models are preferred for which task types — document review, long sweeps, quick drafts.",
  },
  {
    icon: RefreshCw,
    title: "Usage-aware failover",
    desc: "When a model hits an applicable usage or credit limitation, work continues on another suitable model instead of stopping.",
  },
  {
    icon: ScrollText,
    title: "A complete audit trail",
    desc: "Every answer records which model produced it, so reviews and audits stay clean.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    desc: "Routing rules, model availability, and spend limits are governed by your workspace admins.",
  },
];

function RoutingDiagram() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("normal");

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setPhase((p) =>
        p === "normal" ? "limit" : p === "limit" ? "rerouted" : "normal"
      );
    }, 2600);
    return () => clearInterval(t);
  }, [reduce]);

  const active = phases.find((p) => p.id === phase)!;

  const modelNode = (name: string, state: "idle" | "limit" | "reroute" | "active") => {
    const cls =
      state === "active"
        ? "border-white/30 bg-white/10 text-white"
        : state === "limit"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
        : state === "reroute"
        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
        : "border-white/10 bg-white/[0.03] text-stone-500";
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-medium transition-all duration-500 ${cls}`}
      >
        {name}
        {state === "limit" && (
          <span className="font-mono text-[9px] uppercase tracking-wider">limit</span>
        )}
        {state === "reroute" && <Check className="size-3.5" aria-hidden="true" />}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="grid items-center gap-4 md:grid-cols-[auto_1fr_auto]">
        {/* User */}
        <div className="flex flex-col items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-2xl bg-white text-stone-950"
          >
            <User className="size-5" />
          </span>
          <p className="text-[11px] font-medium text-stone-400">You</p>
        </div>

        {/* Connector + workspace */}
        <div className="flex flex-col items-center gap-2">
          <svg
            viewBox="0 0 80 8"
            className="hidden h-2 w-20 md:block"
            aria-hidden="true"
          >
            <line x1="0" y1="4" x2="80" y2="4" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 4" />
          </svg>
          <div className="w-full rounded-2xl border border-white/15 bg-white/[0.06] p-4 md:p-5">
            <div className="flex items-center justify-center gap-2.5">
              <Building2 className="size-4 text-white" aria-hidden="true" />
              <p className="text-[14px] font-semibold text-white">
                Finance AI workspace
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { name: "Claude", state: phase === "limit" ? "limit" : phase === "rerouted" ? "idle" : "active" },
                { name: "GPT", state: phase === "rerouted" ? "reroute" : "idle" },
                { name: "Gemini", state: "idle" },
                { name: "DeepSeek", state: "idle" },
              ].map((m) => (
                <div key={m.name}>
                  {modelNode(m.name, m.state as "idle" | "limit" | "reroute" | "active")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.06]"
          >
            <ArrowRight className="size-5 text-white" />
          </span>
          <p className="text-[11px] font-medium text-stone-400">Finished work</p>
        </div>
      </div>

      {/* Status line */}
      <div aria-live="polite" className="mt-6 min-h-[76px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-start gap-2.5"
          >
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium ring-1 ${active.chipCls}`}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {active.chip}
            </span>
            <p className="max-w-lg text-[13px] leading-relaxed text-stone-400">
              {active.note}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ModelRouting() {
  return (
    <section
      id="routing"
      className="scroll-mt-24 bg-stone-950 py-20 text-white md:py-28"
      aria-label="Intelligent model routing"
    >
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="flex max-w-xl flex-col gap-4">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
              <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-emerald-400" />
              Intelligent routing
            </p>
            <h2 className="display text-balance text-[32px] sm:text-[42px] md:text-[52px]">
              Work keeps{" "}
              <span className="font-serif-accent font-normal text-emerald-400">
                moving
              </span>{" "}
              — even at the limit.
            </h2>
            <p className="text-pretty text-[16px] leading-relaxed text-stone-400">
              You send a task. FInAI picks a suitable model and gets to work. If
              that model reaches an applicable usage or credit limitation, the
              platform is designed to continue on another suitable available
              model — preserving the relevant workflow context where technically
              possible — so a busy month-end doesn't become a hard stop.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:justify-self-end lg:max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-500">
                The routing principle
              </p>
              <p className="mt-3 flex items-center gap-2 text-[13.5px] font-medium text-white">
                You
                <ArrowRight className="size-3.5 text-stone-500" aria-hidden="true" />
                Finance AI workspace
                <ArrowRight className="size-3.5 text-stone-500" aria-hidden="true" />
                Models
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-stone-400">
                One entry point in, many models out — with failover designed to
                preserve your context.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-12">
          <RoutingDiagram />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map((g, i) => (
            <Reveal key={g.title} delay={0.08 * i}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <g.icon className="size-5 text-emerald-400" aria-hidden="true" />
                <p className="mt-4 text-[14.5px] font-medium text-white">{g.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-stone-400">
                  {g.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------- Security -------------------------------- */

const securityItems = [
  {
    title: "Encrypted, always",
    desc: "Data is encrypted in transit and at rest across the workspace.",
  },
  {
    title: "SSO & role-based access",
    desc: "SAML SSO, SCIM provisioning, and granular roles per team and template.",
  },
  {
    title: "Your data, your models' boundaries",
    desc: "Workspace data is not used to train third-party models under FInAI's enterprise configuration.",
  },
  {
    title: "Full audit logs",
    desc: "Who ran what, with which model, on which files — exportable for audit.",
  },
  {
    title: "Model-level governance",
    desc: "Admins approve which AI models and providers are allowed for which workflows.",
  },
  {
    title: "Residency options",
    desc: "Choose where your workspace data is stored to meet internal policy.",
  },
];

export function Security() {
  return (
    <section
      id="security"
      className="scroll-mt-24 border-b border-line bg-paper-soft/60 py-20 md:py-28"
      aria-label="Security and trust"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Security & trust"
              title={
                <>
                  Built for teams who get{" "}
                  <span className="font-serif-accent font-normal text-moss">
                    audited
                  </span>
                  .
                </>
              }
              description="Finance data demands finance-grade controls. FInAI is designed around least privilege, full traceability, and admin governance — the defaults your security review will ask about."
            />
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap gap-2.5">
                {[
                  "SOC 2-aligned controls",
                  "GDPR-ready processes",
                  "Encryption in transit & at rest",
                  "SSO / SAML",
                ].map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] font-medium text-stone-700"
                  >
                    <ShieldCheck className="size-3.5 text-moss" aria-hidden="true" />
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
                Compliance artifacts and security documentation are available on
                request during procurement.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {securityItems.map((s, i) => (
              <Reveal key={s.title} delay={0.05 * i}>
                <div className="h-full rounded-2xl border border-line bg-white p-5">
                  <p className="flex items-center gap-2 text-[14px] font-medium text-stone-950">
                    <ShieldCheck className="size-4 shrink-0 text-moss" aria-hidden="true" />
                    {s.title}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
