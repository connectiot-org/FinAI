/**
 * Fintra — site data layer
 * All competitor facts below are compiled from publicly available sources
 * (company websites, vendor comparison posts, third-party pricing trackers)
 * as of September 2026. Anything that could not be confirmed from public
 * materials is explicitly marked "Not publicly verified".
 */

export type Verification = "verified" | "partial" | "unverified";

export interface Competitor {
  id: string;
  name: string;
  tagline: string;
  category: string;
  coreFeatures: string[];
  targetUsers: string;
  pricing: string;
  pricingVerified: Verification;
  aiModels: string;
  aiModelsVerified: Verification;
  financeFeatures: string;
  templatesWorkflows: string;
  marketingAcquisition: string;
  partnerships: string;
  strengths: string[];
  weaknesses: string[];
  url: string;
}

export const competitors: Competitor[] = [
  {
    id: "hebbia",
    name: "Hebbia",
    tagline: "AI search & deep research for finance and legal work",
    category: "AI document analysis / research",
    coreFeatures: [
      "Matrix-style AI search across thousands of documents",
      "Deep research agents for finance and legal workflows",
      "Document Q&A, extraction, and multi-document analysis",
    ],
    targetUsers: "Private equity, hedge funds, credit, and legal teams",
    pricing: "Enterprise sales; pricing not published. Third-party estimates of ARR (~$13M as of mid-2024, Sacra) suggest an enterprise-only motion.",
    pricingVerified: "partial",
    aiModels:
      "Public case study with OpenAI describes deep research powered by OpenAI models. Full model lineup: Not publicly verified.",
    aiModelsVerified: "partial",
    financeFeatures:
      "Strong: deal screening, diligence document review, and research automation marketed specifically at finance teams.",
    templatesWorkflows:
      "Markets pre-built finance use cases and agents; breadth of a reusable template library: Not publicly verified.",
    marketingAcquisition:
      "Enterprise content marketing, case studies (e.g., OpenAI case study claiming ~90% automation of certain finance/legal tasks), and word-of-mouth in PE circles.",
    partnerships:
      "Publicized OpenAI collaboration. Other integrations: Not publicly verified.",
    strengths: [
      "Deep finance-domain credibility with elite investment firms",
      "Powerful multi-document analysis at scale",
    ],
    weaknesses: [
      "Enterprise-only sales motion; no self-serve entry point publicly listed",
      "Pricing opacity makes adoption harder for smaller teams",
    ],
    url: "https://www.hebbia.com",
  },
  {
    id: "alphasense",
    name: "AlphaSense",
    tagline: "Enterprise market intelligence & search platform",
    category: "Market intelligence / investment research",
    coreFeatures: [
      "AI-powered search across filings, transcripts, and expert calls",
      "Generative summaries and monitoring of companies & themes",
      "Large proprietary content library",
    ],
    targetUsers: "Investment professionals, strategy and corporate development teams",
    pricing:
      "Subscription with annual contracts; third-party reporting (Sacra, Jul 2026) cites roughly $10,000–$20,000 per seat annually.",
    pricingVerified: "partial",
    aiModels:
      "Proprietary AI search/summarization stack; underlying model lineup: Not publicly verified.",
    aiModelsVerified: "unverified",
    financeFeatures:
      "Strong for investment research and market intelligence; not a general finance workspace (no close/FP&A workflow tooling publicly marketed).",
    templatesWorkflows:
      "Saved searches, watchlists, and monitoring; reusable multi-step workflow builder: Not publicly verified.",
    marketingAcquisition:
      "Content-led marketing (buyer guides, market reports), enterprise sales team, and a large public funding narrative (multi-billion valuation reported in 2023–2024).",
    partnerships:
      "Content partnerships with data providers are marketed; formal integration partnerships list: Not publicly verified.",
    strengths: [
      "Deep content library and enterprise trust",
      "Purpose-built for investment research workflows",
    ],
    weaknesses: [
      "Premium per-seat pricing limits accessibility",
      "Focused on research, not day-to-day finance execution (models, decks, close)",
    ],
    url: "https://www.alpha-sense.com",
  },
  {
    id: "datarails",
    name: "Datarails",
    tagline: "Excel-based FP&A platform with an AI assistant (FP&A Genius)",
    category: "FP&A / finance planning",
    coreFeatures: [
      "FP&A, budgeting, and consolidation on top of Excel",
      "FP&A Genius: generative AI assistant over a company's consolidated finance data",
      "Dashboards and management reporting",
    ],
    targetUsers: "SMB and mid-market finance teams, FP&A analysts, controllers",
    pricing:
      "Annual platform fee plus a one-time implementation fee; third-party guides cite starting around $20,000–$24,000/year for mid-market deployments.",
    pricingVerified: "partial",
    aiModels:
      "FP&A Genius runs on Datarails' own stack over company data; which LLMs are used: Not publicly verified.",
    aiModelsVerified: "unverified",
    financeFeatures:
      "Strong FP&A and reporting features; AI assistant is scoped to Datarails data rather than a general multi-model workspace.",
    templatesWorkflows:
      "FP&A report templates and Excel-based workflows are core to the product.",
    marketingAcquisition:
      "Excel-first positioning, SEO/content (pricing guides, comparisons), and implementation-led sales.",
    partnerships:
      "Deep Excel ecosystem integration is central; other formal partnerships: Not publicly verified.",
    strengths: [
      "Meets finance teams where they already are (Excel)",
      "AI assistant grounded in the company's actual consolidated data",
    ],
    weaknesses: [
      "Single-assistant AI experience rather than multi-model access",
      "Implementation cost and annual commitments reported by third parties",
    ],
    url: "https://www.datarails.com",
  },
  {
    id: "julius",
    name: "Julius AI",
    tagline: "AI data analyst: charts, models, and presentations from your data",
    category: "AI data analysis",
    coreFeatures: [
      "Natural-language data analysis over spreadsheets and databases",
      "Chart, dashboard, and presentation generation",
      "Library of pre-built notebooks including financial analysis",
    ],
    targetUsers: "Finance and data teams, analysts, researchers",
    pricing:
      "Publicly listed plans; third-party pricing guide (Coefficient, Apr 2026) cites a Business tier around $375/month (~$318/month billed annually).",
    pricingVerified: "partial",
    aiModels:
      "Uses multiple underlying AI models per its own marketing; exact current lineup: Not publicly verified.",
    aiModelsVerified: "partial",
    financeFeatures:
      "General data analysis that works well for financial datasets; no native close, audit, or FP&A planning modules.",
    templatesWorkflows:
      "Pre-built notebooks for common analyses (sales, financial, HR) act as templates; reusable workflow engine: Not publicly verified.",
    marketingAcquisition:
      "Self-serve PLG, SEO content (tool listicles, pricing pages), and product-led free trials.",
    partnerships:
      "Integrations with spreadsheets and databases are marketed; formal partnerships: Not publicly verified.",
    strengths: [
      "Fast time-to-value for charting and ad-hoc analysis",
      "Presentation and dashboard output in one tool",
    ],
    weaknesses: [
      "Generalist analysis tool — limited finance-specific workflow depth",
      "Per-seat pricing scales up for teams, per third-party guides",
    ],
    url: "https://julius.ai",
  },
  {
    id: "numeric",
    name: "Numeric",
    tagline: "AI-native close management for accounting teams",
    category: "Accounting automation / close management",
    coreFeatures: [
      "Month-end close checklists and task management",
      "AI-assisted reconciliations and flux/variance analysis",
      "Review dashboards and close reporting",
    ],
    targetUsers: "Controllers, accounting managers, close teams",
    pricing:
      "Unpublished; market-reported annual subscriptions roughly $20K–$80K depending on team size, entities, and AI scope (CFO Shortlist, Aug 2026).",
    pricingVerified: "partial",
    aiModels:
      "AI features for anomaly detection and analysis; underlying model lineup: Not publicly verified.",
    aiModelsVerified: "unverified",
    financeFeatures:
      "Deep in the close process (recons, flux, sign-offs); not a general assistant workspace.",
    templatesWorkflows:
      "Close checklists and recurring close workflows are core; broader template library: Not publicly verified.",
    marketingAcquisition:
      "Competitor-led comparison content, account-based enterprise sales, close-management category positioning.",
    partnerships:
      "ERP integrations are marketed; formal partnership programs: Not publicly verified.",
    strengths: [
      "Best-in-class focus on the month-end close problem",
      "AI applied to a narrow, high-pain accounting workflow",
    ],
    weaknesses: [
      "Scoped to close management — no general multi-model workspace",
      "Enterprise pricing tiers reported well above self-serve budgets",
    ],
    url: "https://www.numeric.io",
  },
];

