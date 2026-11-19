import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { sessionEnabled } from "../lib/api";
import { readSession } from "../lib/session";
import { readWorkspaceSession } from "../lib/workspace-session";

// Route guard for the demo workspace dashboard (founder direction,
// 19 November 2026). /overview, /demo/payables/*, the accounting, receivables,
// payables, banking, close, reports and settings routes used to render for
// any anonymous visitor that had the URL. Access now requires one of:
//
//   1. a browser-local workspace session — opened ONLY by the provisioned
//      log-in entry after the owner-provisioned password verified
//      (workspace-session.ts), or
//   2. on session-mode deployments (VITE_AUTH_MODE=session, the Vercel
//      build), a live backend /auth session — a signed-in paying customer
//      is more authenticated than the demo log-in, so the guard defers to
//      the same session check the private pages use.
//
// Anonymous visitors are redirected to /login, which carries the attempted
// location so the sign-in returns them to the page they asked for. The
// public marketing pages, the request-a-demo funnel, /login itself and the
// public stateless chat at /demo/assistant stay open by design.

type Gate =
  | { state: "open" }
  | { state: "checking" }
  | { state: "closed"; message?: string };

export function RequireWorkspaceSession({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [gate, setGate] = useState<Gate>(() => {
    if (readWorkspaceSession()) return { state: "open" };
    // Demo deployments never touch the network for this guard; only the
    // session-mode build asks the backend whether a customer is signed in.
    return sessionEnabled ? { state: "checking" } : { state: "closed" };
  });
  useEffect(() => {
    // Sign-in and sign-out in this tab re-evaluate the guard immediately.
    const refresh = () => {
      if (readWorkspaceSession()) setGate({ state: "open" });
      else if (sessionEnabled) setGate({ state: "checking" });
      else setGate({ state: "closed" });
    };
    window.addEventListener("finai-workspace-session", refresh);
    return () => window.removeEventListener("finai-workspace-session", refresh);
  }, []);
  useEffect(() => {
    if (gate.state !== "checking") return;
    const controller = new AbortController();
    let active = true;
    readSession(controller.signal)
      .then(() => {
        if (active) setGate({ state: "open" });
      })
      .catch(() => {
        if (active) setGate({ state: "closed" });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [gate.state]);
  useEffect(() => {
    // A backend session that expired elsewhere (other tab, server restart)
    // must not keep an open gate alive when no local session exists.
    if (readWorkspaceSession()) return;
    const expired = () => {
      if (!readWorkspaceSession())
        setGate(sessionEnabled ? { state: "checking" } : { state: "closed" });
    };
    window.addEventListener("finai-session-expired", expired);
    return () => window.removeEventListener("finai-session-expired", expired);
  }, []);
  if (gate.state === "checking")
    return <p role="status">Checking session…</p>;
  if (gate.state === "closed")
    return (
      <Navigate
        replace
        to="/login"
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  return <>{children}</>;
}
