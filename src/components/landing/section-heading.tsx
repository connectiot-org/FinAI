import type { ReactNode } from "react";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Shared eyebrow / title / description block for every section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignCls =
    align === "center" ? "items-center text-center mx-auto" : "items-start";
  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignCls} ${className}`}>
      <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-moss">
        <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-moss" />
        {eyebrow}
      </p>
      <h2 className="display text-balance text-[32px] sm:text-[42px] md:text-[52px]">
        {title}
      </h2>
      {description && (
        <p className="max-w-xl text-pretty text-[16px] leading-relaxed text-ink-soft md:text-[17px]">
          {description}
        </p>
      )}
    </Reveal>
  );
}

/** Standard max-width container. */
export function Container({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`mx-auto w-full max-w-[1180px] px-5 md:px-8 ${className}`}>
      {children}
    </div>
  );
}
