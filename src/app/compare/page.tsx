import type { Metadata } from "next";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Comparison } from "@/components/landing/comparison";
import { Footer } from "@/components/landing/cta-footer";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Compare FInAI — Multi-Model vs. Single-Assistant Tools",
  description:
    "See how FInAI compares to traditional FP&A suites, research assistants, and close tools. Transparent, fact-checked comparison matrix across models, evidence, and workflow depth.",
};

export default function ComparePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        <main className="flex-1 pt-24 md:pt-28">
          {/* Header Banner */}
          <section className="border-b border-line bg-paper-soft/40 py-12 md:py-16">
            <div className="mx-auto max-w-[1180px] px-5 md:px-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1 text-[12px] font-medium text-stone-600">
                Independent Benchmark
              </span>
              <h1 className="mt-4 text-[34px] font-bold tracking-tight text-stone-950 md:text-[48px]">
                How <span className="font-serif-accent font-normal text-moss">FInAI</span> Compares
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-soft md:text-[18px]">
                Research platforms, close software, and FP&A tools each solve a single slice of finance. FInAI is the unifying financial workspace above them: every frontier model, every workflow, one place.
              </p>
            </div>
          </section>

          {/* Full Comparison Matrix */}
          <Comparison />

          {/* Cross Link to Security */}
          <section className="border-t border-line bg-white py-12">
            <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 px-5 md:flex-row md:px-8">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-moss">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-stone-950">
                    Evaluating Enterprise Security &amp; Compliance?
                  </h3>
                  <p className="text-[13px] text-ink-soft">
                    Review our tenant isolation, encryption at rest, and zero model-training guarantees.
                  </p>
                </div>
              </div>
              <Link
                href="/security"
                className="group inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-[13.5px] font-medium text-stone-900 transition-colors hover:border-stone-950 hover:bg-stone-950 hover:text-white"
              >
                <span>Read Security Architecture</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
