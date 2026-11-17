import { BrandMark } from "../../components/shared/BrandMark";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { command, useAppDispatch } from "../../store";
import {
  clearLegacyAccountRecord,
  normalizeEmail,
  readAccessSnapshot,
  verifyWorkspaceAccess,
} from "../../lib/workspace-access";
import { DEMO_FORM_URL } from "./demo";
import "../../styles/log-in.css";

// Derive a workspace persona from the entered email so the dashboard greets a
// person, not an address ("jordan.lee@acme.com" -> "Jordan Lee").
function personaFromEmail(email: string) {
  const words = email
    .split("@")[0]
    .replace(/[._+-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return words.join(" ").slice(0, 40);
}

// Public log-in entry. The founder direction (17 November 2026) closes the
// free entry for good: the workspace opens ONLY for the Gmail sign-ins the
// company owner provisioned (see src/lib/provisioned-credentials.ts) and
// handed credentials to — the Rillet-style model. Nobody can create an
// account here; an unprovisioned visitor is refused and invited to book a
// demo instead. The entered password is verified in this browser against a
// salted PBKDF2 hash (never stored or sent in clear text), and repeated
// wrong passwords lock the entry temporarily. (Provisioned customers in
// session mode still reach their own gated workspace directly at
// /workspace/overview.)
export function LogInPage() {
  const dispatch = useAppDispatch(),
    navigate = useNavigate();
  const [lockedUntil, setLockedUntil] = useState(
    () => readAccessSnapshot().lockedUntil,
  );
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    document.title = "Log in · FinAI";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Log in to FinAI and use the connected workspace dashboard: ledger, receivables, payables, banking, close, reports and the FinAI Assistant.",
      );
    // Drop the superseded browser-local account record from earlier builds.
    clearLegacyAccountRecord();
  }, []);
  // Live countdown for the wrong-password lockout; disarms itself on expiry.
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      if (lockedUntil <= Date.now()) {
        setLockedUntil(null);
        return;
      }
      setNow(Date.now());
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);
  const locked = lockedUntil !== null && lockedUntil > now,
    secondsLeft = lockedUntil
      ? Math.max(0, Math.ceil((lockedUntil - now) / 1000))
      : 0;
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || locked) return;
    const form = new FormData(e.currentTarget);
    const email = normalizeEmail(String(form.get("email") || "")),
      submitted = String(form.get("password") || "");
    setError(null);
    setBusy(true);
    const result = await verifyWorkspaceAccess(email, submitted);
    setBusy(false);
    setPassword("");
    if (result.ok) {
      dispatch(
        command({
          kind: "enter",
          profile: personaFromEmail(email) || "Alex Morgan",
        }),
      );
      navigate("/overview");
      return;
    }
    if (result.reason === "incorrect") {
      // Same reply for an unprovisioned email and a wrong password, so the
      // entry cannot be used to probe which email is registered.
      setError("Incorrect email or password.");
      if (result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
        setError(null);
      }
      return;
    }
    if (result.reason === "locked") {
      setLockedUntil(result.lockedUntil);
      setError(null);
      return;
    }
    if (result.reason === "storage")
      setError("Browser storage is unavailable. Try again in a moment.");
    else
      setError(
        "This browser context is not secure, so passwords cannot be verified here. Open the site over HTTPS or on localhost.",
      );
  }
  return (
    <div className="welcome log-in">
      <div className="welcome-story">
        <Link to="/" className="brand">
          <BrandMark />
          FinAI
        </Link>
        <div>
          <span className="eyebrow">THE BIG PICTURE. THE SMALL DETAILS.</span>
          <h1>
            Your books.
            <br />A clearer perspective.
          </h1>
          <p>
            A connected accounting workspace for the people moving business
            forward.
          </p>
          <div className="welcome-art">
            <div>
              <BookOpen size={24} />
              <span>One source of truth</span>
              <strong>Balanced by design</strong>
            </div>
            <div>
              <Check size={18} />
              Revenue recognized
            </div>
            <div>
              <Check size={18} />
              Close with confidence
            </div>
          </div>
        </div>
        <p>Synthetic Northstar Analytics data</p>
      </div>
      <div className="welcome-entry">
        <h2>Sign in to your workspace.</h2>
        <p>
          Use the email and password your FinAI team gave you to open the
          workspace dashboard — the ledger, receivables, payables, banking,
          close, reports and assistant, all connected.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              maxLength={100}
              placeholder="you@company.com"
              disabled={busy || locked}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <span className="login-password">
              <input
                name="password"
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy || locked}
              />
              <button
                type="button"
                className="login-reveal"
                aria-label={reveal ? "Hide password" : "Show password"}
                aria-pressed={reveal}
                onClick={() => setReveal((v) => !v)}
                disabled={busy}
              >
                {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          </label>
          {error && !locked && (
            <p className="login-alert" role="alert">
              {error}
            </p>
          )}
          {locked && (
            <p className="login-lockout" role="status">
              <Timer size={15} />
              Too many attempts. Try again in {secondsLeft}s.
            </p>
          )}
          <button className="primary" type="submit" disabled={busy || locked}>
            {busy ? "Verifying…" : "Log in"}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>
        <p className="login-account-footer">
          Need an account?{" "}
          <a href={DEMO_FORM_URL} target="_blank" rel="noreferrer">
            Book a demo
          </a>
        </p>
        <div className="welcome-note">
          <ShieldCheck size={20} />
          <p>
            Your password is checked in this browser against a salted PBKDF2
            hash.
            <br />
            Nothing is sent to a server; everything stays local.
          </p>
        </div>
      </div>
    </div>
  );
}
