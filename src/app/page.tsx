import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AudienceStrip } from "@/components/landing/audience-strip";
import { MultiModel } from "@/components/landing/multi-model";
import { Analysis, ReportBuilder } from "@/components/landing/analysis-report";
import { ErrorChecking, PresentationBuilder } from "@/components/landing/checking-presentations";
import { Agents, TemplatesWorkflows } from "@/components/landing/agents-templates";
import { ModelRouting } from "@/components/landing/routing-security";
import { Footer } from "@/components/landing/cta-footer";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-stone-950 focus:px-5 focus:py-2.5 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          <Hero />
          <AudienceStrip />
          <MultiModel />
          <Analysis />
          <ReportBuilder />
          <ErrorChecking />
          <PresentationBuilder />
          <Agents />
          <TemplatesWorkflows />
          <ModelRouting />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
