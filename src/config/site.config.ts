/**
 * Fintra Platform Site Configuration
 * Single source of truth for marketing metadata, navigation, agent definitions, and primary CTAs.
 */

export const siteConfig = {
  name: "Fintra",
  tagline: "AI-Native Financial Intelligence Platform",
  description:
    "An AI-native financial intelligence platform for CFOs, controllers, FP&A leads, and analysts. Multi-model routing, auditable steps, and evidence-backed figures.",
  url: "https://fintra.ai",
  ogImage: "https://fintra.ai/og.png",
  links: {
    twitter: "https://twitter.com/fintra_ai",
    github: "https://github.com/fintra-ai",
  },
  primaryCta: {
    label: "Launch Workspace",
    href: "/agent",
  },
  announcement: {
    enabled: true,
    text: "Fintra Workspace Private Beta is live — Experience multi-model financial orchestration",
    href: "/agent",
  },
  navigation: {
    main: [
      { label: "Workspace", href: "/agent" },
      { label: "Multi-Model", href: "#models" },
      { label: "Analysis", href: "#analysis" },
      { label: "Reports", href: "#reports" },
      { label: "Compare", href: "#compare" },
      { label: "Security", href: "#security" },
      { label: "Routing", href: "#routing" },
    ],
    agentRoster: [
      {
        id: "variance-agent",
        name: "Variance & Flux Agent",
        desc: "Automated general ledger flux analysis and flux memo generation.",
        tier: "Balanced",
      },
      {
        id: "board-pack-agent",
        name: "Board Pack Agent",
        desc: "Transforms close numbers into board-ready presentation decks with commentary.",
        tier: "Reasoning",
      },
      {
        id: "reconciliation-agent",
        name: "Reconciliation Agent",
        desc: "Three-way balance sheet tie-outs and transaction anomaly detection.",
        tier: "Fast",
      },
      {
        id: "runway-agent",
        name: "Runway & Cash Forecasting Agent",
        desc: "13-week direct cash flow projection and burn variance alerting.",
        tier: "Reasoning",
      },
      {
        id: "close-checklist-agent",
        name: "Month-End Close Agent",
        desc: "Continuous close tracking, PBC schedule reviews, and sign-off workflows.",
        tier: "Fast",
      },
      {
        id: "audit-prep-agent",
        name: "Audit PBC Assistant",
        desc: "Cross-checks workpapers against auditor sampling and ASC 606 / IFRS standards.",
        tier: "Finance Specialist",
      },
      {
        id: "qoe-agent",
        name: "Quality of Earnings Agent",
        desc: "Normalization schedule builder and EBITDA bridge calculator for M&A diligence.",
        tier: "Reasoning",
      },
      {
        id: "kpi-digest-agent",
        name: "Executive KPI Digest",
        desc: "Weekly executive briefing aggregating ARR, net burn, and headcount changes.",
        tier: "Balanced",
      },
    ],
  },
} as const;
