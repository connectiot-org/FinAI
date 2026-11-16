import { useEffect, useId, type ReactElement, type CSSProperties } from "react";

/**
 * Premium scroll-reveal without any dependency: clones its single child
 * element (no extra DOM wrapper, so measured layouts and `>` selectors keep
 * working) and plays a fade-up transition the first time it enters the
 * viewport. Motion is disabled automatically via CSS for users who prefer
 * reduced motion, and elements already in view reveal immediately.
 */
export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactElement;
  delay?: number;
}) {
  const key = useId();
  useEffect(() => {
    const node = document.querySelector<HTMLElement>(`[data-reveal="${key}"]`);
    if (!node) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.classList.add("is-revealed");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [key]);
  const child = children as ReactElement<Record<string, unknown>>;
  return {
    ...child,
    props: {
      ...child.props,
      "data-reveal": key,
      className: `${(child.props as { className?: string }).className ?? ""} reveal-item`.trim(),
      style: {
        ...((child.props as { style?: CSSProperties }).style ?? {}),
        "--reveal-delay": `${delay}ms`,
      } as CSSProperties,
    },
  };
}
