"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Building2,
  Sparkles,
  Calculator,
  Lock,
  ChevronDown,
  X,
  FileCheck2,
  Receipt,
  BookOpen,
  Send,
  HelpCircle,
} from "lucide-react";
import { SectionHeading, Container } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";

export type BillingCycle = "monthly" | "annual";
export type PlanTier = "starter" | "professional" | "practice" | "enterprise";

interface PricingPlan {
  id: PlanTier;
  name: string;
  badge?: string;
  highlighted?: boolean;
  audience: string;
  description: string;
  originalPrice: number | null; // e.g. 99
  monthlyPrice: number | null; // e.g. 94 (-£5 discount)
  annualPrice: number | null; // e.g. 75/mo billed annually
  priceLabel: string;
  unit: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant: "primary" | "secondary" | "outline";
  keyFeatures: string[];
  specs: {
    users: string;
    agents: string;
    integrations: string;
    support: string;
  };
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "£5 Cut Applied",
    highlighted: false,
    audience: "For small practices & sole practitioners",
    description: "Essential AI automation to eliminate repetitive admin and manual data prep.",
    originalPrice: 99,
    monthlyPrice: 94,
    annualPrice: 75,
    priceLabel: "£94",
    unit: "/ user / month",
    ctaText: "Start Free Trial",
    ctaHref: "/agent?plan=starter",
    ctaVariant: "outline",
    specs: {
      users: "Up to 10 users",
      agents: "25+ ready-made agents",
      integrations: "Xero, QuickBooks & Excel",
      support: "Standard UK business hours",
    },
    keyFeatures: [
      "Up to 10 team seats",
      "25+ accounting & finance agents",
      "Bookkeeping & bank reconciliation",
      "VAT preparation & transaction checks",
      "Client document chasing & email drafting",
      "Xero & QuickBooks live connectors",
      "Human approval before anything is finalised",
      "UK GDPR & SOC 2 aligned security",
      "Full audit trail for every calculation",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    badge: "Most Popular · £5 Cut",
    highlighted: true,
    audience: "For growing accounting firms & FP&A teams",
    description: "The complete AI coworker fleet across all accounting service lines.",
    originalPrice: 179,
    monthlyPrice: 174,
    annualPrice: 139,
    priceLabel: "£174",
    unit: "/ user / month",
    ctaText: "Start Free Trial",
    ctaHref: "/agent?plan=professional",
    ctaVariant: "primary",
    specs: {
      users: "Unlimited team seats",
      agents: "50+ full agent library",
      integrations: "Xero, QuickBooks, Sage, FreeAgent, Excel & Outlook",
      support: "Priority UK support with 2h SLA",
    },
    keyFeatures: [
      "Everything in Starter, plus:",
      "50+ ready-made accounting & finance agents",
      "Bookkeeping & automated month-end close",
      "VAT workings & comprehensive VAT returns",
      "Payroll workflows & variance analysis",
      "Personal tax (I&E workings & self-assessment)",
      "Corporation tax (CT600 workings & review)",
      "Year-end accounts & management accounts",
      "Live Outlook & Excel add-ins",
      "Client-specific AI context & mailbox memory",
      "Unlimited usage (fair-use policy)",
      "Firm workflow & productivity analytics",
    ],
  },
  {
    id: "practice",
    name: "Practice",
    badge: "Best for Scale · £5 Cut",
    highlighted: false,
    audience: "For established practices & multi-partner firms",
    description: "Firm-wide rollout with custom agents, team permissions, and dedicated onboarding.",
    originalPrice: 249,
    monthlyPrice: 244,
    annualPrice: 195,
    priceLabel: "£244",
    unit: "/ user / month",
    ctaText: "Book Practice Demo",
    ctaHref: "#book-demo",
    ctaVariant: "secondary",
    specs: {
      users: "Unlimited seats across branches",
      agents: "Unlimited + Custom Agents",
      integrations: "All Core + Sage Intacct, NetSuite & HMRC API",
      support: "Dedicated account manager & 24/7 priority",
    },
    keyFeatures: [
      "Everything in Professional, plus:",
      "Unlimited accounting & finance agents",
      "Custom agents tailored to your firm's processes",
      "Multiple teams, branches & department workspaces",
      "Advanced role-based permissions & firm audit logs",
      "Practice-wide knowledge base & document search",
      "Multi-step partner sign-off approval workflows",
      "Dedicated implementation & onboarding specialist",
      "Usage, time-saved & partner productivity reporting",
      "Custom billing & consolidated invoicing",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "Custom Deployment",
    highlighted: false,
    audience: "For larger accounting groups & multi-office firms",
    description: "Bespoke AI infrastructure, custom integrations, and dedicated security.",
    originalPrice: null,
    monthlyPrice: null,
    annualPrice: null,
    priceLabel: "Custom",
    unit: "tailored to your firm",
    ctaText: "Talk to Sales",
    ctaHref: "#talk-sales",
    ctaVariant: "outline",
    specs: {
      users: "Enterprise-wide deployment",
      agents: "Bespoke proprietary agents",
      integrations: "Custom API & ERP connectors (SAP, NetSuite)",
      support: "24/7 dedicated engineering pod",
    },
    keyFeatures: [
      "Everything in Practice, plus:",
      "Bespoke AI agents built for proprietary software",
      "Multi-office global rollouts with data residency",
      "Custom ERP & accounting system connectors",
      "Single Sign-On (SAML / Okta / Azure AD)",
      "Zero-retention data privacy guarantees",
      "Full REST & streaming developer API access",
      "Dedicated implementation pod & solution architect",
      "99.9% uptime SLA with financial guarantees",
      "Custom training workshops for partner & audit teams",
    ],
  },
];

const serviceLines = [
  {
    id: "bookkeeping",
    title: "Bookkeeping",
    icon: BookOpen,
    tasks: [
      "Automated invoice & bill posting",
      "Bank reconciliation & match suggestions",
      "Missing receipts automated chasing",
      "Vendor duplicate payment detection",
    ],
    tools: ["QuickBooks", "Xero", "Sage Intacct", "Excel"],
  },
  {
    id: "vat",
    title: "VAT & Tax Compliance",
    icon: Receipt,
    tasks: [
      "Quarterly VAT return preparation",
      "VAT box review & exception reports",
      "Cross-border transaction checks",
      "Partial exemption computations",
    ],
    tools: ["HMRC", "Xero", "QuickBooks", "Avalara"],
  },
  {
    id: "payroll",
    title: "Payroll",
    icon: Users,
    tasks: [
      "Monthly payroll journals & variance checks",
      "Gross-to-net discrepancy warnings",
      "Payroll query email drafting",
      "Pension & auto-enrolment reconciliation",
    ],
    tools: ["BrightPay", "Gusto", "QuickBooks", "Outlook"],
  },
  {
    id: "accounts",
    title: "Accounts & Close",
    icon: FileCheck2,
    tasks: [
      "Year-end statutory accounts preparation",
      "Monthly management accounts pack",
      "Balance sheet lead schedules",
      "Fixed asset schedule rollover",
    ],
    tools: ["Xero", "QuickBooks", "Excel", "Word"],
  },
  {
    id: "tax",
    title: "Corporation & Personal Tax",
    icon: Shield,
    tasks: [
      "CT600 corporation tax workpaper draft",
      "Self-assessment personal tax schedules",
      "R&D tax credit documentation review",
      "Capital allowances computations",
    ],
    tools: ["HMRC", "UltraTax CS", "CCH Axcess", "Excel"],
  },
  {
    id: "fpa",
    title: "FP&A & Advisory",
    icon: Sparkles,
    tasks: [
      "13-week rolling cash flow forecasts",
      "Budget vs actual variance commentary",
      "Scenario & sensitivity modeling",
      "Executive board decks in minutes",
    ],
    tools: ["Excel", "Google Sheets", "PowerPoint", "CSV"],
  },
];

const capacityRows = [
  {
    task: "Bank reconciliations",
    aiDoes: "Auto-matching, rule suggestions & exception flagging",
    teamDoes: "Review & final professional judgement",
  },
  {
    task: "Invoice & bill processing",
    aiDoes: "OCR extraction, GL coding & duplicate check",
    teamDoes: "One-click approval & authorization",
  },
  {
    task: "VAT workings & filings",
    aiDoes: "Cross-ledger checks, rate validation & draft boxes",
    teamDoes: "Technical review & client sign-off",
  },
  {
    task: "Payroll journal reconciliation",
    aiDoes: "Variance analysis & automated audit check",
    teamDoes: "Exceptions review & manager sign-off",
  },
  {
    task: "Client records chasing",
    aiDoes: "Automated polite chasing with missing lists",
    teamDoes: "High-touch client advisory & advisory fees",
  },
  {
    task: "Year-end working papers",
    aiDoes: "Draft lead schedules, ties & ratio trends",
    teamDoes: "Audit-grade technical review & filing",
  },
  {
    task: "Management reporting",
    aiDoes: "Data collation, chart generation & variance notes",
    teamDoes: "Strategic advisory & board presentation",
  },
];

const faqs = [
  {
    q: "How does the £5/user discount work?",
    a: "We have discounted every single plan by £5 per user every month (£94 vs £99 for Starter, £174 vs £179 for Professional, and £244 vs £249 for Practice). If you select annual billing, you receive an additional 20% discount (2 months free).",
  },
  {
    q: "Do we have to change our accounting software?",
    a: "No. FinAI is designed to work inside the tools you already use daily—including Xero, QuickBooks, Sage, FreeAgent, Microsoft Excel, Outlook, and HMRC portals. It operates as an AI coworker, not a platform replacement.",
  },
  {
    q: "Does FinAI train AI models on our client financial data?",
    a: "Never. Your client financial data is strictly confidential, encrypted at rest (AES-256) and in transit (TLS 1.3), hosted under UK GDPR guidelines, and is never used to train or fine-tune public AI models.",
  },
  {
    q: "Can work be submitted or filed without human approval?",
    a: "No. We follow a strict 'Prepare → Check → Review → Approve' governance workflow. Every calculation, journal, tax draft, or report is presented to your accountant with sources attached for review before anything is finalized.",
  },
  {
    q: "Can we start with a small team and scale up?",
    a: "Yes. You can start on Starter or Professional with just 1 or 2 users, test with specific workflows (such as bank rec, VAT, or month-end close), and add teammates whenever you are ready.",
  },
  {
    q: "What support is provided during onboarding?",
    a: "Starter plans include guided in-app onboarding and email support. Professional and Practice plans include personalized workflow setup, team training, and priority UK-based support.",
  },
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("professional");
  const [teamSize, setTeamSize] = useState<number>(10);
  const [activeService, setActiveService] = useState<string>("bookkeeping");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Modal for Demo / Sales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Book a 20-minute Practice Demo");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    firm: "",
    teamSize: 10,
    note: "",
  });

  const handleOpenModal = (title: string, defaultPlan?: PlanTier) => {
    if (defaultPlan) setSelectedPlan(defaultPlan);
    setModalTitle(title);
    setFormSubmitted(false);
    setModalOpen(true);
  };

  // Calculations for interactive capacity calculator
  const hoursSavedPerPersonWeek = 10;
  const hoursSavedWeekly = teamSize * hoursSavedPerPersonWeek;
  const hoursSavedYearly = hoursSavedWeekly * 52;
  const avgBillableRate = 35; // £35/hr average standard capacity rate
  const annualCapacityValue = hoursSavedYearly * avgBillableRate;

  // Selected plan data
  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[1];
  const displayedPrice =
    currentPlan.monthlyPrice === null
      ? "Custom"
      : billingCycle === "annual"
      ? `£${currentPlan.annualPrice}`
      : `£${currentPlan.monthlyPrice}`;

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-line bg-paper py-20 md:py-28"
      aria-label="Pricing and plans"
    >
      <Container>
        {/* Header Block */}
        <div className="text-center">
          <SectionHeading
            align="center"
            eyebrow="Pricing & Plans · UK Accounting & Finance"
            title={
              <>
                One subscription.{" "}
                <span className="font-serif-accent font-normal text-moss">
                  Every agent included
                </span>
                .
              </>
            }
            description="Automate the repetitive work. Keep accountants firmly in control. Every plan includes full access to our ready-made agent library with human review on every output."
          />

          {/* Special Promotion Pill */}
          <Reveal delay={0.08} className="mt-4 inline-flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss-soft/60 px-4 py-1.5 text-[13px] font-medium text-moss-deep">
              <span className="flex size-2 rounded-full bg-moss animate-pulse" />
              <span>
                <strong>Launch Pricing:</strong> £5 cut applied across all user plans
              </span>
            </div>
          </Reveal>

          {/* Trust badges strip */}
          <Reveal delay={0.12} className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 text-[12.5px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Shield className="size-4 text-moss" /> UK GDPR Compliant
            </span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Lock className="size-4 text-moss" /> Zero AI Training On Your Data
            </span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Check className="size-4 text-moss" /> Human Approval Required
            </span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Zap className="size-4 text-moss" /> Connects with Xero, QBO & Excel
            </span>
          </Reveal>
        </div>

        {/* Fast Pricing Selection Bar */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-white p-3 shadow-sm md:p-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Quick selector tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="mr-1 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
                Quick Select:
              </span>
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                const price =
                  p.monthlyPrice === null
                    ? "Custom"
                    : billingCycle === "annual"
                    ? `£${p.annualPrice}`
                    : `£${p.monthlyPrice}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all ${
                      isSelected
                        ? "bg-moss text-white shadow-sm ring-2 ring-moss ring-offset-1"
                        : "bg-paper-soft text-ink hover:bg-stone-200"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`text-[11.5px] ${isSelected ? "text-emerald-200" : "text-ink-soft"}`}>
                      ({price})
                    </span>
                    {p.id === "professional" && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9.5px] font-bold text-stone-900">
                        Popular
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center gap-2 rounded-full border border-line bg-paper-soft p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-ink-soft hover:text-stone-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-medium transition-all ${
                  billingCycle === "annual"
                    ? "bg-moss text-white shadow-sm"
                    : "text-ink-soft hover:text-stone-900"
                }`}
              >
                <span>Annual</span>
                <span className="rounded-full bg-emerald-300 px-1.5 py-0.2 text-[10px] font-bold text-moss-deep">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Plan Snapshot Alert */}
        <div className="mx-auto mt-4 max-w-3xl text-center">
          <p className="text-[13px] text-ink-soft">
            Currently focused on{" "}
            <strong className="text-moss-deep font-semibold">{currentPlan.name} Plan</strong>:{" "}
            {displayedPrice}{" "}
            {currentPlan.monthlyPrice !== null ? currentPlan.unit : ""} ·{" "}
            <span className="text-stone-900 font-medium">{currentPlan.audience}</span>
          </p>
        </div>

        {/* 4 Pricing Cards Grid */}
        <Stagger className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const originalPrice = plan.originalPrice;
            const currentPrice =
              billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

            return (
              <StaggerItem key={plan.id}>
                <div
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`group relative flex h-full cursor-pointer flex-col rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? "border-moss bg-white shadow-xl ring-2 ring-moss ring-offset-2"
                      : plan.highlighted
                      ? "border-moss/40 bg-white shadow-md hover:border-moss hover:shadow-lg"
                      : "border-line bg-white/80 hover:border-stone-400 hover:bg-white hover:shadow-md"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                          plan.highlighted
                            ? "bg-moss text-white"
                            : isSelected
                            ? "bg-stone-900 text-white"
                            : "bg-paper-soft text-ink-soft border border-line"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[20px] font-bold tracking-tight text-stone-950">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-[12px] font-medium text-ink-soft">
                          {plan.audience}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-moss text-white">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                      {plan.description}
                    </p>

                    {/* Price Block */}
                    <div className="mt-5 border-t border-line/80 pt-4">
                      {currentPrice !== null ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            {originalPrice && (
                              <span className="text-[16px] text-stone-400 line-through">
                                £{originalPrice}
                              </span>
                            )}
                            <span className="display text-[38px] font-bold tracking-tight text-stone-950">
                              £{currentPrice}
                            </span>
                            <span className="text-[12px] text-ink-soft">
                              {plan.unit}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-moss">
                            {billingCycle === "annual"
                              ? "Billed annually (Includes £5 cut + 2 mo free)"
                              : "£5 cut applied per user every month"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="display text-[34px] font-bold text-stone-950">
                            Custom
                          </span>
                          <p className="text-[12px] text-ink-soft">
                            Tailored to your firm size & integrations
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Specs Pills */}
                    <div className="mt-4 space-y-1.5 rounded-xl border border-line bg-paper-soft/60 p-2.5 text-[11.5px] text-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">Seats:</span>
                        <strong className="font-semibold">{plan.specs.users}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">Agents:</span>
                        <strong className="font-semibold text-moss">{plan.specs.agents}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">Support:</span>
                        <span className="truncate pl-2 text-right font-medium">
                          {plan.specs.support}
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="mt-5 flex-1 border-t border-line/80 pt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
                        What&apos;s included:
                      </p>
                      <ul className="mt-3 space-y-2 text-[12.5px] text-stone-700">
                        {plan.keyFeatures.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-moss/10 text-moss">
                              <Check className="size-2.5 stroke-[3]" />
                            </span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 pt-2">
                      {plan.id === "practice" || plan.id === "enterprise" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(
                              plan.id === "practice"
                                ? "Book a 20-minute Practice Demo"
                                : "Speak with our Enterprise Solutions Team",
                              plan.id
                            );
                          }}
                          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all ${
                            isSelected
                              ? "bg-moss text-white hover:bg-moss-deep shadow-md"
                              : "border border-line bg-white text-stone-950 hover:bg-paper-soft hover:border-stone-400"
                          }`}
                        >
                          {plan.ctaText}
                          <ArrowRight className="size-3.5" />
                        </button>
                      ) : (
                        <a
                          href={plan.ctaHref}
                          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all ${
                            isSelected || plan.highlighted
                              ? "bg-stone-950 text-white hover:bg-moss-deep shadow-md"
                              : "border border-line bg-white text-stone-950 hover:bg-paper-soft hover:border-stone-400"
                          }`}
                        >
                          {plan.ctaText}
                          <ArrowRight className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Interactive Practice Capacity & ROI Calculator */}
        <Reveal delay={0.15} className="mt-16">
          <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-white to-moss-soft/40 p-6 shadow-card md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
                  <Calculator className="size-3.5" />
                  Practice Capacity Calculator
                </p>
                <h3 className="display mt-2 text-[26px] sm:text-[34px]">
                  Calculate your firm&apos;s{" "}
                  <span className="font-serif-accent font-normal text-moss">
                    capacity created
                  </span>
                  .
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                  Don&apos;t just buy another software license. Add autonomous capacity to your existing practice without hiring overhead.
                </p>

                {/* Team size slider */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[14px]">
                    <label htmlFor="team-slider" className="font-medium text-stone-900">
                      Accountants &amp; staff in your practice:
                    </label>
                    <span className="display text-[22px] font-bold text-moss">
                      {teamSize} {teamSize === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <input
                    id="team-slider"
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                    className="mt-3 h-2 w-full cursor-pointer accent-moss"
                  />
                  <div className="flex justify-between text-[11px] text-ink-soft">
                    <span>1 solo practitioner</span>
                    <span>10 firm standard</span>
                    <span>25 growing practice</span>
                    <span>50+ multi-office</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] text-stone-800">
                    Average savings: <strong>10 hours/week</strong> per person
                  </span>
                  <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] text-stone-800">
                    Standard billable rate: <strong>£35/hr</strong>
                  </span>
                </div>
              </div>

              {/* Live Calculated Stats Card */}
              <div className="rounded-2xl border border-moss/30 bg-white p-6 shadow-sm">
                <p className="text-[12px] font-bold uppercase tracking-wider text-moss">
                  Projected Capacity Output
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-line bg-paper-soft p-3.5">
                    <p className="text-[12px] text-ink-soft">Hours saved weekly</p>
                    <p className="display mt-1 text-[28px] font-bold text-stone-950">
                      {hoursSavedWeekly.toLocaleString()}{" "}
                      <span className="text-[13px] font-normal text-ink-soft">hrs/wk</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-line bg-paper-soft p-3.5">
                    <p className="text-[12px] text-ink-soft">Capacity created yearly</p>
                    <p className="display mt-1 text-[28px] font-bold text-stone-950">
                      {hoursSavedYearly.toLocaleString()}{" "}
                      <span className="text-[13px] font-normal text-ink-soft">hrs/yr</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-moss/40 bg-moss-soft/60 p-4">
                  <p className="text-[12px] font-medium text-moss-deep">
                    Estimated annual client capacity unlocked:
                  </p>
                  <p className="display mt-0.5 text-[32px] font-extrabold text-moss-deep">
                    £{annualCapacityValue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11.5px] text-moss-deep/80">
                    Equivalent to ~{(hoursSavedYearly / 1600).toFixed(1)} full-time qualified accountants added to your practice.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-soft">
                      Recommended Plan:
                    </p>
                    <p className="text-[14px] font-bold text-stone-950">
                      {teamSize <= 5
                        ? "Starter or Professional"
                        : teamSize <= 20
                        ? "Professional (Most Popular)"
                        : "Practice or Enterprise"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenModal(
                        `Request Firm Onboarding for ${teamSize} Staff`,
                        teamSize > 20 ? "practice" : "professional"
                      )
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-stone-950 px-4 text-[13px] font-medium text-white transition-colors hover:bg-moss"
                  >
                    Unlock Capacity
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Combinely-Inspired "What's Included: One Subscription, Every Agent" */}
        <div className="mt-20">
          <SectionHeading
            align="center"
            eyebrow="What's Included Across Every Plan"
            title={
              <>
                One subscription.{" "}
                <span className="font-serif-accent font-normal text-moss">
                  Your whole practice
                </span>
                .
              </>
            }
            description="Don't pay separately for isolated point tools. FinAI provides specialized agents across every major accounting service line."
          />

          {/* Interactive Service Line Tabs & Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceLines.map((service) => {
              const Icon = service.icon;
              const isActive = activeService === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setActiveService(service.id)}
                  className={`group relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-all ${
                    isActive
                      ? "border-moss bg-white shadow-md ring-1 ring-moss"
                      : "border-line bg-white/90 hover:border-stone-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-moss-soft text-moss">
                      <Icon className="size-5" />
                    </span>
                    <h4 className="text-[16px] font-bold tracking-tight text-stone-950">
                      {service.title}
                    </h4>
                  </div>

                  <ul className="mt-4 flex-1 space-y-2 text-[13px] text-ink-soft">
                    {service.tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-moss" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-line/80 pt-3">
                    <span className="text-[11px] font-medium text-ink-soft">
                      Connects:
                    </span>
                    {service.tools.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-line bg-paper-soft px-2 py-0.5 text-[11px] font-medium text-stone-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* "What does AI actually save your firm?" Capacity Comparison Matrix */}
        <Reveal delay={0.12} className="mt-20">
          <div className="overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
                The Capacity Shift
              </p>
              <h3 className="display mt-1 text-[24px] sm:text-[30px]">
                Instead of selling &quot;AI&quot;, we sell the{" "}
                <span className="font-serif-accent font-normal text-moss">
                  capacity it creates
                </span>
                .
              </h3>
              <p className="mt-1 text-[14px] text-ink-soft">
                How routine partner and associate hours transform into high-margin advisory time:
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-paper-soft text-[12px] font-semibold text-stone-900">
                    <th className="py-3 pl-4 pr-3">Your team spends time on</th>
                    <th className="px-3 py-3 text-moss font-bold">
                      FinAI Agent Handles (Drafts &amp; Checks)
                    </th>
                    <th className="py-3 pl-3 pr-4 font-bold text-stone-950">
                      Your Accountants Focus On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {capacityRows.map((row, i) => (
                    <tr key={i} className="hover:bg-paper-soft/40 transition-colors">
                      <td className="py-3 pl-4 pr-3 font-medium text-stone-800">
                        {row.task}
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="size-3.5 text-moss shrink-0" />
                          {row.aiDoes}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-4 font-semibold text-moss-deep">
                        {row.teamDoes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* "Your accountants stay in control: Prepare -> Check -> Review -> Approve" */}
        <Reveal delay={0.14} className="mt-20">
          <div className="rounded-3xl border border-line bg-stone-950 p-8 text-white md:p-12">
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                Governance &amp; Trust Principle
              </p>
              <h3 className="display mx-auto mt-2 max-w-xl text-[26px] sm:text-[36px]">
                Your accountants always{" "}
                <span className="font-serif-accent font-normal text-emerald-400">
                  stay in control
                </span>
                .
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-[14.5px] text-stone-400">
                Nothing gets submitted, filed, or sent without human review. Every agent is built around four rigorous checkpoints:
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Prepare",
                  desc: "Agent ingests source documents, invoices, bank feeds, or ledger data to draft the preliminary workpapers.",
                },
                {
                  step: "02",
                  title: "Check",
                  desc: "Automated mathematical tie-outs, cross-period consistency checks, and tax rule verification highlight exceptions.",
                },
                {
                  step: "03",
                  title: "Review",
                  desc: "Your qualified accountant inspects findings with complete audit trails and clickable citation links.",
                },
                {
                  step: "04",
                  title: "Approve",
                  desc: "Only a verified human team member can authorize final submissions, reports, or journal postings.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
                >
                  <span className="font-mono text-[12px] font-bold text-emerald-400">
                    {s.step}
                  </span>
                  <h4 className="mt-2 text-[18px] font-bold text-white">
                    {s.title}
                  </h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-stone-300">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Feature Comparison Matrix */}
        <div className="mt-20">
          <SectionHeading
            align="center"
            eyebrow="Detailed Plan Comparison"
            title={
              <>
                Which plan is right for{" "}
                <span className="font-serif-accent font-normal text-moss">
                  your firm
                </span>
                ?
              </>
            }
            description="Clear transparent features across every tier with zero hidden add-ons."
          />

          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-paper-soft text-[12px] font-bold text-stone-900">
                    <th className="py-3.5 pl-6 pr-4">Feature / Capability</th>
                    <th className="px-4 py-3.5 text-center">Starter (£94)</th>
                    <th className="px-4 py-3.5 text-center text-moss bg-moss-soft/40">
                      Professional (£174)
                    </th>
                    <th className="px-4 py-3.5 text-center">Practice (£244)</th>
                    <th className="py-3.5 pl-4 pr-6 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {[
                    {
                      feat: "Ready-made accounting agents",
                      starter: "25+ agents",
                      pro: "50+ full fleet",
                      practice: "Unlimited",
                      ent: "Unlimited + Bespoke",
                    },
                    {
                      feat: "Bookkeeping & Bank Rec",
                      starter: "✓",
                      pro: "✓",
                      practice: "✓",
                      ent: "✓",
                    },
                    {
                      feat: "VAT Workings & Exception Checks",
                      starter: "Core VAT",
                      pro: "Advanced VAT",
                      practice: "Advanced VAT",
                      ent: "Custom VAT & Cross-Border",
                    },
                    {
                      feat: "Payroll Variance & Email Drafting",
                      starter: "—",
                      pro: "✓",
                      practice: "✓",
                      ent: "✓",
                    },
                    {
                      feat: "Corporation Tax (CT600) & Personal Tax",
                      starter: "—",
                      pro: "✓",
                      practice: "✓",
                      ent: "✓",
                    },
                    {
                      feat: "Outlook & Excel Add-ins",
                      starter: "Excel only",
                      pro: "Excel + Outlook",
                      practice: "Excel + Outlook",
                      ent: "Full Suite + API",
                    },
                    {
                      feat: "Practice Knowledge & Mailbox Context",
                      starter: "Basic",
                      pro: "Multi-client",
                      practice: "Practice-wide",
                      ent: "Dedicated Isolated Instance",
                    },
                    {
                      feat: "Custom Agents for Firm Workflows",
                      starter: "—",
                      pro: "—",
                      practice: "✓ Up to 10 custom",
                      ent: "Unlimited custom",
                    },
                    {
                      feat: "Team & Department Permissions",
                      starter: "Single team",
                      pro: "Standard RBAC",
                      practice: "Granular multi-branch",
                      ent: "Custom SSO & SCIM",
                    },
                    {
                      feat: "Implementation & Training",
                      starter: "Self-service guide",
                      pro: "Guided onboarding",
                      practice: "Dedicated specialist",
                      ent: "Executive pod",
                    },
                    {
                      feat: "Support SLA",
                      starter: "Business hours",
                      pro: "Priority (2h SLA)",
                      practice: "Priority 24/7",
                      ent: "15-min dedicated SLA",
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-paper-soft/40 transition-colors">
                      <td className="py-3 pl-6 pr-4 font-medium text-stone-900">
                        {row.feat}
                      </td>
                      <td className="px-4 py-3 text-center text-stone-600">
                        {row.starter}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-moss bg-moss-soft/20">
                        {row.pro}
                      </td>
                      <td className="px-4 py-3 text-center text-stone-800">
                        {row.practice}
                      </td>
                      <td className="py-3 pl-4 pr-6 text-center text-stone-800 font-medium">
                        {row.ent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-moss">
              Frequently Asked Questions
            </p>
            <h3 className="display mt-1 text-[24px] sm:text-[32px]">
              Everything you need to know about{" "}
              <span className="font-serif-accent font-normal text-moss">pricing</span>.
            </h3>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-line bg-white transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between p-5 text-left text-[15px] font-semibold text-stone-950 focus-visible:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-stone-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-moss" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="border-t border-line/70 px-5 pb-5 pt-3 text-[14px] leading-relaxed text-ink-soft">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Conversion Banner */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-moss/30 bg-moss text-white p-8 text-center shadow-lg md:p-14">
          <h3 className="display text-[28px] sm:text-[40px]">
            Give your accountants their{" "}
            <span className="font-serif-accent font-normal text-emerald-200">
              time back
            </span>
            .
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-emerald-100">
            Your clients don&apos;t need more administrative delays. Your team doesn&apos;t need another disconnected system. Your practice needs more capacity.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/agent"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-stone-950 transition-colors hover:bg-emerald-100"
            >
              Start Free Trial
              <ArrowRight className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => handleOpenModal("Book a 20-minute Practice Demo")}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              Book a Practice Demo
            </button>
          </div>

          <p className="mt-6 text-[12px] text-emerald-200/80">
            No credit card required · Instant setup · Cancel anytime · UK GDPR aligned
          </p>
        </div>
      </Container>

      {/* Interactive Demo / Sales Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-2xl md:p-8"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 rounded-full p-1.5 text-stone-400 hover:bg-paper-soft hover:text-stone-900"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>

              {formSubmitted ? (
                <div className="py-6 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-moss-soft text-moss">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                  <h4 className="mt-4 text-[20px] font-bold text-stone-950">
                    Request Received!
                  </h4>
                  <p className="mt-2 text-[14px] text-ink-soft">
                    Thank you, <strong>{formData.name || "there"}</strong>. Our UK practice solutions specialist will contact you at <strong>{formData.email}</strong> within 2 business hours with demo access and tailored onboarding details.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-stone-950 px-6 text-[13px] font-semibold text-white hover:bg-moss"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="text-[22px] font-bold tracking-tight text-stone-950">
                    {modalTitle}
                  </h4>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    Explore how FinAI&apos;s 50+ accounting agents automate month-end, VAT, payroll, and statutory accounts for your practice.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormSubmitted(true);
                    }}
                    className="mt-5 space-y-3.5"
                  >
                    <div>
                      <label className="block text-[12px] font-medium text-stone-900">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Jenkins, ACA"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[13.5px] text-stone-900 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-stone-900">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="sarah@firm.co.uk"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[13.5px] text-stone-900 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-stone-900">
                          Firm Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Jenkins &amp; Co Partners"
                          value={formData.firm}
                          onChange={(e) =>
                            setFormData({ ...formData, firm: e.target.value })
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[13.5px] text-stone-900 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-stone-900">
                          Target Plan
                        </label>
                        <select
                          value={selectedPlan}
                          onChange={(e) =>
                            setSelectedPlan(e.target.value as PlanTier)
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-stone-900 focus:border-moss focus:outline-none"
                        >
                          <option value="starter">Starter (£94/user/mo)</option>
                          <option value="professional">
                            Professional (£174/user/mo)
                          </option>
                          <option value="practice">
                            Practice (£244/user/mo)
                          </option>
                          <option value="enterprise">Enterprise (Custom)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-stone-900">
                          Team Size
                        </label>
                        <select
                          value={formData.teamSize}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamSize: parseInt(e.target.value, 10),
                            })
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-stone-900 focus:border-moss focus:outline-none"
                        >
                          <option value={1}>1-2 sole practitioners</option>
                          <option value={5}>3-9 small practice</option>
                          <option value={15}>10-25 mid-size practice</option>
                          <option value={40}>25-50+ multi-office firm</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-stone-900">
                        Primary Workflows of Interest (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Month-end close, VAT review, bank rec"
                        value={formData.note}
                        onChange={(e) =>
                          setFormData({ ...formData, note: e.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-[13.5px] text-stone-900 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                      />
                    </div>

                    <p className="text-[11px] text-ink-soft">
                      By submitting, you agree to our privacy policy. We will never share or sell your firm&apos;s contact information.
                    </p>

                    <button
                      type="submit"
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-moss text-[14px] font-semibold text-white shadow-md transition-colors hover:bg-moss-deep"
                    >
                      Confirm Demo Request
                      <ArrowRight className="size-4" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
