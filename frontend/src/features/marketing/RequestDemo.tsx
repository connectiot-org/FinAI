import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  CirclePlay,
  Clock3,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import {
  DEMO_FORM_EMBED_URL,
  DEMO_FORM_URL,
  DEMO_REQUEST_PATH,
} from "./demo";
import "../../styles/request-demo.css";

const expectations = [
  {
    icon: CirclePlay,
    title: "A guided walkthrough",
    description:
      "See the connected ledger, receivables, payables, close checklist, and reporting working together with real workflow records.",
  },
  {
    icon: Users,
    title: "Built around your team",
    description:
      "Tell us how your finance team works. We tailor the session to your entities, close process, and reporting needs.",
  },
  {
    icon: Sparkles,
    title: "FinAI Assistant, live",
    description:
      "Watch grounded answers point back to the records behind every number, with explicit approval before any action.",
  },
];

const steps = [
  {
    title: "Tell us about your team",
    description:
      "Share your name, email, and company in the form. It takes less than a minute.",
  },
  {
    title: "We reach out",
    description:
      "Our team responds within one business day to schedule a session that fits your calendar.",
  },
  {
    title: "See your workflow live",
    description:
      "A tailored walkthrough of the FinAI workspace, with time for your questions.",
  },
];

export function RequestDemoPage() {
  return (
    <div className="request-demo">
      <section className="request-demo-hero reference-grid-background">
        <div className="reference-container">
          <span className="marketing-kicker">
            <CalendarCheck size={15} />
            BOOK A DEMO
          </span>
          <h1>
            See FinAI work
            <br />
            with your own eyes.
          </h1>
          <p>
            A tailored walkthrough of the connected accounting workspace — the
            ledger, the close, the reports, and the assistant — guided by our
            team.
          </p>
          <div className="request-demo-hero-actions">
            <a
              className="marketing-button dark"
              href={DEMO_FORM_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open the form in a new tab
              <ArrowUpRight size={15} />
            </a>
            <Link className="marketing-text-link" to="/product/assistant">
              Explore the product first
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="request-demo-body reference-container">
        <div className="request-demo-copy">
          <div className="reference-heading">
            <span>WHAT TO EXPECT</span>
            <h2>
              A session shaped
              <br />
              around your close.
            </h2>
          </div>
          <div className="request-demo-expectations">
            {expectations.map((e) => (
              <article key={e.title}>
                <span>
                  <e.icon size={18} />
                </span>
                <div>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="request-demo-steps">
            <h3>What happens next</h3>
            <ol>
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="request-demo-form" id="demo-form">
          <div className="request-demo-form-card">
            <div className="window-chrome">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>finai / book-a-demo</span>
              <span className="preview-demo-label">Secure form</span>
            </div>
            <iframe
              src={DEMO_FORM_EMBED_URL}
              title="FinAI book a demo form"
              loading="lazy"
            >
              Loading…
            </iframe>
            <div className="request-demo-form-foot">
              <p>
                The form opens directly in this page. Prefer a new tab?
              </p>
              <a href={DEMO_FORM_URL} target="_blank" rel="noreferrer">
                Open the form in a new tab
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <ul className="request-demo-assurances">
            <li>
              <Clock3 size={14} />
              We respond within one business day.
            </li>
            <li>
              <Check size={14} />
              No account or sign-in needed to watch.
            </li>
            <li>
              <Lock size={14} />
              Your details stay with our sales team.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
export { DEMO_REQUEST_PATH };
