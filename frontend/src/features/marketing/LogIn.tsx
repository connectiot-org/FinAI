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
  createWorkspaceAccess,
  normalizeEmail,
  passwordProblems,
  readAccessSnapshot,
  resetWorkspaceAccess,
  verifyWorkspaceAccess,
} from "../../lib/workspace-access";
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

// Public log-in entry. The founder direction (16 November 2026) brings a
// visible Log in back to the public site, refined the same day to show only
// the sign-in-to-your-workspace option. The security refinement later that
// day closes the free entry: the workspace sign-in now requires a password.
// The first visitor on a browser creates the sign-in (the password is salted
// and stretched with PBKDF2 in this browser — it is never stored or sent in
// clear text); everyone after that must know it, and repeated wrong passwords
// lock the entry temporarily. (Provisioned customers in session mode still
// reach their own gated workspace directly at /workspace/overview.)
export function LogInPage() {
  const dispatch = useAppDispatch(),
    navigate = useNavigate();
  const [account, setAccount] = useState(() => readAccessSnapshot().account);
  const [lockedUntil, setLockedUntil] = useState(
    () => readAccessSnapshot().lockedUntil,
  );
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [showReset, setShowReset] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    document.title = "Log in · FinAI";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Log in to FinAI and use the connected workspace dashboard: ledger, receivables, payables, banking, close, reports and the FinAI Assistant.",
      );
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
  const hasAccount = account !== null,
    locked = lockedUntil !== null && lockedUntil > now,
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
    setProblems([]);
    if (!hasAccount) {
      // First use on this browser: create the workspace sign-in.
      const found = passwordProblems(submitted);
      if (found.length > 0) {
        setProblems(found);
        return;
      }
      setBusy(true);
      const result = await createWorkspaceAccess(email, submitted);
      setBusy(false);
      if (result.ok) {
        setAccount({ email });
        dispatch(
          command({
            kind: "enter",
            profile: personaFromEmail(email) || "Alex Morgan",
          }),
        );
        navigate("/overview");
        return;
      }
      if (result.reason === "weak-password") setProblems(result.problems);
      else if (result.reason === "storage")
        setError(
          "Browser storage is unavailable, so the sign-in cannot be saved. Check this site's storage permissions and try again.",
        );
      else
        setError(
          "This browser context is not secure, so passwords cannot be protected here. Open the site over HTTPS or on localhost.",
        );
      return;
    }
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
      // Same reply for a wrong email and a wrong password, so the entry
      // cannot be used to probe which email is registered.
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
  function handleReset() {
    resetWorkspaceAccess();
    setAccount(null);
    setLockedUntil(null);
    setPassword("");
    setShowReset(false);
    setError(null);
    setProblems([]);
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
        <h2>{hasAccount ? "Welcome back." : "Set up your sign-in."}</h2>
        <p>
          {hasAccount
            ? "Log in to open your workspace dashboard — the ledger, receivables, payables, banking, close, reports and assistant, all connected."
            : "Create a password to open your workspace dashboard — the ledger, receivables, payables, banking, close, reports and assistant, all connected."}
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
              defaultValue={account?.email ?? ""}
              disabled={busy || locked}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <span className="login-password">
              <input
                name="password"
                type={reveal ? "text" : "password"}
                autoComplete={hasAccount ? "current-password" : "new-password"}
                required
                maxLength={128}
                placeholder={
                  hasAccount
                    ? "Your password"
                    : "At least 8 characters with a number"
                }
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
          {!hasAccount && (
            <ul
              className="login-requirements"
              aria-label="Password requirements"
            >
              <li className={password.length >= 8 ? "ok" : undefined}>
                {password.length >= 8 ? <Check size={13} /> : <span />}8 or more
                characters
              </li>
              <li className={/[a-z]/i.test(password) ? "ok" : undefined}>
                {/[a-z]/i.test(password) ? <Check size={13} /> : <span />}A
                letter
              </li>
              <li className={/\d/.test(password) ? "ok" : undefined}>
                {/\d/.test(password) ? <Check size={13} /> : <span />}A number
              </li>
            </ul>
          )}
          {(error || problems.length > 0) && !locked && (
            <p className="login-alert" role="alert">
              {error ??
                (problems.length === 1
                  ? `Please ${problems[0]}.`
                  : `Please ${problems.slice(0, -1).join(", ")} and ${problems[problems.length - 1]}.`)}
            </p>
          )}
          {locked && (
            <p className="login-lockout" role="status">
              <Timer size={15} />
              Too many attempts. Try again in {secondsLeft}s.
            </p>
          )}
          <button className="primary" type="submit" disabled={busy || locked}>
            {busy
              ? hasAccount
                ? "Verifying…"
                : "Securing…"
              : hasAccount
                ? "Log in"
                : "Create sign-in"}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>
        {hasAccount &&
          (showReset ? (
            <div className="login-reset">
              <p>
                The sign-in lives only in this browser — there is no server to
                email. Resetting clears the saved password so you can set a new
                one.
              </p>
              <div className="login-reset-actions">
                <button type="button" className="primary" onClick={handleReset}>
                  Reset access on this browser
                </button>
                <button
                  type="button"
                  className="login-reset-cancel"
                  onClick={() => setShowReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="login-forgot"
              onClick={() => {
                setShowReset(true);
                setError(null);
              }}
            >
              Forgot your password?
            </button>
          ))}
        <div className="welcome-note">
          <ShieldCheck size={20} />
          <p>
            Your password is salted and stretched with PBKDF2 in this browser.
            <br />
            Nothing is sent to a server; everything stays local.
          </p>
        </div>
      </div>
    </div>
  );
}
