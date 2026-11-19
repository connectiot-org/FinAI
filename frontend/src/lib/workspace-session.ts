// Browser-local workspace session for the demo dashboard routes.
//
// Founder direction (19 November 2026): a deep link such as /overview or
// /demo/payables/invoices used to open the workspace for anyone, which made
// the provisioned log-in pointless. Those routes are now wrapped in
// RequireWorkspaceSession, and the only thing that opens a session is a
// successful verification against the owner-provisioned sign-ins (see
// workspace-access.ts). The record deliberately lives in sessionStorage —
// NOT localStorage — so closing the tab ends the session and a fresh visit
// always lands on the log-in page first. Session-mode deployments (the
// Vercel build) additionally accept a live backend /auth session inside the
// guard itself; this module is only the browser-local half.
//
// The record holds no secret: it is a marker that the provisioned password
// was verified in this tab. Like the rest of the browser-only demo it cannot
// protect the synthetic Northstar data from someone with devtools access —
// its job is to keep casual visitors and shared links on the log-in funnel.

export type WorkspaceSession = {
  /** normalized email of the provisioned sign-in that opened the session */
  email: string;
  /** epoch milliseconds when the session was opened */
  openedAt: number;
};

const KEY = "finai-workspace-session-v1";
// Twelve hours: long enough for a working day, short enough that an abandoned
// open tab does not stay "signed in" forever.
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

function isWorkspaceSession(value: unknown): value is WorkspaceSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.email === "string" &&
    v.email.length > 0 &&
    v.email.length <= 100 &&
    typeof v.openedAt === "number" &&
    Number.isFinite(v.openedAt)
  );
}

function notify() {
  window.dispatchEvent(new Event("finai-workspace-session"));
}

/** The open workspace session in this tab, or null when expired/absent. */
export function readWorkspaceSession(): WorkspaceSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(KEY);
      return null;
    }
    if (!isWorkspaceSession(parsed)) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    const value = parsed;
    if (Date.now() - value.openedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return value;
  } catch {
    // Storage unavailable (private mode/quota): treat as signed out.
    return null;
  }
}

/** Called by the log-in entry after a provisioned password verified. */
export function openWorkspaceSession(email: string): void {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ email, openedAt: Date.now() } satisfies WorkspaceSession),
    );
  } catch {
    // Without storage the guard cannot see the session; the log-in still
    // worked, but deep links will ask again. Fail soft rather than lock out.
  }
  notify();
}

/** Sign out of the demo workspace (Shell menu / tests). */
export function closeWorkspaceSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
  notify();
}