/**
 * Comparison matrix — cell values use three honest states:
 *  yes       = capability is core to the product's public positioning
 *  partial   = related capability exists, but scoped or adjacent
 *  unverified= could not be confirmed from public materials as of Sep 2026
 */
export type CellStatus = "yes" | "partial" | "unverified";

export interface ComparisonRow {
  label: string;
  fintra: CellStatus;
  fintraNote?: string;
  summa?: CellStatus;
  summaNote?: string;
  cells: Record<string, { status: CellStatus; note?: string }>;
}

export const comparisonRows: ComparisonRow[] = [
  {
    label: "Multi-model AI access",
    fintra: "yes",
    fintraNote: "GPT, Claude, Gemini, DeepSeek & more in one chat",
    summa: "yes",
    summaNote: "GPT, Claude, Gemini, DeepSeek & more in one chat",
    cells: {
      hebbia: { status: "unverified", note: "OpenAI-powered per case study; full lineup not public" },
      alphasense: { status: "unverified", note: "Proprietary AI stack" },
      datarails: { status: "partial", note: "Single assistant (FP&A Genius)" },
      julius: { status: "partial", note: "Multiple models claimed; lineup not published" },
      numeric: { status: "unverified" },
    },
  },
  {
    label: "Finance-first workspace",
    fintra: "yes",
    fintraNote: "Built for analysts, accountants, auditors, FP&A",
    summa: "yes",
    summaNote: "Built for analysts, accountants, auditors, FP&A",
    cells: {
      hebbia: { status: "yes", note: "Finance & legal focus" },
      alphasense: { status: "yes", note: "Investment research focus" },
      datarails: { status: "yes", note: "FP&A focus" },
      julius: { status: "partial", note: "Generalist data analysis" },
      numeric: { status: "yes", note: "Close/accounting focus" },
    },
  },
  {
    label: "Financial analysis",
    fintra: "yes",
    fintraNote: "Variance, ratios, scenarios, document analysis",
    summa: "yes",
    summaNote: "Variance, ratios, scenarios, document analysis",
    cells: {
      hebbia: { status: "yes", note: "Document-heavy research & analysis" },
      alphasense: { status: "yes", note: "Market & company intelligence" },
      datarails: { status: "yes", note: "FP&A planning & reporting" },
      julius: { status: "yes", note: "Charts & analysis from data" },
      numeric: { status: "yes", note: "Flux & variance in close" },
    },
  },
  {
    label: "Report builder",
    fintra: "yes",
    fintraNote: "Outline → draft → export, with charts",
    summa: "yes",
    summaNote: "Outline → draft → export, with charts",
    cells: {
      hebbia: { status: "unverified" },
      alphasense: { status: "partial", note: "Excerpts & summaries" },
      datarails: { status: "yes", note: "Management reporting core" },
      julius: { status: "partial", note: "Dashboards & outputs" },
      numeric: { status: "partial", note: "Close reporting" },
    },
  },
  {
    label: "Presentation builder",
    fintra: "yes",
    fintraNote: "Generate branded decks from your work",
    summa: "yes",
    summaNote: "Generate branded decks from your work",
    cells: {
      hebbia: { status: "unverified" },
      alphasense: { status: "unverified" },
      datarails: { status: "unverified" },
      julius: { status: "yes", note: "Markets presentation generation" },
      numeric: { status: "unverified" },
    },
  },
  {
    label: "Error & consistency checking",
    fintra: "yes",
    fintraNote: "Ties, formulas, cross-document inconsistencies",
    summa: "yes",
    summaNote: "Ties, formulas, cross-document inconsistencies",
    cells: {
      hebbia: { status: "unverified" },
      alphasense: { status: "unverified" },
      datarails: { status: "unverified" },
      julius: { status: "unverified" },
      numeric: { status: "partial", note: "Anomaly detection in close" },
    },
  },
  {
    label: "Templates",
    fintra: "yes",
    fintraNote: "Reusable finance templates, saved per team",
    summa: "yes",
    summaNote: "Reusable finance templates, saved per team",
    cells: {
      hebbia: { status: "unverified" },
      alphasense: { status: "partial", note: "Saved searches & monitors" },
      datarails: { status: "yes", note: "FP&A report templates" },
      julius: { status: "yes", note: "Pre-built notebooks" },
      numeric: { status: "partial", note: "Close checklists" },
    },
  },
  {
    label: "Reusable workflows",
    fintra: "yes",
    fintraNote: "Save any run as a repeatable workflow",
    summa: "yes",
    summaNote: "Save any run as a repeatable workflow",
    cells: {
      hebbia: { status: "partial", note: "Agent-driven research flows" },
      alphasense: { status: "unverified" },
      datarails: { status: "partial", note: "Excel process workflows" },
      julius: { status: "unverified" },
      numeric: { status: "yes", note: "Recurring close workflows" },
    },
  },
  {
    label: "Intelligent model routing",
    fintra: "yes",
    fintraNote: "Usage-aware failover across models",
    summa: "yes",
    summaNote: "Usage-aware failover across models",
    cells: {
      hebbia: { status: "unverified" },
      alphasense: { status: "unverified" },
      datarails: { status: "unverified" },
      julius: { status: "unverified" },
      numeric: { status: "unverified" },
    },
  },
];

