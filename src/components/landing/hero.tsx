"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { ProductMockup } from "./product-mockup";
import { Container } from "./section-heading";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

function FloatingChip({
  className,
  delay,
  children,
  label,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
  label: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-label={label}
      className={`absolute z-10 hidden items-center gap-2 rounded-xl border border-line bg-white/95 px-3.5 py-2.5 text-[12px] font-medium text-stone-800 shadow-float backdrop-blur lg:flex ${className}`}
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
      transition={{
        opacity: { delay, duration: 0.7, ease },
        scale: { delay, duration: 0.7, ease },
        y: reduce
          ? { delay, duration: 0.7, ease }
          : { delay, duration: 5.5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const anim = (delay: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.75, ease },
  });

  return (
    <section id="top" className="relative overflow-hidden pt-32 md:pt-40" aria-label="Introduction">
      {/* Backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-fade-b absolute inset-0" />
        <div className="absolute left-1/2 top-[-320px] h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-moss-soft/70 blur-[120px]" />
        <div className="absolute right-[8%] top-[180px] h-[300px] w-[300px] rounded-full bg-amber-100/40 blur-[100px]" />
      </div>

      <Container className="relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div {...anim(0)}>
            <a
              href="#models"
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-medium text-stone-700 shadow-card backdrop-blur transition-colors hover:border-stone-300"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-950 px-2.5 py-1 text-[11px] font-medium text-white">
                <Sparkles className="size-3" aria-hidden="true" />
                New
              </span>
              GPT, Claude, Gemini &amp; DeepSeek — in one workspace
              <ArrowRight
                className="size-3.5 text-stone-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </motion.div>

          <motion.h1
            {...anim(0.08)}
            className="display mt-7 text-balance text-[42px] sm:text-[58px] md:text-[72px]"
          >
            Multiple AI models.{" "}
            <span className="whitespace-nowrap">
              One{" "}
              <span className="font-serif-accent font-normal text-moss">
                finance
              </span>
            </span>{" "}
            workspace.
          </motion.h1>

          <motion.p
            {...anim(0.16)}
            className="mt-6 max-w-xl text-pretty text-[16.5px] leading-relaxed text-ink-soft md:text-[18.5px]"
          >
            FInAI brings every frontier AI model, your financial data, and your
            recurring workflows into one professional workspace — so analysts,
            accountants, and finance teams stop juggling tabs and start
            finishing work.
          </motion.p>

          <motion.div
            {...anim(0.24)}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a
              href="/agent"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-stone-950 px-7 text-[15px] font-medium text-white transition-all hover:bg-moss-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              Start free
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="#demo"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-7 text-[15px] font-medium text-stone-900 backdrop-blur transition-colors hover:border-stone-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              <PlayCircle className="size-4.5 text-stone-500" aria-hidden="true" />
              See the platform
            </a>
          </motion.div>

          <motion.ul
            {...anim(0.32)}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-stone-500"
            aria-label="Getting started facts"
          >
            {[
              "No credit card required",
              "Works with Excel, PDF & CSV",
              "Set up in minutes",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-moss" aria-hidden="true" />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Product mockup */}
        <div id="demo" className="relative mx-auto mt-16 max-w-[1020px] scroll-mt-28 md:mt-20">
          <FloatingChip
            className="-left-14 top-16 xl:-left-24"
            delay={0.9}
            label="Workflow status: model rerouted automatically"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-md bg-amber-50 text-amber-700"
            >
              <Sparkles className="size-3.5" />
            </span>
            Rerouted to GPT — credit limit reached on Claude
          </FloatingChip>
          <FloatingChip
            className="-right-12 top-32 xl:-right-20"
            delay={1.1}
            label="Report exported"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-md bg-moss-soft text-moss-deep"
            >
              <FileSpreadsheet className="size-3.5" />
            </span>
            Q3 board pack exported · 12 slides
          </FloatingChip>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease }}
          >
            <ProductMockup />
          </motion.div>

          {/* Fade into next section */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-b from-transparent to-paper"
          />
        </div>
      </Container>
    </section>
  );
}
