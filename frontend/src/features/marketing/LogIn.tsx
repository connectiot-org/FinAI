import { BrandMark } from "../../components/shared/BrandMark";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Check, ShieldCheck } from "lucide-react";
import { command, useAppDispatch } from "../../store";
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
// visible Log in back to the public site: anyone can log in with an email and
// immediately use the connected workspace dashboard and every workflow behind
// it. The founder refined the entry the same day: the page shows only the
// sign-in-to-your-workspace option — no second provisioned-customer section,
// no divider, no demo paragraph. (Provisioned customers in session mode still
// reach their own gated workspace directly at /workspace/overview.)
export function LogInPage() {
  const dispatch = useAppDispatch(),
    navigate = useNavigate();
  useEffect(() => {
    document.title = "Log in · FinAI";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Log in to FinAI and use the connected workspace dashboard: ledger, receivables, payables, banking, close, reports and the FinAI Assistant.",
      );
  }, []);
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
        <h2>Welcome back.</h2>
        <p>
          Log in to open your workspace dashboard — the ledger, receivables,
          payables, banking, close, reports and assistant, all connected.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const email = String(
              new FormData(e.currentTarget).get("email") || "",
            );
            dispatch(
              command({
                kind: "enter",
                profile: personaFromEmail(email) || "Alex Morgan",
              }),
            );
            navigate("/overview");
          }}
        >
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={100}
              placeholder="you@company.com"
            />
          </label>
          <button className="primary" type="submit">
            Log in
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="welcome-note">
          <ShieldCheck size={20} />
          <p>
            Logging in opens the connected demo workspace in this browser.
            <br />
            Nothing is sent to a server; everything stays local.
          </p>
        </div>
      </div>
    </div>
  );
}
