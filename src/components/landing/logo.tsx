import Link from "next/link";

/** FInAI — Σ mark + wordmark. */
export function Logo({
  className = "",
  mark = false,
  dark = false,
  href = "/",
}: {
  className?: string;
  mark?: boolean;
  dark?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="FInAI home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`grid size-8 place-items-center rounded-lg ${
          dark ? "bg-white text-stone-950" : "bg-stone-950 text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none">
          <path
            d="M5.5 5.5h13L12 12l6.5 6.5h-13L12 12 5.5 5.5z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!mark && (
        <span
          className={`text-[19px] font-semibold tracking-[-0.02em] ${
            dark ? "text-white" : "text-stone-950"
          }`}
        >
          FInAI
        </span>
      )}
    </Link>
  );
}
