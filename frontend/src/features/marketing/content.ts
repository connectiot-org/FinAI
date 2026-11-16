import {
  BookOpen,
  ChartNoAxesCombined,
  CheckSquare,
  Files,
  Receipt,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
export type PreviewView =
  "overview" | "ledger" | "receivables" | "close" | "assistant";

// Product coverage mirrors the reference ERP taxonomy: a General ledger group
// (GL, close, AR, AP, bank reconciliation), an Advanced accounting group
// (revenue recognition, multi-entity, GAAP reporting, real-time reporting)
// and a Platform group (assistant, audit, security, integrations,
// implementation). All records stay FinAI's local synthetic demo.
export const products = [
  {
    slug: "automated-general-ledger",
    name: "General ledger",
    short: "Books that tell the whole story.",
    icon: BookOpen,
    view: "ledger" as PreviewView,
    title: "Your ledger, with every detail connected",
    description:
      "Follow every number from the financial statement to the journal that created it. Keep entries, reviews, and the full story together.",
    benefits: [
      [
        "A ledger with context",
        "Open a transaction, inspect its source, and follow a complete audit trail.",
      ],
      [
        "A review before every post",
        "Create balanced drafts, request approval, and keep posted history intact.",
      ],
      [
        "Clarity at every level",
        "Switch entity and period without losing sight of the details.",
      ],
    ],
  },
  {
    slug: "continuous-close",
    name: "Continuous close",
    short: "A close that never has to start over.",
    icon: RefreshCw,
    view: "close" as PreviewView,
    title: "Spread the close across the month, not the last week",
    description:
      "Checklists, reconciliations, and reviews that keep moving through the month, so period-end becomes a formality instead of a fire drill.",
    benefits: [
      [
        "Work that runs ahead",
        "Tasks, reviews, and reconciliations progress continuously instead of piling up at month-end.",
      ],
      [
        "A checklist that keeps itself honest",
        "Owners, due dates, evidence, and status stay current as the work happens.",
      ],
      [
        "Close with days to spare",
        "See close progress at any moment and know exactly what remains.",
      ],
    ],
  },
  {
    slug: "accounts-receivable",
    name: "Accounts receivable",
    short: "From invoice to insight.",
    icon: Receipt,
    view: "receivables" as PreviewView,
    title: "Keep your revenue moving. And your records connected.",
    description:
      "Bring customers, invoices, receipts, and the ledger into one considered workflow. Understand what is owed and what comes next.",
    benefits: [
      [
        "A clear view of what is owed",
        "Explore open, partially paid, and settled invoices with connected customer records.",
      ],
      [
        "From draft to receipt",
        "Build invoice lines, issue locally, and apply a demo receipt to see balances update.",
      ],
      [
        "Every receipt has a source",
        "Follow the connection from an invoice to cash and receivable journal entries.",
      ],
    ],
  },
  {
    slug: "accounts-payable",
    name: "Accounts payable",
    short: "A little order for every outflow.",
    icon: Wallet,
    view: "ledger" as PreviewView,
    title: "Less chasing paperwork. More knowing where things stand.",
    description:
      "Give every bill a place, an account, and a clear path to approval. See your spend with the context that matters.",
    benefits: [
      [
        "Documents beside decisions",
        "Preview a local document while reviewing a bill and its expense account.",
      ],
      [
        "Review, then approve",
        "Move from the inbox through review with clear local roles.",
      ],
      [
        "Nothing gets lost in the handoff",
        "Inspect approval history, source journals, and outstanding balances.",
      ],
    ],
  },
  {
    slug: "bank-reconciliation",
    name: "Bank reconciliation",
    short: "A clear match for every statement item.",
    icon: Wallet,
    view: "ledger" as PreviewView,
    title: "Bring the bank and the books together.",
    description:
      "Inspect a statement fixture, compare its suggested journal, and confirm or remove a local match.",
    benefits: [
      [
        "Compare both sides",
        "See statement amounts and suggested posted cash entries together.",
      ],
      [
        "Keep exceptions visible",
        "Unidentified items stay unmatched with a clear explanation.",
      ],
      [
        "Match, then inspect",
        "Confirm a local match and trace its journal without changing source history.",
      ],
    ],
  },
  {
    slug: "month-end-close",
    name: "Month-end close",
    short: "Finish the month on the same page.",
    icon: CheckSquare,
    view: "close" as PreviewView,
    title: "A close with fewer loose ends.",
    description:
      "Keep owners, evidence, and reviews in one shared checklist. Make the next step visible, from the first reconciliation to the final review.",
    benefits: [
      [
        "Everyone knows the next step",
        "See tasks, due dates, owners, and status in one place.",
      ],
      [
        "Evidence stays with the work",
        "Add a note or a session-local attachment to support a completed task.",
      ],
      [
        "Confidence before the lock",
        "Request a review, approve the work, and use a local period lock.",
      ],
    ],
  },
  {
    slug: "advanced-revenue-recognition",
    name: "Revenue recognition",
    short: "Contracts and recognized revenue, connected.",
    icon: ChartNoAxesCombined,
    view: "receivables" as PreviewView,
    title: "Keep the revenue story connected.",
    description:
      "Explore contract commitments, monthly recognition schedules, invoices, and the journals behind revenue.",
    benefits: [
      [
        "Start with the agreement",
        "Inspect customer contracts, terms, and monthly commitments.",
      ],
      [
        "Know what is recognized",
        "Only posted invoice revenue feeds these monthly-billed demo books.",
      ],
      [
        "See the source",
        "Open the customer, invoice, or ledger behind a schedule.",
      ],
    ],
  },
  {
    slug: "multi-entity",
    name: "Multi-entity accounting",
    short: "Distinct books. One considered workspace.",
    icon: BookOpen,
    view: "overview" as PreviewView,
    title: "A clear perspective on every entity.",
    description:
      "Switch between two functional-USD entities and explore an explicitly simulated consolidated overview.",
    benefits: [
      [
        "Keep books separate",
        "Entity selection scopes journal lines, records, and financial statements.",
      ],
      [
        "See the group view",
        "Compare USD entity results with a clearly labeled 1.00 simulated FX rate.",
      ],
      [
        "Trace the details",
        "Follow results into the active entity and its underlying books.",
      ],
    ],
  },
  {
    slug: "flexible-gaap-reporting",
    name: "Flexible GAAP reporting",
    short: "Statements shaped for every audience.",
    icon: Files,
    view: "overview" as PreviewView,
    title: "One set of books. Many ways to present it.",
    description:
      "Profit and loss, balance sheet, and cash flow built from the same posted ledger, with the grouping and presentation each audience needs.",
    benefits: [
      [
        "Built for the reader",
        "Board, lender, or auditor — each gets the view that answers their questions.",
      ],
      [
        "Grounded in posted entries",
        "Every figure traces to the same canonical journals.",
      ],
      [
        "Period comparisons made simple",
        "Move between periods and entities without rebuilding reports.",
      ],
    ],
  },
  {
    slug: "real-time-reporting",
    name: "Real-time reporting",
    short: "A view that stays connected to your ledger.",
    icon: ChartNoAxesCombined,
    view: "overview" as PreviewView,
    title: "Find the story behind the statement.",
    description:
      "Explore profit and loss, closing balances, and cash movements built from one canonical posted ledger.",
    benefits: [
      [
        "One set of numbers",
        "Reports, ledger, and overview share the same local records.",
      ],
      [
        "Change your perspective",
        "Select an entity and accounting period, then compare the results.",
      ],
      ["Share the details", "Export an actual CSV or print a statement."],
    ],
  },
  {
    slug: "financial-reporting",
    name: "Financial reporting",
    short: "The big picture, down to the entry.",
    icon: ChartNoAxesCombined,
    view: "overview" as PreviewView,
    title: "A clearer answer to “how are we doing?”",
    description:
      "Bring your profit and loss, balance sheet, and cash flow together. Make the numbers easier to explore, explain, and share.",
    benefits: [
      [
        "Built from the same books",
        "Financial statements use the same posted entries as the general ledger.",
      ],
      [
        "Context makes the difference",
        "Change period and entity, compare periods, and expand account groups.",
      ],
      [
        "Follow the number",
        "Drill into an account or export a real CSV for your own analysis.",
      ],
    ],
  },
  {
    slug: "assistant",
    name: "FinAI Assistant",
    short: "Questions, with the evidence attached.",
    icon: Sparkles,
    view: "assistant" as PreviewView,
    title: "Get to the answer. Stay close to the evidence.",
    description:
      "Explore a demonstration of conversational finance with local answers, source links, and actions that require your explicit approval.",
    benefits: [
      [
        "Your numbers, in context",
        "Ask supported questions about cash, revenue, open invoices, and close tasks.",
      ],
      [
        "Show the work",
        "Every supported answer points back to records in the demo workspace.",
      ],
      [
        "You make the final call",
        "Inspect a proposed local action and choose whether to approve it.",
      ],
    ],
  },
  {
    slug: "audit-compliance",
    name: "Audit & compliance",
    short: "Every change on the record.",
    icon: ShieldCheck,
    view: "close" as PreviewView,
    title: "Audit-ready books, with the trail to prove it.",
    description:
      "Every action leaves a reviewable trace. Follow any number to its source journal, its approvals, and the people behind the change.",
    benefits: [
      [
        "A trail behind every entry",
        "The audit log records what changed, when, and who made the call.",
      ],
      [
        "Approvals you can point to",
        "Review steps are explicit, owned, and preserved with the work.",
      ],
      [
        "Evidence, not screenshots",
        "Supporting records stay attached to the task they belong to.",
      ],
    ],
  },
  {
    slug: "security-permissions",
    name: "Security and permissions",
    short: "Reviewable actions and visible history.",
    icon: CheckSquare,
    view: "close" as PreviewView,
    title: "Clear roles. Reviewable decisions.",
    description:
      "Explore local Admin, Accountant, and Reviewer personas. These are UI permissions, not an authentication or security boundary.",
    benefits: [
      [
        "See the role difference",
        "Create with an Accountant and approve with a Reviewer.",
      ],
      [
        "Keep the audit trail",
        "Local mutations record their actual before and after state.",
      ],
      [
        "Review before acting",
        "Assistant proposals and accounting actions require explicit local decisions.",
      ],
    ],
  },
  {
    slug: "native-integrations",
    name: "Native integrations",
    short: "A connected stack, demonstrated locally.",
    icon: Wallet,
    view: "overview" as PreviewView,
    title: "Your finance stack. A connected view.",
    description:
      "Explore a simulated catalog of banking, payment, payroll, CRM, and notification connections.",
    benefits: [
      [
        "An honest simulation",
        "No external account, API, or credential is connected.",
      ],
      [
        "A clear connection flow",
        "Walk through local consent and save a demo connection state.",
      ],
      [
        "Inspect the activity",
        "Every simulated connection has a local sync log.",
      ],
    ],
  },
  {
    slug: "implementation",
    name: "Implementation",
    short: "From kickoff to first close, guided.",
    icon: Rocket,
    view: "overview" as PreviewView,
    title: "A guided path from your current books to FinAI.",
    description:
      "A structured onboarding: chart of accounts, opening balances, entities, and imports, with our team beside you at every step.",
    benefits: [
      [
        "A plan, not a project",
        "Kickoff, migration, and a first close with clear milestones.",
      ],
      [
        "Your chart, respected",
        "Bring your account structure; we map it instead of forcing ours.",
      ],
      [
        "Help that stays",
        "Guided check-ins through your first live close and beyond.",
      ],
    ],
  },
];

// Reference-style product menu taxonomy: General ledger / Advanced accounting
// / Platform, in the same order the reference ERP presents its products.
export const productNavGroups: { title: string; slugs: string[] }[] = [
  {
    title: "General ledger",
    slugs: [
      "automated-general-ledger",
      "continuous-close",
      "accounts-receivable",
      "accounts-payable",
      "bank-reconciliation",
      "month-end-close",
    ],
  },
  {
    title: "Advanced accounting",
    slugs: [
      "advanced-revenue-recognition",
      "multi-entity",
      "flexible-gaap-reporting",
      "real-time-reporting",
      "financial-reporting",
    ],
  },
  {
    title: "Platform",
    slugs: [
      "assistant",
      "audit-compliance",
      "security-permissions",
      "native-integrations",
      "implementation",
    ],
  },
];
export const questions = [
  {
    q: "What can I explore in this demo?",
    a: "A complete local accounting workspace: journal entries, invoices, bills, bank matching, close tasks, financial statements, entities, and more. The fictional Northstar Analytics dataset covers six months.",
  },
  {
    q: "Will this connect to my bank or move real money?",
    a: "No. Bank connections, receipts, and payments are explicitly simulated. You can explore their workflows without entering credentials or moving money.",
  },
  {
    q: "Is the assistant connected to an AI model?",
    a: "This demo uses deterministic answers from local records. It shows source evidence and an explicit approval flow, but makes no model or external service calls.",
  },
  {
    q: "Where do my changes go?",
    a: "Demo business records are saved in this browser. You can reset them in Settings → Preferences. Local document previews are session-only and are never uploaded.",
  },
  {
    q: "How do I get access to my own workspace?",
    a: "Request a demo. Our team walks you through FinAI with your workflow in mind, and your workspace is provisioned for you after the session — there is no public sign-up.",
  },
];
