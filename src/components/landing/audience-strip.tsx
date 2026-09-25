"use client";

import { Container } from "./section-heading";
import { Reveal } from "./reveal";

const audiences = [
  "Financial Analysts",
  "Accountants",
  "Auditors",
  "FP&A Teams",
  "Consultants",
  "Investment Professionals",
  "CFO / Finance Teams",
  "Researchers",
];

/** Audience marquee — communicates who FInAI is built for. */
export function AudienceStrip() {
  const row = [...audiences, ...audiences];
  return (
    <section aria-label="Who FInAI is built for" className="py-14 md:py-20">
      <Container>
        <Reveal>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-stone-400">
            Built for the people who run the numbers
          </p>
        </Reveal>
        <div className="mask-fade-x mt-7 overflow-hidden">
          <div
            className="animate-marquee flex w-max items-center gap-3 pr-3 motion-reduce:animate-none"
            aria-hidden="true"
          >
            {row.map((a, i) => (
              <span
                key={`${a}-${i}`}
                className="whitespace-nowrap rounded-full border border-line bg-white px-5 py-2.5 text-[14px] font-medium text-stone-600"
              >
                {a}
              </span>
            ))}
          </div>
          <ul className="sr-only">
            {audiences.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
