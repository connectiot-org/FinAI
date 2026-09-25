import type { Metadata } from "next";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Security } from "@/components/landing/routing-security";
import { Footer } from "@/components/landing/cta-footer";
import { ArrowRight, Table2, ShieldCheck, Lock, CheckCircle2, FileCheck2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Trust — FInAI Enterprise Governance",
  description:
    "Finance data demands finance-grade controls. Discover FInAI's SOC 2-aligned architecture, tenant isolation, SAML SSO, and zero-training model guarantees.",
};

export default function SecurityPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        <main className="flex-1 pt-24 md:pt-28">
          {/* Header Banner */}
          <section className="border-b border-line bg-paper-soft/40 py-12 md:py-16">
            <div className="mx-auto max-w-[1180px] px-5 md:px-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1 text-[12px] font-medium text-emerald-800">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Enterprise Trust &amp; Governance
              </span>
              <h1 className="mt-4 text-[34px] font-bold tracking-tight text-stone-950 md:text-[48px]">
                Built for teams who get <span className="font-serif-accent font-normal text-moss">audited</span>.
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-soft md:text-[18px]">
                Financial intelligence requires strict cryptographic boundaries. FInAI enforces least privilege, tenant-isolated memory, and administrative control over model access.
              </p>
            </div>
          </section>

          {/* Core Security Component */}
          <Security />

          {/* Deep Trust Pillars */}
          <section className="border-y border-line bg-white py-16 md:py-20">
            <div className="mx-auto max-w-[1180px] px-5 md:px-8">
              <div className="text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-400">
                  Audit-Ready Infrastructure
                </p>
                <h2 className="mt-2 text-[26px] font-bold text-stone-950 md:text-[32px]">
                  Four Immutable Commitments to Your CFO &amp; CISO
                </h2>
              </div>

              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: Lock,
                    title: "Zero Model Training",
                    desc: "Your general ledger, financial statements, and employee salaries are never sent to train AI models under any provider contract.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "End-to-End Encryption",
                    desc: "All client traffic is protected by TLS 1.3 in transit and AES-256 at rest, with isolated cryptographic key management.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Deterministic Grounding",
                    desc: "Every calculation requires formula bridges and source file provenance before publication, eliminating phantom numbers.",
                  },
                  {
                    icon: FileCheck2,
                    title: "Complete Audit Trail",
                    desc: "Full session logs record which user queried which line item, with which model, and when — ready for external audit review.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col rounded-2xl border border-line bg-paper-soft/40 p-6 transition-all hover:shadow-card"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-white border border-line text-moss shadow-xs">
                      <item.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-[16px] font-semibold text-stone-950">{item.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cross Link to Compare */}
          <section className="bg-paper-soft/60 py-12">
            <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 px-5 md:flex-row md:px-8">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-white border border-line text-stone-800">
                  <Table2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-stone-950">
                    Comparing Financial AI Vendors?
                  </h3>
                  <p className="text-[13px] text-ink-soft">
                    Review how FInAI matches up against Hebbia, AlphaSense, Datarails, and Numeric.
                  </p>
                </div>
              </div>
              <Link
                href="/compare"
                className="group inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-[13.5px] font-medium text-stone-900 transition-colors hover:border-stone-950 hover:bg-stone-950 hover:text-white"
              >
                <span>View Comparison Matrix</span>
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