export interface AIModel {
  id: string;
  family: string;
  vendor: string;
  mark: string;
  accentClass: string;
  strength: string;
  blurb: string;
}

export const aiModels: AIModel[] = [
  {
    id: "gpt",
    family: "GPT",
    vendor: "OpenAI",
    mark: "GPT",
    accentClass: "bg-stone-950 text-white",
    strength: "Versatile reasoning",
    blurb: "General-purpose drafting, analysis, and long-form structuring.",
  },
  {
    id: "claude",
    family: "Claude",
    vendor: "Anthropic",
    mark: "C",
    accentClass: "bg-[#d97757] text-white",
    strength: "Long-document review",
    blurb: "Careful reading of dense contracts, filings, and policies.",
  },
  {
    id: "gemini",
    family: "Gemini",
    vendor: "Google",
    mark: "G",
    accentClass: "bg-[#3d7a5c] text-white",
    strength: "Multimodal context",
    blurb: "Works across text, tables, and scanned document images.",
  },
  {
    id: "deepseek",
    family: "DeepSeek",
    vendor: "DeepSeek",
    mark: "DS",
    accentClass: "bg-[#2b3a67] text-white",
    strength: "Cost-efficient depth",
    blurb: "Strong reasoning per credit — useful for bulk runs and sweeps.",
  },
];

