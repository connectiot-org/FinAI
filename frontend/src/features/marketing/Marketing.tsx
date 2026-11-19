import { BrandMark } from "../../components/shared/BrandMark";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Check,
  LogIn,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Modal, useToast } from "../../components/ui";
import { useDemo } from "../../store";
import { money, inScope } from "../../demo/selectors";
import { ProductPreview } from "./ProductPreview";
import { ProductDetails } from "./ProductDetails";
import { products, questions, productNavGroups, type PreviewView } from "./content";
import { DEMO_REQUEST_PATH } from "./demo";
import { ReferenceHome, PreviewExplorer } from "./ReferenceHome";
import "../../styles/marketing.css";
import "../../styles/reference-home.css";
import "../../styles/product-reference.css";
import "../../styles/motion.css";

type PublicItem = { label: string; description: string; to: string };
// Public navigation routes every function entry to a demo request: the site
// offers no public sign-in, and paid workspaces are provisioned by the FinAI
// team after a demo conversation.
const solutionGroups = [
  {
    title: "By role",
    items: [
      {
        label: "CFO",
        description: "Real-time visibility, investor-ready reporting",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Controller",
        description: "Continuous close and review controls",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Accounting firms",
        description: "Multi-client workflows at a glance",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Private equity",
        description: "Portfolio reporting across entities",
        to: DEMO_REQUEST_PATH,
      },
    ],
  },
  {
    title: "By company size",
    items: [
      {
        label: "Startup",
        description: "Books that scale from day one",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Mid-size",
        description: "Multi-entity close and controls",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Enterprise",
        description: "Consolidation and audit trails",
        to: DEMO_REQUEST_PATH,
      },
    ],
  },
  {
    title: "By industry",
    items: [
      {
        label: "SaaS",
        description: "Revenue recognition and deferred revenue",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Financial services",
        description: "Compliance-ready, traceable records",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Healthcare",
        description: "Controlled processes with evidence",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Logistics",
        description: "High-volume payables, organized",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Professional services",
        description: "Project billing, cleanly connected",
        to: DEMO_REQUEST_PATH,
      },
      {
        label: "Ecommerce",
        description: "Marketplace and payment reconciliation",
        to: DEMO_REQUEST_PATH,
      },
    ],
  },
];
const partnerGroups = [
  {
    title: "Explore together",
    items: [
      {
        label: "About this prototype",
        description: "The idea behind FinAI",
        to: "/about",
      },
      {
        label: "Workflow guides",
        description: "A useful starting point",
        to: "/resources",
      },
    ],
  },
];
function PublicMenu({
  label,
  groups,
}: {
  label: string;
  groups: { title: string; items: PublicItem[] }[];
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="marketing-nav-button">
        {label}
        <ChevronDown size={13} />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className={`marketing-mega ${groups.length > 1 ? "has-columns" : ""}`}
          sideOffset={20}
          align="center"
        >
          {groups.map((group) => (
            <div key={group.title}>
              <div className="marketing-menu-title">{group.title}</div>
              {group.items.map((item) => (
                <Dropdown.Item asChild key={item.label}>
                  <Link to={item.to}>
                    <span>
                      <ArrowUpRight size={15} />
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </div>
                  </Link>
                </Dropdown.Item>
              ))}
            </div>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
function BookmarkGuide() {
  const toast = useToast();
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem("finai-public-guide") === "/resources";
    } catch {
      return false;
    }
  });
  return (
    <div className="marketing-guide-bar">
      <div>
        <strong>Keep a useful guide close</strong>
        <span>Save a local shortcut to the FinAI demo workflows</span>
      </div>
      <div>
        {saved ? (
          <Link to="/resources">
            <Check size={14} />
            Workflow guide saved
            <ArrowUpRight size={14} />
          </Link>
        ) : (
          <button
            onClick={() => {
              try {
                localStorage.setItem("finai-public-guide", "/resources");
                setSaved(true);
                toast("Workflow guide saved in this browser");
              } catch {
                toast(
                  "Browser storage is unavailable; open Resources to view the guide.",
                );
              }
            }}
          >
            Save workflow guide
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
export function MarketingLayout() {
  const [mobile, setMobile] = useState(false),
    location = useLocation();
  useEffect(() => {
    setMobile(false);
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const product = products.find(
      (p) => location.pathname === `/product/${p.slug}`,
    );
    const page =
      product?.name ||
      (
        {
          "/": "Connected accounting workflows",
          "/resources": "Workflow guides",
          "/customers": "Fictional demo companies",
          "/about": "About FinAI",
          "/request-demo": "Request a demo",
        } as Record<string, string>
      )[location.pathname] ||
      "Page unavailable";
    document.title = `${page} · FinAI`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        product?.description ||
          (
            {
              "/request-demo":
                "Book a tailored FinAI walkthrough. See the connected accounting workspace, close checklist, and FinAI Assistant in action.",
            } as Record<string, string>
          )[location.pathname] ||
          "Explore connected accounting workflows in FinAI. Interactive demo with fictional records, local reviews, and traceable financial statements.",
      );
  }, [location.pathname]);
  const groups = productNavGroups.map((group) => ({
    title: group.title,
    items: group.slugs
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is (typeof products)[number] => Boolean(p))
      .map((p) => ({
        label: p.name,
        description: p.short,
        to: `/product/${p.slug}`,
      })),
  }));
  return (
    <div className="marketing-site">
      <a className="marketing-skip" href="#marketing-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <Link className="marketing-brand" to="/" aria-label="FinAI home">
          <BrandMark />
          FinAI
        </Link>
        <nav aria-label="Public navigation">
          <PublicMenu label="Product" groups={groups} />
          <PublicMenu label="Solutions" groups={solutionGroups} />
          <Link to="/customers">Customers</Link>
          <PublicMenu label="Partners" groups={partnerGroups} />
          <PublicMenu
            label="Resources"
            groups={[
              {
                title: "Learn",
                items: [
                  {
                    label: "Workflow guides",
                    description: "Explore the accounting demo",
                    to: "/resources",
                  },
                  {
                    label: "Interactive preview",
                    description: "Inspect local records",
                    to: "/resources#interactive-preview",
                  },
                  {
                    label: "Questions answered",
                    description: "Honest demo details",
                    to: "/resources#questions",
                  },
                ],
              },
              {
                title: "Company",
                items: [
                  {
                    label: "About FinAI",
                    description: "A connected accounting prototype",
                    to: "/about",
                  },
                  {
                    label: "Request a demo",
                    description: "Book a tailored walkthrough",
                    to: DEMO_REQUEST_PATH,
                  },
                  {
                    label: "Local data and privacy",
                    description: "Understand the demo boundaries",
                    to: "/resources#demo-details",
                  },
                ],
              },
            ]}
          />
        </nav>
        <div className="marketing-header-actions">
          <Link className="marketing-login" to="/login">
            <LogIn size={14} />
            Log in
          </Link>
          <Link className="marketing-button dark small" to={DEMO_REQUEST_PATH}>
            Request a demo
          </Link>
          <button
            className="marketing-mobile-toggle"
            aria-label="Open public navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={25} />
          </button>
        </div>
      </header>
      <main id="marketing-content" className="marketing-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <BookmarkGuide />
        <div className="marketing-footer-top">
          <div>
            <h3>PRODUCT</h3>
            {products.map((p) => (
              <Link key={p.slug} to={`/product/${p.slug}`}>
                {p.name}
              </Link>
            ))}
          </div>
          <div>
            <h3>SOLUTIONS</h3>
            <Link to={DEMO_REQUEST_PATH}>CFO</Link>
            <Link to={DEMO_REQUEST_PATH}>Controller</Link>
            <Link to={DEMO_REQUEST_PATH}>Accounting firms</Link>
            <Link to={DEMO_REQUEST_PATH}>Private equity</Link>
            <Link to={DEMO_REQUEST_PATH}>Startup · Mid-size · Enterprise</Link>
            <Link to="/customers">Demo customers</Link>
          </div>
          <div>
            <h3>RESOURCES</h3>
            <Link to={DEMO_REQUEST_PATH}>Request a demo</Link>
            <Link to="/resources">Workflow guides</Link>
            <Link to="/resources#interactive-preview">Interactive preview</Link>
            <Link to="/resources#questions">Questions answered</Link>
            <Link to="/login">Workspace log in</Link>
          </div>
          <div>
            <h3>COMPANY</h3>
            <Link to="/about">About FinAI</Link>
            <Link to="/resources#demo-details">Local data and privacy</Link>
            <Link to={DEMO_REQUEST_PATH}>Talk to our team</Link>
            <a
              href="https://github.com/connectiot-org/FinAI"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRight size={10} />
            </a>
          </div>
        </div>
        <div className="marketing-footer-bottom">
          <Link className="marketing-brand" to="/" aria-label="FinAI home">
            <BrandMark />
            FinAI
          </Link>
          <span>
            © {new Date().getFullYear()} FinAI · Original demonstration ·
            Synthetic records
          </span>
          <span>
            <ShieldCheck size={13} />
            Local demo · No live AI or payments
          </span>
        </div>
      </footer>
      <Modal
        title="Explore FinAI"
        open={mobile}
        onOpenChange={setMobile}
        drawer
      >
        <nav
          className="marketing-mobile-nav"
          aria-label="Mobile public navigation"
        >
          <Link to={DEMO_REQUEST_PATH}>
            Request a demo
            <ArrowRight size={15} />
          </Link>
          <Link to="/login">
            <LogIn size={17} />
            Log in
            <ArrowRight size={15} />
          </Link>
          {groups.map((group) => (
            <details key={group.title} open={group.title === "General ledger"}>
              <summary>
                {group.title}
                <ChevronDown size={15} />
              </summary>
              {group.items.map((p) => (
                <Link key={p.to} to={p.to}>
                  {p.label}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </details>
          ))}
          {[...solutionGroups, ...partnerGroups].map((group) => (
            <details key={group.title}>
              <summary>
                {group.title}
                <ChevronDown size={15} />
              </summary>
              {group.items.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </details>
          ))}
          <Link to="/customers">
            <Users size={17} />
            Demo customers
            <ArrowRight size={15} />
          </Link>
          <Link to="/resources">
            Resources
            <ArrowRight size={15} />
          </Link>
          <Link to="/about">
            About FinAI
            <ArrowRight size={15} />
          </Link>
          <Link to={DEMO_REQUEST_PATH}>
            Request a demo
            <ArrowRight size={15} />
          </Link>
        </nav>
      </Modal>
    </div>
  );
}
function CallToAction() {
  return (
    <section className="marketing-final-cta">
      <h2>Get one step closer to a clearer close</h2>
      <p>Connected records. Reviewable workflows. A bigger picture.</p>
      <Link className="marketing-button light" to={DEMO_REQUEST_PATH}>
        Request a demo
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}
export function HomePage() {
  return <ReferenceHome />;
}

export function ProductPage() {
  const { product: slug } = useParams(),
    product = products.find((p) => p.slug === slug),
    [view, setView] = useState<PreviewView>(product?.view || "overview");
  useEffect(() => {
    setView(product?.view || "overview");
  }, [product?.view]);
  if (!product)
    return (
      <section className="marketing-section marketing-product-missing">
        <h1>That page isn’t in this demo.</h1>
        <Link className="marketing-button dark" to="/">
          Return home
          <ArrowRight size={15} />
        </Link>
      </section>
    );
  return (
    <div className="marketing-product-detail" key={product.slug}>
      <div className="product-reference-hero-background">
        <section className="marketing-product-hero">
          <span className="marketing-kicker">
            <product.icon size={15} />
            {product.name}
          </span>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <Link className="marketing-button dark" to={DEMO_REQUEST_PATH}>
            Request a demo to try this workflow
            <ArrowRight size={15} />
          </Link>
          <span className="marketing-product-note">
            FinAI workspace · Provisioned for your team after the demo
          </span>
        </section>
        <div className="marketing-product-page-preview">
          <ProductPreview view={view} onViewChange={setView} />
        </div>
      </div>
      <section className="marketing-section marketing-benefits">
        {product.benefits.map(([title, description], i) => (
          <div key={title}>
            <span>
              <product.icon size={18} />
              <span className="sr-only">Benefit {i + 1}</span>
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        ))}
      </section>
      <ProductDetails product={product} />
      <CallToAction />
    </div>
  );
}

export function ResourcesPage() {
  return (
    <>
      <section className="marketing-product-hero">
        <span className="marketing-kicker">FIND YOUR WAY AROUND</span>
        <h1>
          A few useful paths
          <br />
          through the numbers.
        </h1>
        <p>
          Hands-on starting points for FinAI. Every guide pairs with a
          personalized demo of your own workflow.
        </p>
      </section>
      <section className="marketing-section marketing-resource-guides">
        {products.map((p) => (
          <article key={p.slug}>
            <p.icon size={24} />
            <h2>{p.name}</h2>
            <p>{p.benefits[0][1]}</p>
            <ol>
              {p.benefits.map(([title]) => (
                <li key={title}>{title}</li>
              ))}
            </ol>
            <Link className="marketing-text-link" to={DEMO_REQUEST_PATH}>
              Request a demo to open this workflow
              <ArrowRight size={14} />
            </Link>
          </article>
        ))}
      </section>
      <section
        className="marketing-section marketing-demo-details"
        id="demo-details"
      >
        <ShieldCheck size={28} />
        <h2>Your browser. Your demo.</h2>
        <p>
          FinAI is a frontend demonstration with synthetic Northstar Analytics
          records. Business data stays in browser storage. Payments, bank
          connections, automation runs, and assistant responses are simulations.
          No real company, customer, vendor, bank, or AI service is connected.
        </p>
        <p>
          Local PDF and image previews use session-only object URLs; contents
          are never uploaded. You can restore the original dataset at any time
          through Settings → Preferences → Reset demo.
        </p>
        <Link className="marketing-text-link" to={DEMO_REQUEST_PATH}>
          Request a demo to shape your own workspace
          <ArrowRight size={14} />
        </Link>
      </section>
      <PreviewExplorer />
      <section className="marketing-section marketing-faq" id="questions">
        <div>
          <span className="marketing-kicker">DEMO DETAILS</span>
          <h2>Questions, answered.</h2>
        </div>
        <div>
          {questions.map((q) => (
            <details key={q.q}>
              <summary>
                {q.q}
                <span>+</span>
              </summary>
              <p>{q.a}</p>
            </details>
          ))}
        </div>
      </section>
      <CallToAction />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <section className="marketing-product-hero">
        <span className="marketing-kicker">THE IDEA BEHIND FINAI</span>
        <h1>
          Good accounting
          <br />
          makes space to think.
        </h1>
        <p>
          A connected workspace for understanding how financial records,
          decisions, and workflows fit together.
        </p>
        <Link className="marketing-button dark" to="/login">
          See the idea in action
          <ArrowRight size={15} />
        </Link>
      </section>
      <section className="marketing-section marketing-about-body">
        <div>
          <span className="marketing-kicker">OUR DEMONSTRATION</span>
          <h2>
            Clarity in the details.
            <br />
            <em>Confidence in the whole.</em>
          </h2>
        </div>
        <div>
          <p>
            FinAI brings the everyday work of accounting into a coherent local
            demonstration: the journal behind a number, the invoice behind a
            receivable, and the evidence behind a close.
          </p>
          <p>
            The fictional Northstar Analytics workspace lets you explore six
            months of financial activity across two USD entities. You can
            create, review, post, and trace changes without credentials or
            external connections.
          </p>
          <p>
            This is an original FinAI prototype, with simulated workflows and
            browser-local data. It is not a production accounting service.
          </p>
        </div>
      </section>
      <CallToAction />
    </>
  );
}

export function DemoCustomersPage() {
  const s = useDemo();
  return (
    <>
      <section className="marketing-product-hero">
        <span className="marketing-kicker">
          <Building2 size={15} />
          FICTIONAL DEMO COMPANIES
        </span>
        <h1>Relationships, with the numbers attached.</h1>
        <p>
          Explore the synthetic customers inside Northstar Analytics. These are
          fictional records, not FinAI customer endorsements.
        </p>
      </section>
      <section className="marketing-section marketing-customers-grid">
        {s.customers
          .filter((c) => c.entity === s.entity)
          .map((c) => (
            <Link to={DEMO_REQUEST_PATH} key={c.id}>
              <span className="demo-company-mark">{c.name[0]}</span>
              <h2>{c.name}</h2>
              <p>{c.contact}</p>
              <strong>
                {money(
                  s.invoices
                    .filter(
                      (i) =>
                        i.customer === c.id &&
                        inScope(s, i) &&
                        i.status !== "Draft",
                    )
                    .reduce((v, i) => v + i.amount - i.paid, 0),
                )}{" "}
                outstanding
              </strong>
              <span>
                Request a demo to view
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
      </section>
      <CallToAction />
    </>
  );
}