export interface AgentCard {
  name: string;
  role: string;
  description: string;
  output: string;
  icon: string;
}

export const agents: AgentCard[] = [
  {
    name: "Variance Agent",
    role: "FP&A",
    description:
      "Compares actuals vs. budget vs. prior period, drafts the commentary, and cites the drivers it found.",
    output: "Variance memo + exhibit tables",
    icon: "trending",
  },
  {
    name: "Close Agent",
    role: "Accounting",
    description:
      "Walks your close checklist, ties schedules, and flags items that need a human sign-off before posting.",
    output: "Close status report",
    icon: "checklist",
  },
  {
    name: "Audit Prep Agent",
    role: "Audit",
    description:
      "Organizes PBC requests, tests consistency across schedules, and prepares reviewer-ready workpapers.",
    output: "PBC tracker + findings",
    icon: "audit",
  },
  {
    name: "Diligence Agent",
    role: "Advisory",
    description:
      "Reads data rooms, extracts key financials, and builds a first-pass quality-of-earnings question list.",
    output: "Diligence brief",
    icon: "search",
  },
  {
    name: "Board Pack Agent",
    role: "CFO Office",
    description:
      "Assembles the monthly board deck from your templates — KPIs, charts, and commentary in your brand.",
    output: "Board deck (PPTX)",
    icon: "deck",
  },
  {
    name: "Document Reader Agent",
    role: "Research",
    description:
      "Ingests filings, policies, and statements; answers questions with page-level citations you can verify.",
    output: "Cited answer set",
    icon: "file",
  },
];

export const templates: { name: string; category: string; uses: string }[] = [
  { name: "Monthly board pack", category: "Reporting", uses: "Deck + commentary" },
  { name: "Budget vs. actual memo", category: "FP&A", uses: "Report" },
  { name: "Flux analysis write-up", category: "Accounting", uses: "Report" },
  { name: "Investor update", category: "Comms", uses: "Email + deck" },
  { name: "Audit PBC checklist", category: "Audit", uses: "Tracker" },
  { name: "QoE question list", category: "Advisory", uses: "Document" },
  { name: "13-week cash flow review", category: "Treasury", uses: "Analysis" },
  { name: "Revenue recognition check", category: "Accounting", uses: "Review" },
];
