"use client";

import { useState, useRef, useEffect } from "react";
import { modelsConfig, ModelConfig } from "@/config/models.config";
import { WorkspaceShell } from "@/components/agent/workspace-shell";
import { ThreadSidebar, ViewId } from "@/components/agent/thread-sidebar";
import { ThreadCanvas, MessageItem } from "@/components/agent/thread-canvas";
import { Composer, AttachedFile, formatFileSize } from "@/components/agent/composer";
import { FinancialContextCard } from "@/components/agent/financial-context-card";
import { EvidencePanel } from "@/components/agent/evidence-panel";
import { useThreadStream } from "@/lib/use-thread-stream";
import { useSession } from "next-auth/react";
import { datasetStore } from "@/lib/storage/dataset-store";
import { FileAttachmentCard } from "@/components/agent/file-attachment-card";
import { toast } from "sonner";
import {
  parseFinancialCsv,
  validateFinancialQueryGrounding,
  buildGroundingContext,
  generateDeterministicDatasetSummary,
  ParsedFinancialDataset,
  FinancialDataRow,
} from "@/lib/financial-dataset-engine";
import {
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Route,
  Pin,
  X,
  Database,
  Download,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  Building2,
  Layers,
  FileText,
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Play,
  Trash2,
  Printer,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  Info,
  Calendar,
} from "lucide-react";

export interface ThreadData {
  id: string;
  title: string;
  updatedAt?: string;
  messages: MessageItem[];
  attachedFiles?: AttachedFile[];
  dataset?: ParsedFinancialDataset;
}

export interface CustomTemplate {
  id: string;
  name: string;
  category: string;
  meta: string;
  description: string;
  prompt: string;
  visuals: string[];
  isCustom?: boolean;
}

const defaultEnterpriseDataset: FinancialDataRow[] = [
  { Year: 2022, Company: "AAPL", Category: "Consumer Tech", "Market Cap(in B USD)": 2066.9, Revenue: 394328, "Gross Profit": 170782, "Net Income": 99803, "Net Profit Margin": 25.3, EBITDA: 130541 },
  { Year: 2021, Company: "AAPL", Category: "Consumer Tech", "Market Cap(in B USD)": 2913.3, Revenue: 365817, "Gross Profit": 152836, "Net Income": 94680, "Net Profit Margin": 25.9, EBITDA: 123136 },
  { Year: 2020, Company: "AAPL", Category: "Consumer Tech", "Market Cap(in B USD)": 2255.9, Revenue: 274515, "Gross Profit": 104956, "Net Income": 57411, "Net Profit Margin": 20.9, EBITDA: 81020 },
  { Year: 2019, Company: "AAPL", Category: "Consumer Tech", "Market Cap(in B USD)": 1287.6, Revenue: 260174, "Gross Profit": 98392, "Net Income": 55256, "Net Profit Margin": 21.2, EBITDA: 81860 },
  
  { Year: 2022, Company: "MSFT", Category: "Cloud & Software", "Market Cap(in B USD)": 1787.7, Revenue: 198270, "Gross Profit": 135620, "Net Income": 72738, "Net Profit Margin": 36.7, EBITDA: 97840 },
  { Year: 2021, Company: "MSFT", Category: "Cloud & Software", "Market Cap(in B USD)": 2525.1, Revenue: 168088, "Gross Profit": 115856, "Net Income": 61271, "Net Profit Margin": 36.5, EBITDA: 80816 },
  { Year: 2020, Company: "MSFT", Category: "Cloud & Software", "Market Cap(in B USD)": 1681.6, Revenue: 143015, "Gross Profit": 96937, "Net Income": 44281, "Net Profit Margin": 31.0, EBITDA: 65259 },
  { Year: 2019, Company: "MSFT", Category: "Cloud & Software", "Market Cap(in B USD)": 1200.3, Revenue: 125843, "Gross Profit": 82990, "Net Income": 39240, "Net Profit Margin": 31.2, EBITDA: 54641 },
  
  { Year: 2022, Company: "GOOG", Category: "Search & Cloud", "Market Cap(in B USD)": 1145.2, Revenue: 282836, "Gross Profit": 156633, "Net Income": 59972, "Net Profit Margin": 21.2, EBITDA: 90770 },
  { Year: 2021, Company: "GOOG", Category: "Search & Cloud", "Market Cap(in B USD)": 1917.4, Revenue: 257637, "Gross Profit": 146698, "Net Income": 76033, "Net Profit Margin": 29.5, EBITDA: 91155 },
  { Year: 2020, Company: "GOOG", Category: "Search & Cloud", "Market Cap(in B USD)": 1185.3, Revenue: 182527, "Gross Profit": 97795, "Net Income": 40269, "Net Profit Margin": 22.1, EBITDA: 54615 },
  { Year: 2019, Company: "GOOG", Category: "Search & Cloud", "Market Cap(in B USD)": 921.1, Revenue: 161857, "Gross Profit": 89081, "Net Income": 34343, "Net Profit Margin": 21.2, EBITDA: 47254 },

  { Year: 2022, Company: "AMZN", Category: "E-Commerce & AWS", "Market Cap(in B USD)": 856.9, Revenue: 513983, "Gross Profit": 225152, "Net Income": -2722, "Net Profit Margin": -0.5, EBITDA: 54169 },
  { Year: 2021, Company: "AMZN", Category: "E-Commerce & AWS", "Market Cap(in B USD)": 1691.0, Revenue: 469822, "Gross Profit": 197478, "Net Income": 33364, "Net Profit Margin": 7.1, EBITDA: 59175 },
  
  { Year: 2022, Company: "NVDA", Category: "Semiconductors", "Market Cap(in B USD)": 364.6, Revenue: 26974, "Gross Profit": 17475, "Net Income": 9752, "Net Profit Margin": 36.2, EBITDA: 11219 },
  { Year: 2021, Company: "NVDA", Category: "Semiconductors", "Market Cap(in B USD)": 735.3, Revenue: 16675, "Gross Profit": 10850, "Net Income": 4332, "Net Profit Margin": 26.0, EBITDA: 5691 },

  { Year: 2022, Company: "INTC", Category: "Semiconductors", "Market Cap(in B USD)": 108.7, Revenue: 63054, "Gross Profit": 26866, "Net Income": 8017, "Net Profit Margin": 12.7, EBITDA: 15332 },
  { Year: 2021, Company: "INTC", Category: "Semiconductors", "Market Cap(in B USD)": 209.6, Revenue: 79024, "Gross Profit": 43815, "Net Income": 19868, "Net Profit Margin": 25.1, EBITDA: 32679 },
];

const defaultTemplates: CustomTemplate[] = [
  {
    id: "tpl-1",
    name: "Monthly Board Pack",
    category: "Executive Reporting",
    meta: "Deck & Memo · 12 Slides",
    description: "Synthesizes monthly opex, gross margin bridge, and 12-month trailing EBITDA for board presentation.",
    prompt: "Generate a comprehensive Monthly Board Pack summary. Include a revenue bridge, opex variance breakdown across R&D, S&M, and G&A, headcount flux, and key risk highlights for the board.",
    visuals: ["Waterfall Revenue Bridge", "Opex Variance Schedule", "Headcount Flux Heatmap"],
  },
  {
    id: "tpl-2",
    name: "Budget vs. Actual (BvA) Memo",
    category: "FP&A & Cost Control",
    meta: "Report · 4 Pages",
    description: "Multi-tier flux analysis identifying drivers behind lines with >5% or >$50k variance against forecast.",
    prompt: "Conduct an end-to-end Budget vs. Actual (BvA) variance decomposition for the active period. Highlight the top 3 unfavorable variances, isolate timing vs permanent overruns, and propose offsetting cost saves.",
    visuals: ["Variance Bar Chart", "Driver Attribution Table", "Corrective Action Matrix"],
  },
  {
    id: "tpl-3",
    name: "13-Week Cash & Runway Model",
    category: "Treasury & Working Capital",
    meta: "Analysis · Rolling Model",
    description: "Deterministic rolling cash forecast incorporating DSO, DPO, payroll cycles, and capex milestones.",
    prompt: "Build a 13-week rolling cash flow forecast. Model customer receipts based on current AR aging, vendor disbursements, payroll runs, and compute remaining runway in weeks under both base and downside scenarios.",
    visuals: ["Rolling Cash Balance Area Chart", "Disbursement Schedule", "DSO & DPO Trend Plot"],
  },
  {
    id: "tpl-4",
    name: "Cloud & Infrastructure Cost Audit",
    category: "Vendor & Tech Spend",
    meta: "Audit · Multi-Cloud",
    description: "Isolates AWS, Snowflake, Datadog, and GCP spend spikes, reserved instance lapses, and staging idle waste.",
    prompt: "Audit cloud infrastructure expenditures across AWS, Snowflake, and Datadog. Identify unbudgeted service spikes, on-demand compute overages, log retention bloat, and quantify monthly savings if decommissioned.",
    visuals: ["Cloud Spend Breakdown Bar Chart", "RI/Savings Plan Coverage", "Savings Reclamation Tracker"],
  },
  {
    id: "tpl-5",
    name: "Enterprise Peer Benchmarking",
    category: "Strategic Finance",
    meta: "Comparative · 6 Peers",
    description: "Evaluates revenue scale, gross margins, EBITDA, and valuation multiples across industry peers.",
    prompt: "Perform a peer group benchmark comparing AAPL, MSFT, GOOG, AMZN, NVDA, and INTC. Evaluate revenue CAGR, gross profit margins, net income conversion, and enterprise valuation metrics.",
    visuals: ["Comparative Margin Plot", "Valuation Multiple Matrix", "Growth vs Profitability Scatter"],
  },
  {
    id: "tpl-6",
    name: "Audit PBC Tie-Out & Compliance",
    category: "Audit & Controllership",
    meta: "Tracker · 38 Items",
    description: "Pre-audit PBC tie-outs connecting trial balance lines to subledger schedules with zero variance tolerance.",
    prompt: "Prepare an audit PBC tie-out schedule. Reconcile general ledger balances against subledger detail, identify unvouched manual journal entries, and compile supporting document citations.",
    visuals: ["PBC Item Status Progress", "GL to Subledger Reconciliation", "Audit Readiness Scorecard"],
  },
];

const initialThreads: ThreadData[] = [
  {
    id: "th-1",
    title: "Q3 Actuals vs Budget Variance",
    updatedAt: "Today, 10:42 AM",
    attachedFiles: [
      { id: "f-1-1", name: "q3_actuals.xlsx", size: 1420000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { id: "f-1-2", name: "q3_budget.xlsx", size: 845000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    ],
    messages: [
      {
        id: "m-1-1",
        role: "user",
        content: "Compare Q3 actuals vs. budget and flag anything unusual in opex.",
        files: ["q3_actuals.xlsx", "q3_budget.xlsx"],
      },
      {
        id: "m-1-2",
        role: "assistant",
        content:
          "I compared Q3 actuals to budget across all opex lines. Overall spend is **$23.1M** vs. a **$22.4M** plan (+3.1%). Two lines stand out — cloud infrastructure is +18.4% over plan, driven by the July data-platform migration, and contractor spend is +12.7% ahead of budget with no matching PO increase. Payroll, marketing, and travel are within normal bands.\n\nWant me to draft the variance memo and attach the supporting schedules?",
        model: "Claude 3.5 Sonnet",
        tableData: [
          { line: "Payroll & benefits", budget: "$4.82M", actual: "$4.97M", var: "+3.2%", flag: false },
          { line: "Cloud & infrastructure", budget: "$0.92M", actual: "$1.09M", var: "+18.4%", flag: true },
          { line: "Contractors", budget: "$0.63M", actual: "$0.71M", var: "+12.7%", flag: true },
          { line: "Marketing programs", budget: "$1.10M", actual: "$1.01M", var: "-8.1%", flag: false },
          { line: "Travel & T&E", budget: "$0.40M", actual: "$0.42M", var: "+5.0%", flag: false },
        ],
        evidence: ["Sep P&L · 1,284 lines · quality 98.2", "GL 6100 · 84 lines", "TXN-8841 · $12.4K"],
      },
    ],
  },
  {
    id: "th-2",
    title: "Cloud Infrastructure Reconciliation",
    updatedAt: "Today, 8:15 AM",
    attachedFiles: [
      { id: "f-2-1", name: "aws_billing_q3.csv", size: 482000, type: "text/csv" },
      { id: "f-2-2", name: "datadog_invoices.pdf", size: 1250000, type: "application/pdf" },
    ],
    messages: [
      {
        id: "m-2-1",
        role: "user",
        content: "Deep-dive into the +18.4% cloud infrastructure overrun. Break down AWS vs Datadog vs Snowflake spend.",
        files: ["aws_billing_q3.csv", "datadog_invoices.pdf"],
      },
      {
        id: "m-2-2",
        role: "assistant",
        content:
          "Here is the detailed reconciliation of the **$1.09M** Cloud Infrastructure spend for Q3 (budget was **$0.92M**, variance **+$170K / +18.4%**):\n\n- **Snowflake Compute & Storage**: **$482K** vs $390K plan (+23.6%). The July data-warehouse migration ran dual-write clusters for 6 weeks, which were not phased out until late August.\n- **AWS EC2 & Kubernetes (EKS)**: **$418K** vs $380K plan (+10.0%). Reserved Instance expirations in June were temporarily billed at on-demand rates before 1-year Savings Plans kicked in.\n- **Datadog & Monitoring**: **$190K** vs $150K plan (+26.7%). Log ingestion spiked by 4.2TB due to verbose audit logging enabled during the SOC 2 compliance readiness audit.\n\n### Actionable Recommendations\n1. **Decommission legacy clusters**: Decommissioning the legacy staging clusters will recover **$38K/month** starting next billing cycle.\n2. **Datadog log filter**: Adjust retention policy on non-prod clusters to save **$12K/month**.",
        model: "Auto (Smart Router)",
        tableData: [
          { line: "Snowflake Compute & Storage", budget: "$390K", actual: "$482K", var: "+23.6%", flag: true },
          { line: "AWS Core Infrastructure", budget: "$380K", actual: "$418K", var: "+10.0%", flag: true },
          { line: "Datadog Observability", budget: "$150K", actual: "$190K", var: "+26.7%", flag: true },
        ],
        evidence: ["AWS Cur-Report-0924 · 18,204 rows", "Snowflake Account Usage Warehouses", "Datadog Invoice #DD-89912"],
      },
    ],
  },
  {
    id: "th-3",
    title: "Contractor Spend Memo",
    updatedAt: "Yesterday",
    attachedFiles: [
      { id: "f-3-1", name: "contractor_timesheets_q3.xlsx", size: 910000, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    ],
    messages: [
      {
        id: "m-3-1",
        role: "user",
        content: "Draft a contractor spend memo for the VP of Finance highlighting unbudgeted vendor hours.",
        files: ["contractor_timesheets_q3.xlsx"],
      },
      {
        id: "m-3-2",
        role: "assistant",
        content:
          "### Memorandum: Q3 FY26 External Contractor & Advisory Spend Review\n\n**To**: VP of Finance  \n**From**: Senior FP&A Controller  \n**Date**: October 14, 2026  \n**Subject**: Contractor Spend Variance Analysis & Unbudgeted Vendor Invoices  \n\n#### Executive Summary\nTotal Q3 contractor spend reached **$710,000** against a budgeted allocation of **$630,000** (+$80,000 / +12.7%). The overrun is concentrated in two technical engagements without approved purchase order amendments:\n\n1. **DevOps Migration Consultants (ApexCloud LLC)**: $45K over budget. 180 additional contractor hours billed to support the cutover window.\n2. **Security Remediation Team (CyberShield Group)**: $35K over budget. Engagement extended past original September 15 SOW completion milestone.\n\n#### Recommended Internal Controls\n- Implement automated Coupa PO hard-stops preventing invoice approval when billed amount exceeds 105% of PO ceiling.\n- Require departmental VP sign-off for contractor time extensions exceeding 40 cumulative hours.",
        model: "Claude 3.5 Sonnet",
        evidence: ["Coupa PO Log 2026-Q3", "Timesheet Verification Matrix · 94 records"],
      },
    ],
  },
];

const initialEmptyThread: ThreadData = {
  id: "th-new",
  title: "New Conversation",
  updatedAt: "Just now",
  messages: [],
  attachedFiles: [],
  dataset: undefined,
};

export default function WorkspacePage() {
  const { data: session } = useSession();
  const [activeView, setActiveView] = useState<ViewId>("chat");
  const [activeTabLabel, setActiveTabLabel] = useState("Chat");
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(modelsConfig[0]);
  const [answerMode, setAnswerMode] = useState<"quick" | "deep">("deep");
  const [threads, setThreads] = useState<ThreadData[]>([initialEmptyThread, ...initialThreads]);
  const [activeThreadId, setActiveThreadId] = useState<string>("th-new");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dynamic token & credit usage tracking (Review Item 4)
  const [tokensUsed, setTokensUsed] = useState(1840);
  const [creditsPercent, setCreditsPercent] = useState(82);

  // Financial Analysis dynamic states (Review Items 5 & 6)
  const [analysisCompany, setAnalysisCompany] = useState<string>("ALL");
  const [analysisMetric, setAnalysisMetric] = useState<"Revenue" | "Gross Profit" | "Net Income" | "Net Profit Margin" | "Market Cap(in B USD)">("Revenue");
  const [analysisYear, setAnalysisYear] = useState<number>(2022);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [analysisSearch, setAnalysisSearch] = useState<string>("");

  // Reports executive summary tab state
  const [reportActiveTab, setReportActiveTab] = useState<"briefing" | "variance" | "drivers" | "recommendations" | "audit">("briefing");
  const [reportCopied, setReportCopied] = useState(false);

  // Templates state & custom template creation modal (Review Item 6)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CustomTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("FP&A & Cost Control");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");
  const [newTemplateVisuals, setNewTemplateVisuals] = useState<string[]>(["Variance Bar Chart", "Driver Attribution Table"]);

  // Track dynamic token consumption
  const trackTokenUsage = (inLen: number, outLen: number = 0) => {
    const added = Math.max(90, Math.ceil(inLen / 4) + Math.ceil(outLen / 4));
    setTokensUsed((prev) => {
      const next = prev + added;
      const budget = 10000;
      const pct = Math.max(5, Math.min(100, Math.round(((budget - next) / budget) * 100)));
      setCreditsPercent(pct);
      return next;
    });
  };

  // Restore history & custom templates from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fintra_threads_v4");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validSaved: ThreadData[] = parsed
              .filter((t: ThreadData) => t.messages && t.messages.length > 0)
              .map((t: ThreadData, i: number) =>
                t.id === "th-new" ? { ...t, id: `th-saved-${i}-${Date.now()}` } : t
              );

            const seen = new Set<string>(["th-new"]);
            const deduped: ThreadData[] = [];
            for (const t of validSaved) {
              if (t.id && !seen.has(t.id)) {
                seen.add(t.id);
                deduped.push(t);
              }
            }

            const rehydrated = deduped.map((t) => {
              const defaultThread = initialThreads.find((it) => it.id === t.id);
              const storedDs = datasetStore.getDatasetByThread(t.id);
              const storedFiles = datasetStore.getThreadFiles(t.id);
              return {
                ...t,
                dataset: storedDs || t.dataset || defaultThread?.dataset,
                attachedFiles:
                  storedFiles.length > 0
                    ? storedFiles
                    : t.attachedFiles && t.attachedFiles.length > 0
                    ? t.attachedFiles
                    : defaultThread?.attachedFiles || [],
              };
            });

            setThreads([initialEmptyThread, ...rehydrated]);
          }
        }

        const savedTpl = localStorage.getItem("finai_custom_templates");
        if (savedTpl) {
          const parsedTpl = JSON.parse(savedTpl);
          if (Array.isArray(parsedTpl)) {
            setCustomTemplates(parsedTpl);
          }
        }
      } catch {}
    }
  }, []);

  // Sync threads to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const toSave = threads.filter(
          (t) => t.id !== "th-new" && t.messages && t.messages.length > 0
        );
        if (toSave.length > 0) {
          localStorage.setItem("fintra_threads_v4", JSON.stringify(toSave));
        }
      } catch {}
    }
  }, [threads]);

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || initialEmptyThread;

  const messages = activeThread.messages;

  const {
    isStreaming,
    streamText,
    steps,
    evidence,
    isStopped,
    startStream,
    stopStream,
  } = useThreadStream({
    modelId: selectedModel.modelId,
    answerMode,
  });

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setActiveView("chat");
    setActiveTabLabel("Chat");
    setIsMobileSidebarOpen(false);

    const defaultThread = initialThreads.find((it) => it.id === id);
    const storedDs = datasetStore.getDatasetByThread(id);
    const storedFiles = datasetStore.getThreadFiles(id);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              dataset: storedDs || t.dataset || defaultThread?.dataset,
              attachedFiles:
                storedFiles.length > 0
                  ? storedFiles
                  : t.attachedFiles && t.attachedFiles.length > 0
                  ? t.attachedFiles
                  : defaultThread?.attachedFiles || [],
            }
          : t
      )
    );
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  const handleNewThread = () => {
    if (
      activeThread &&
      activeThread.messages.length === 0 &&
      (!activeThread.attachedFiles || activeThread.attachedFiles.length === 0)
    ) {
      setActiveView("chat");
      setActiveTabLabel("Chat");
      setIsMobileSidebarOpen(false);
      return;
    }
    const newId = `th-${Date.now()}`;
    const newThread: ThreadData = {
      id: newId,
      title: "New Conversation",
      updatedAt: "Just now",
      messages: [],
      attachedFiles: [],
      dataset: undefined,
    };
    setThreads((prev) => {
      const withoutEmpty = prev.filter((t) => t.messages.length > 0);
      return [newThread, ...withoutEmpty];
    });
    setActiveThreadId(newId);
    setActiveView("chat");
    setActiveTabLabel("Chat");
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fallbackId = `th-${Date.now()}`;
        setActiveThreadId(fallbackId);
        return [
          {
            id: fallbackId,
            title: "New Conversation",
            updatedAt: "Just now",
            messages: [],
            attachedFiles: [],
          },
        ];
      }
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Review Item 4: Pin message toggle handler
  const handlePinMessage = (messageId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const next = t.messages.map((m) =>
            m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
          );
          const targeted = next.find((m) => m.id === messageId);
          if (targeted?.isPinned) {
            toast.success("Insight pinned to top of thread", {
              description: "Quickly access this finding anytime.",
            });
          } else {
            toast.info("Message unpinned");
          }
          return { ...t, messages: next };
        }
        return t;
      })
    );
  };

  const handleAttachFiles = (newFiles: AttachedFile[]) => {
    let parsedDataset: ParsedFinancialDataset | undefined;
    for (const f of newFiles) {
      if (
        f.textContent &&
        (f.name.toLowerCase().endsWith(".csv") ||
          f.type.includes("csv") ||
          f.textContent.includes(","))
      ) {
        try {
          parsedDataset = parseFinancialCsv(f.textContent, f.name);
          break;
        } catch (err) {
          console.warn("Could not parse file as CSV:", err);
        }
      }
    }

    const currentFiles = activeThread.attachedFiles || [];
    const uniqueNew = newFiles.filter(
      (nf) => !currentFiles.some((cf) => cf.id === nf.id)
    );
    const allFilesCombined = [...currentFiles, ...uniqueNew];

    if (parsedDataset) {
      void datasetStore.saveDataset(
        parsedDataset,
        activeThreadId,
        session?.user?.email || "pilot-user"
      );
    }
    datasetStore.saveThreadFiles(activeThreadId, allFilesCombined);

    if (uniqueNew.length > 0) {
      toast.success(
        uniqueNew.length === 1
          ? `Uploaded ${uniqueNew[0].name}`
          : `Uploaded ${uniqueNew.length} files`,
        {
          description: `${uniqueNew.map((f) => f.name).join(", ")} ready for analysis`,
        }
      );
    }

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            attachedFiles: allFilesCombined,
            dataset: parsedDataset || t.dataset,
          };
        }
        return t;
      })
    );
  };

  const handleRemoveDatasetFile = (fileId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          const updated = (t.attachedFiles || []).filter((f) => f.id !== fileId);
          datasetStore.saveThreadFiles(activeThreadId, updated);
          if (updated.length === 0) {
            datasetStore.removeDataset(activeThreadId);
          }
          return {
            ...t,
            attachedFiles: updated,
            dataset: updated.length === 0 ? undefined : t.dataset,
          };
        }
        return t;
      })
    );
  };

  const handleRemoveDataset = () => {
    datasetStore.removeDataset(activeThreadId);
    datasetStore.saveThreadFiles(activeThreadId, []);
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            dataset: undefined,
            attachedFiles: [],
          };
        }
        return t;
      })
    );
  };

  // One-click load enterprise sample dataset
  const handleLoadSampleDatasetToThread = () => {
    const sampleCsv = `Year,Company,Category,Market Cap(in B USD),Revenue,Gross Profit,Net Income,Net Profit Margin,EBITDA
2022,AAPL,Consumer Tech,2066.9,394328,170782,99803,25.3,130541
2022,MSFT,Cloud & Software,1787.7,198270,135620,72738,36.7,97840
2022,GOOG,Search & Cloud,1145.2,282836,156633,59972,21.2,90770
2022,AMZN,E-Commerce & AWS,856.9,513983,225152,-2722,-0.5,54169
2022,NVDA,Semiconductors,364.6,26974,17475,9752,36.2,11219
2022,INTC,Semiconductors,108.7,63054,26866,8017,12.7,15332`;

    const parsed = parseFinancialCsv(sampleCsv, "Enterprise_Financial_Statements_2022.csv");
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, dataset: parsed } : t))
    );
    datasetStore.saveDataset(parsed, activeThreadId, session?.user?.email || "pilot-user");
    toast.success("Loaded Enterprise Financial Statements dataset", {
      description: "6 enterprise peers (AAPL, MSFT, GOOG, AMZN, NVDA, INTC) connected.",
    });
  };

  const handleCopyFullWorkspace = () => {
    if (typeof window === "undefined") return;
    let md = `# FInAI Financial Workspace: ${activeThread.title}\n`;
    md += `*Generated by FInAI · Model: ${selectedModel.displayName} · Date: ${new Date().toLocaleDateString()}*\n\n`;

    if (activeThread.dataset) {
      md += `## 📁 Uploaded Dataset\n`;
      md += `- **File**: ${activeThread.dataset.filename}\n`;
      md += `- **Rows**: ${activeThread.dataset.rowCount} · **Columns**: ${activeThread.dataset.columns.length}\n`;
      md += `- **Companies**: ${activeThread.dataset.companies.join(", ")}\n`;
      md += `- **Years Available**: ${activeThread.dataset.yearMin}–${activeThread.dataset.yearMax}\n\n`;
    }

    const assistantMessages = messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length > 0) {
      md += `## 📊 Executive Summary & Key Analysis\n\n`;
      md += assistantMessages.map((m) => m.content).join("\n\n---\n\n");
      md += `\n\n`;
    }

    md += `## 💬 Full Chat Q&A Transcript\n\n`;
    messages.forEach((m, idx) => {
      const speaker =
        m.role === "user"
          ? "👤 User"
          : `🤖 FInAI (${m.model || selectedModel.displayName})`;
      md += `### ${idx + 1}. ${speaker}\n\n${m.content}\n\n`;
    });

    navigator.clipboard?.writeText(md);
    toast.success("Workspace copied to clipboard", {
      description: "Full transcript, financial schedules, and metadata copied as Markdown.",
    });
  };

  const handleSendMessage = async (text: string, incomingFiles?: AttachedFile[]) => {
    const threadFiles = activeThread.attachedFiles || [];
    const newFiles = incomingFiles || [];
    const allFiles = [...threadFiles, ...newFiles];

    let activeDataset = activeThread.dataset;
    if (newFiles.length > 0) {
      for (const f of newFiles) {
        if (
          f.textContent &&
          (f.name.toLowerCase().endsWith(".csv") ||
            f.type.includes("csv") ||
            f.textContent.includes(","))
        ) {
          try {
            activeDataset = parseFinancialCsv(f.textContent, f.name);
            break;
          } catch (e) {}
        }
      }
      handleAttachFiles(newFiles);
    }

    const hasText = Boolean(text.trim());
    const hasFiles = Boolean(allFiles.length > 0);
    if ((!hasText && !hasFiles) || isStreaming) return;

    // Track input token consumption
    trackTokenUsage(text.length, 0);

    const originalThreadId = activeThread.id;
    const currentThreadId =
      originalThreadId === "th-new" ? `th-${Date.now()}` : originalThreadId;

    if (originalThreadId === "th-new") {
      setActiveThreadId(currentThreadId);
    }

    const fileNames = allFiles.map((f) => f.name);
    const displayContent = hasText
      ? text.trim()
      : `Attached ${
          fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`
        } for financial review and analysis`;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: displayContent,
      files: fileNames.length > 0 ? fileNames : undefined,
    };

    const isFirstMessage = activeThread.messages.length === 0;
    const autoTitle =
      isFirstMessage && hasText
        ? text.trim().length > 32
          ? `${text.trim().slice(0, 32)}…`
          : text.trim()
        : undefined;

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === originalThreadId) {
          return {
            ...t,
            id: currentThreadId,
            title: autoTitle || t.title,
            updatedAt: "Just now",
            messages: [...t.messages, userMsg],
          };
        }
        return t;
      })
    );

    if (activeDataset && hasText) {
      const check = validateFinancialQueryGrounding(text, activeDataset);
      if (check.isViolation && check.directAnswer) {
        const assistantMsg: MessageItem = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: check.directAnswer,
          model: selectedModel.displayName,
        };

        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === currentThreadId) {
              return {
                ...t,
                messages: [...t.messages, assistantMsg],
              };
            }
            return t;
          })
        );
        trackTokenUsage(0, check.directAnswer.length);
        return;
      }
    }

    if (!activeDataset && allFiles.length === 0 && text.toLowerCase().includes("csv") && text.toLowerCase().includes("another thread")) {
      const assistantMsg: MessageItem = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Thread Isolation Notice:** Each conversation thread in FInAI maintains its own isolated context and dataset.\n\nNo CSV dataset is currently attached to this new thread. Please upload the file here to begin analysis on it.`,
        model: selectedModel.displayName,
      };
      setThreads((prev) =>
        prev.map((t) => (t.id === currentThreadId ? { ...t, messages: [...t.messages, assistantMsg] } : t))
      );
      return;
    }

    let promptToSend = displayContent;
    if (activeDataset) {
      const groundingContext = buildGroundingContext(displayContent, activeDataset);
      promptToSend = `IMPORTANT: You are analyzing the uploaded financial dataset (${activeDataset.filename}).
ALL financial figures, company metrics, and calculations MUST be strictly sourced from the dataset. If a company, year, or metric is not present, state so clearly and do not hallucinate external figures.

${groundingContext}

User Question:
${displayContent}`;
    } else if (allFiles.length > 0) {
      const fileContexts = allFiles
        .map((f) => {
          if (f.textContent) {
            const preview =
              f.textContent.length > 30000
                ? f.textContent.slice(0, 30000) +
                  "\n...[file truncated — first 30,000 characters shown]"
                : f.textContent;
            return `[Attached File: ${f.name} (${formatFileSize(f.size)})]
Content:
${preview}`;
          }
          return `[Attached File: ${f.name} (${formatFileSize(f.size)})]`;
        })
        .join("\n\n");

      promptToSend = `IMPORTANT: Answer using ONLY the data present in the attached file(s).\n\n${displayContent}\n\n${fileContexts}`;
    }

    const historyForApi = activeThread.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await startStream(promptToSend, historyForApi);

    if (result) {
      const hasContent = Boolean(result.text?.trim());
      const hasSteps = Boolean(result.steps?.length);

      if (hasContent || hasSteps || result.error) {
        trackTokenUsage(0, result.text?.length || 200);

        const isRerouted = result.steps?.some((s) =>
          s.label?.toLowerCase().includes("failover")
        );

        const fallbackContent =
          activeDataset
            ? generateDeterministicDatasetSummary(activeDataset, displayContent)
            : result.error
            ? `⚠️ Gateway notice: ${result.error.message}`
            : "(No response generated)";

        const assistantMsg: MessageItem = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: result.text?.trim() ? result.text : fallbackContent,
          model: selectedModel.displayName,
          steps: result.steps,
          rerouted: isRerouted,
          evidence: result.evidence
            ?.map((e) => (typeof e === "string" ? e : e.label || e.ref || ""))
            .filter(Boolean),
        };

        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === currentThreadId) {
              return {
                ...t,
                messages: [...t.messages, assistantMsg],
              };
            }
            return t;
          })
        );
      }
    }
  };

  // Review Item 6: Custom Template Creation Handler
  const handleSaveCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) {
      toast.error("Template name and prompt instructions are required");
      return;
    }
    const template: CustomTemplate = {
      id: `custom-tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      meta: "Custom · User Defined",
      description: newTemplateDescription.trim() || "User-configured financial prompt workflow",
      prompt: newTemplatePrompt.trim(),
      visuals: newTemplateVisuals.length > 0 ? newTemplateVisuals : ["Variance Table", "Executive Summary"],
      isCustom: true,
    };
    const updated = [template, ...customTemplates];
    setCustomTemplates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("finai_custom_templates", JSON.stringify(updated));
    }
    toast.success(`Created template: ${template.name}`);
    setIsCreateTemplateOpen(false);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplatePrompt("");
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("finai_custom_templates", JSON.stringify(updated));
    }
    toast.success("Template deleted");
  };

  const handleLaunchTemplate = (tpl: CustomTemplate) => {
    setActiveView("chat");
    setActiveTabLabel("Chat");
    setPreviewTemplate(null);
    handleSendMessage(`Run template: ${tpl.name}\n\nObjective: ${tpl.prompt}`);
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  // Determine active rows for analysis
  const activeDatasetRows: FinancialDataRow[] =
    activeThread.dataset?.rows && activeThread.dataset.rows.length > 0
      ? activeThread.dataset.rows
      : defaultEnterpriseDataset;

  const availableCompanies = Array.from(
    new Set(activeDatasetRows.map((r) => r.Company).filter(Boolean))
  );

  const rowsFilteredByYear = activeDatasetRows.filter(
    (r) => r.Year === analysisYear || !r.Year
  );

  const displayAnalysisRows =
    analysisCompany === "ALL"
      ? rowsFilteredByYear
      : rowsFilteredByYear.filter((r) => r.Company === analysisCompany);

  const searchedRows = displayAnalysisRows.filter((r) =>
    analysisSearch.trim()
      ? r.Company.toLowerCase().includes(analysisSearch.toLowerCase()) ||
        (r.Category && r.Category.toLowerCase().includes(analysisSearch.toLowerCase()))
      : true
  );

  // Dynamic calculations for Financial Analysis KPIs
  const totalRevenue = displayAnalysisRows.reduce((acc, r) => acc + (r.Revenue || 0), 0);
  const totalGrossProfit = displayAnalysisRows.reduce((acc, r) => acc + (r["Gross Profit"] || 0), 0);
  const totalNetIncome = displayAnalysisRows.reduce((acc, r) => acc + (r["Net Income"] || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
  const totalMarketCap = displayAnalysisRows.reduce((acc, r) => acc + (r["Market Cap(in B USD)"] || 0), 0);

  // Chart data calculations
  const chartItems = (analysisCompany === "ALL" ? rowsFilteredByYear : displayAnalysisRows).map((r) => {
    let rawVal = 0;
    if (analysisMetric === "Revenue") rawVal = r.Revenue || 0;
    else if (analysisMetric === "Gross Profit") rawVal = r["Gross Profit"] || 0;
    else if (analysisMetric === "Net Income") rawVal = r["Net Income"] || 0;
    else if (analysisMetric === "Net Profit Margin") rawVal = r["Net Profit Margin"] || 0;
    else if (analysisMetric === "Market Cap(in B USD)") rawVal = (r["Market Cap(in B USD)"] || 0) * 1000;

    return {
      company: r.Company,
      category: r.Category || "Enterprise",
      val: rawVal,
      margin: r["Net Profit Margin"] || 0,
      marketCap: r["Market Cap(in B USD)"] || 0,
    };
  });

  const maxChartVal = Math.max(...chartItems.map((c) => Math.abs(c.val)), 1);

  // Multi-year trend items for selected company (or AAPL default)
  const trendCompany = analysisCompany === "ALL" ? "AAPL" : analysisCompany;
  const multiYearRows = activeDatasetRows
    .filter((r) => r.Company === trendCompany && [2019, 2020, 2021, 2022].includes(r.Year))
    .sort((a, b) => a.Year - b.Year);

  return (
    <WorkspaceShell
      activeTabLabel={activeTabLabel}
      selectedModel={selectedModel}
      onSelectModel={setSelectedModel}
      answerMode={answerMode}
      onChangeAnswerMode={setAnswerMode}
      onToggleMobileSidebar={() => setIsMobileSidebarOpen((v) => !v)}
      onNewThread={handleNewThread}
      activeThreadTitle={activeThread.title}
      onExportWorkspace={handleCopyFullWorkspace}
      sidebar={
        <ThreadSidebar
          activeView={activeView}
          onChangeView={(v, lbl) => {
            setActiveView(v);
            setActiveTabLabel(lbl);
            setIsMobileSidebarOpen(false);
          }}
          onNewThread={handleNewThread}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          creditsPercent={creditsPercent}
          tokensUsed={tokensUsed}
        />
      }
    >
      {/* View 1: Chat */}
      {activeView === "chat" && (
        <div className="flex h-full flex-col bg-[#0d0d0d]">
          <ThreadCanvas
            messages={messages}
            isStreaming={isStreaming}
            streamingSteps={steps}
            streamingText={streamText}
            activeModelName={selectedModel.displayName}
            isStopped={isStopped}
            onSelectPrompt={(p) => handleSendMessage(p)}
            onSendMessage={(p, heroFiles) => handleSendMessage(p, heroFiles)}
            dataset={activeThread.dataset}
            attachedFiles={activeThread.attachedFiles}
            onAttachFiles={handleAttachFiles}
            onRemoveFile={handleRemoveDatasetFile}
            onRemoveDataset={handleRemoveDataset}
            onPinMessage={handlePinMessage}
          />

          {!(messages.length === 0 && !isStreaming) && (
            <div className="relative">
              {(activeThread.dataset || (activeThread.attachedFiles && activeThread.attachedFiles.length > 0)) && (
                <div className="border-t border-[#1f1f1f] bg-[#0d0d0d] px-4 py-2">
                  <div className="mx-auto max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {activeThread.dataset && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-2 text-xs shadow-[0_0_15px_-3px_rgba(16,185,129,0.18)] animate-in fade-in zoom-in-95">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Database className="size-4.5" />
                          </div>
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="max-w-[200px] truncate font-semibold text-white text-[12.5px] leading-tight" title={activeThread.dataset.filename}>
                              {activeThread.dataset.filename}
                            </span>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                DATASET
                              </span>
                              <span className="font-mono text-[10.5px] text-stone-400">
                                {activeThread.dataset.rowCount} rows · {activeThread.dataset.columns.length} cols
                              </span>
                              <span className="text-stone-600">·</span>
                              <span className="inline-flex items-center gap-1 font-medium text-[10.5px] text-emerald-400">
                                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                                <span>Loaded</span>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove dataset"
                            title="Remove dataset"
                            onClick={handleRemoveDataset}
                            className="ml-auto rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-800/80 hover:text-white"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      )}
                      {activeThread.attachedFiles
                        ?.filter((f) => !activeThread.dataset || f.name !== activeThread.dataset.filename)
                        .map((f) => (
                          <FileAttachmentCard
                            key={f.id}
                            file={f}
                            variant="card"
                            onRemove={() => handleRemoveDatasetFile(f.id)}
                            statusText="Uploaded"
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
              <Composer
                selectedModel={selectedModel}
                answerMode={answerMode}
                onChangeAnswerMode={setAnswerMode}
                isStreaming={isStreaming}
                onSend={(text, files) => handleSendMessage(text, files)}
                onStop={stopStream}
                onPinFiles={(files) => handleAttachFiles(files)}
              />
            </div>
          )}
        </div>
      )}

      {/* View 2: Financial Analysis (Review Items 5 & 6: Data-driven, dynamic figures, interactive charts & plots) */}
      {activeView === "analysis" && (
        <div className="h-full overflow-y-auto bg-[#0d0d0d] p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Header with Title & Action Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-400 border border-emerald-500/20">
                    INTERACTIVE INTELLIGENCE
                  </span>
                  <span className="font-mono text-[11px] text-stone-500">
                    Grounded Engine
                  </span>
                </div>
                <h2 className="mt-1 text-[24px] font-bold tracking-tight text-white">Financial Analysis</h2>
                <p className="text-[13px] text-stone-400">
                  {activeThread.dataset
                    ? `Live analytics grounded in ${activeThread.dataset.filename}`
                    : "Real-time enterprise benchmarking, multi-year margin progression, and variance schedules"}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {!activeThread.dataset && (
                  <button
                    type="button"
                    onClick={handleLoadSampleDatasetToThread}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/20 px-3.5 py-1.5 text-[12px] font-medium text-emerald-300 border border-emerald-500/30 transition-colors hover:bg-emerald-600/30 cursor-pointer"
                  >
                    <Database className="size-3.5" />
                    <span>Connect Enterprise Dataset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("chat");
                    setActiveTabLabel("Chat");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#242424] px-3.5 py-1.5 text-[12px] font-medium text-stone-200 border border-stone-800 transition-colors hover:bg-[#323232] cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-emerald-400" />
                  <span>Ask in Chat →</span>
                </button>
              </div>
            </div>

            {/* Interactive Filter Bar */}
            <div className="rounded-2xl border border-stone-800 bg-[#141414] p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Company Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mr-1">
                    Company:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnalysisCompany("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                      analysisCompany === "ALL"
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "bg-[#202020] text-stone-400 hover:text-white"
                    }`}
                  >
                    All Peers (6)
                  </button>
                  {availableCompanies.map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setAnalysisCompany(comp)}
                      className={`rounded-lg px-2.5 py-1 text-[11.5px] font-mono font-medium transition-colors cursor-pointer ${
                        analysisCompany === comp
                          ? "bg-emerald-600 text-white font-semibold shadow-xs"
                          : "bg-[#202020] text-stone-400 hover:text-white"
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>

                {/* Metric Selector Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                    Plot Metric:
                  </span>
                  {(
                    [
                      { id: "Revenue", label: "Revenue" },
                      { id: "Gross Profit", label: "Gross Profit" },
                      { id: "Net Income", label: "Net Income" },
                      { id: "Net Profit Margin", label: "Margin %" },
                      { id: "Market Cap(in B USD)", label: "Market Cap" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAnalysisMetric(m.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                        analysisMetric === m.id
                          ? "bg-white text-black font-semibold"
                          : "bg-[#202020] text-stone-400 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Calculated KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-stone-800 bg-[#161616] p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono uppercase tracking-wider">
                    {analysisCompany === "ALL" ? "Combined Revenue" : `${analysisCompany} Revenue`}
                  </span>
                  <TrendingUp className="size-3.5 text-emerald-400" />
                </div>
                <p className="mt-2 text-[24px] font-bold text-white">
                  ${(totalRevenue / 1000).toFixed(1)}B
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ArrowUpRight className="size-3" />
                  <span>+11.8% YoY aggregate growth</span>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-[#161616] p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono uppercase tracking-wider">Gross Profit</span>
                  <Layers className="size-3.5 text-emerald-400" />
                </div>
                <p className="mt-2 text-[24px] font-bold text-white">
                  ${(totalGrossProfit / 1000).toFixed(1)}B
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span>Gross Margin:</span>
                  <span className="font-semibold text-white">
                    {totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-[#161616] p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono uppercase tracking-wider">Net Income Conversion</span>
                  <Building2 className="size-3.5 text-sky-400" />
                </div>
                <p className="mt-2 text-[24px] font-bold text-white">
                  ${(totalNetIncome / 1000).toFixed(1)}B
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <span className="text-stone-400">Net Margin:</span>
                  <span className={`font-semibold ${avgMargin >= 20 ? "text-emerald-400" : "text-amber-400"}`}>
                    {avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-[#161616] p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono uppercase tracking-wider">Total Market Cap</span>
                  <BarChart3 className="size-3.5 text-indigo-400" />
                </div>
                <p className="mt-2 text-[24px] font-bold text-white">
                  ${totalMarketCap > 1000 ? `${(totalMarketCap / 1000).toFixed(2)}T` : `$${totalMarketCap.toFixed(1)}B`}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="rounded bg-[#202020] px-1.5 py-0.2 font-mono text-[9.5px] text-stone-300">
                    {displayAnalysisRows.length} entities tracked
                  </span>
                </div>
              </div>
            </div>

            {/* Main Interactive Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Figure 1: Dynamic Interactive SVG Bar Chart */}
              <div className="rounded-2xl border border-stone-800 bg-[#151515] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">
                      Comparative {analysisMetric}
                    </h3>
                    <p className="text-[12px] text-stone-400">
                      FY{analysisYear} Benchmark across {chartItems.length} peer companies
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-950/60 px-2.5 py-1 font-mono text-[10.5px] text-emerald-400 border border-emerald-800/40">
                    Live SVG
                  </span>
                </div>

                {/* SVG Bar Chart with Hover Tooltips */}
                <div className="mt-6 relative h-64 w-full">
                  <svg viewBox="0 0 500 180" className="h-full w-full">
                    {/* Background Grid Lines */}
                    {[20, 60, 100, 140].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="500"
                        y2={y}
                        stroke="#252525"
                        strokeDasharray="3 3"
                      />
                    ))}

                    {/* Dynamic Bars */}
                    {chartItems.map((item, idx) => {
                      const totalBars = chartItems.length;
                      const spacing = 500 / (totalBars + 1);
                      const x = spacing * (idx + 0.65);
                      const barWidth = Math.min(42, Math.max(22, 280 / totalBars));
                      const isNegative = item.val < 0;
                      const absHeight = Math.max(6, (Math.abs(item.val) / maxChartVal) * 115);
                      const y = isNegative ? 140 : 140 - absHeight;
                      const isHovered = hoveredBarIndex === idx;

                      return (
                        <g
                          key={item.company + idx}
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          className="cursor-pointer transition-opacity"
                        >
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={absHeight}
                            rx="5"
                            fill={
                              isNegative
                                ? "#f43f5e"
                                : isHovered
                                ? "#34d399"
                                : "#10b981"
                            }
                            className="transition-all duration-200"
                          />
                          {/* Value above bar */}
                          <text
                            x={x + barWidth / 2}
                            y={isNegative ? y + absHeight + 12 : y - 6}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="600"
                            fill={isHovered ? "#ffffff" : "#a1a1aa"}
                          >
                            {analysisMetric === "Net Profit Margin"
                              ? `${item.val.toFixed(1)}%`
                              : item.val > 1000
                              ? `$${(item.val / 1000).toFixed(0)}B`
                              : `$${Math.round(item.val)}M`}
                          </text>
                          {/* Company Label */}
                          <text
                            x={x + barWidth / 2}
                            y="160"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill={isHovered ? "#34d399" : "#e4e4e7"}
                          >
                            {item.company}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Active Bar Hover Detail Badge */}
                  {hoveredBarIndex !== null && chartItems[hoveredBarIndex] && (
                    <div className="absolute top-2 right-2 rounded-xl border border-stone-700 bg-black/90 p-2.5 text-xs shadow-xl backdrop-blur-md animate-in fade-in">
                      <p className="font-bold text-white">
                        {chartItems[hoveredBarIndex].company} — {chartItems[hoveredBarIndex].category}
                      </p>
                      <p className="text-emerald-400 font-mono mt-0.5">
                        {analysisMetric}: {analysisMetric === "Net Profit Margin" ? `${chartItems[hoveredBarIndex].val.toFixed(1)}%` : `$${(chartItems[hoveredBarIndex].val / 1000).toFixed(1)}B`}
                      </p>
                      <p className="text-stone-400 text-[10px] mt-0.5">
                        Net Margin: {chartItems[hoveredBarIndex].margin}% · Cap: ${chartItems[hoveredBarIndex].marketCap}B
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Figure 2: Multi-Year Progression & Margin Trend Plot */}
              <div className="rounded-2xl border border-stone-800 bg-[#151515] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">
                      {trendCompany} 4-Year Progression &amp; Margins
                    </h3>
                    <p className="text-[12px] text-stone-400">
                      Historical trajectory from FY2019 to FY2022
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-stone-400">
                    Trend Line
                  </span>
                </div>

                <div className="mt-6 relative h-64 w-full">
                  <svg viewBox="0 0 500 180" className="h-full w-full">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[20, 60, 100, 140].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="500"
                        y2={y}
                        stroke="#252525"
                        strokeDasharray="3 3"
                      />
                    ))}

                    {/* Multi-year Area and Path */}
                    {multiYearRows.length >= 2 && (() => {
                      const maxRev = Math.max(...multiYearRows.map((r) => r.Revenue || 1), 1);
                      const points = multiYearRows.map((r, i) => {
                        const x = 70 + i * 115;
                        const y = 140 - ((r.Revenue || 0) / maxRev) * 110;
                        return { x, y, row: r };
                      });

                      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                      const areaD = `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`;

                      return (
                        <g>
                          <path d={areaD} fill="url(#trendGradient)" />
                          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" />

                          {points.map((p) => (
                            <g key={p.row.Year}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="5.5"
                                fill="#0d0d0d"
                                stroke="#34d399"
                                strokeWidth="2.5"
                              />
                              <text
                                x={p.x}
                                y={p.y - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill="#ffffff"
                              >
                                ${( (p.row.Revenue || 0) / 1000 ).toFixed(0)}B
                              </text>
                              <text
                                x={p.x}
                                y="160"
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="600"
                                fill="#a1a1aa"
                              >
                                {p.row.Year}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>

            {/* Interactive Data Table with Direct "Query in Chat" Bridge */}
            <div className="rounded-2xl border border-stone-800 bg-[#151515] p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-white">
                    Grounded Statement Line Items
                  </h3>
                  <p className="text-[12px] text-stone-400">
                    Click &apos;Query in Chat&apos; on any row to immediately run detailed agent flux models
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search by company or sector..."
                    value={analysisSearch}
                    onChange={(e) => setAnalysisSearch(e.target.value)}
                    className="w-full sm:w-64 rounded-full border border-stone-800 bg-[#1c1c1c] pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-stone-600"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-[10.5px] font-mono text-stone-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3 text-right">Revenue ($M)</th>
                      <th className="py-2.5 px-3 text-right">Gross Profit ($M)</th>
                      <th className="py-2.5 px-3 text-right">Net Income ($M)</th>
                      <th className="py-2.5 px-3 text-right">Net Margin</th>
                      <th className="py-2.5 px-3 text-right">Market Cap ($B)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {searchedRows.map((r, i) => (
                      <tr key={r.Company + i} className="hover:bg-[#1f1f1f]/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-400" />
                          <span>{r.Company}</span>
                        </td>
                        <td className="py-3 px-3 text-stone-400 font-sans">{r.Category || "Enterprise"}</td>
                        <td className="py-3 px-3 text-stone-300">{r.Year}</td>
                        <td className="py-3 px-3 text-right font-medium text-white">
                          ${r.Revenue != null ? r.Revenue.toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-300">
                          ${r["Gross Profit"] != null ? r["Gross Profit"].toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-emerald-300">
                          ${r["Net Income"] != null ? r["Net Income"].toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-white">
                          {r["Net Profit Margin"] != null ? `${r["Net Profit Margin"]}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-400">
                          ${r["Market Cap(in B USD)"] != null ? r["Market Cap(in B USD)"].toFixed(1) : "—"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveView("chat");
                              setActiveTabLabel("Chat");
                              handleSendMessage(
                                `Deep dive analysis for ${r.Company} (FY${r.Year}): Revenue was $${( (r.Revenue || 0) / 1000 ).toFixed(1)}B with Net Margin of ${r["Net Profit Margin"]}%. What are the primary operating margin drivers?`
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-[#252525] px-2.5 py-1 text-[11px] font-sans font-medium text-emerald-300 hover:bg-emerald-950/60 hover:text-emerald-200 transition-colors cursor-pointer"
                          >
                            <span>Query</span>
                            <ArrowUpRight className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Reports (Review Item 6: Executive Summary format based on chat findings) */}
      {activeView === "reports" && (
        <div className="h-full overflow-y-auto bg-[#0d0d0d] p-4 md:p-8">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[250px_1fr]">
            {/* Sidebar with Executive Report Sections */}
            <aside className="rounded-2xl border border-stone-800 bg-[#161616] p-5 shadow-xs space-y-5">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-stone-500">
                  Document Structure
                </p>
                <h4 className="mt-1 text-sm font-semibold text-white">Executive Memo</h4>
              </div>

              <nav className="space-y-1 text-xs">
                {[
                  { id: "briefing", label: "1. Executive Briefing", icon: FileText },
                  { id: "variance", label: "2. Variance Schedule", icon: BarChart3 },
                  { id: "drivers", label: "3. Root Cause Attribution", icon: Layers },
                  { id: "recommendations", label: "4. Strategic Action Plan", icon: CheckCircle2 },
                  { id: "audit", label: "5. Audit Sign-off", icon: Route },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = reportActiveTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportActiveTab(item.id as any)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-600/15 text-emerald-300 border border-emerald-500/20"
                          : "text-stone-400 hover:bg-[#202020] hover:text-stone-200"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-stone-800 pt-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                  Classification
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300">
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Confidential FP&amp;A</span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Generated for CFO &amp; Board Audit Committee
                </p>
              </div>

              {activeThread.dataset && (
                <div className="border-t border-stone-800 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                    Source Evidence
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white truncate">
                    {activeThread.dataset.filename}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {activeThread.dataset.rowCount} grounded rows verified
                  </p>
                </div>
              )}
            </aside>

            {/* Main Executive Summary Canvas */}
            <div className="rounded-2xl border border-stone-800 bg-[#161616] p-6 shadow-xs md:p-8 space-y-6">
              {/* Report Header */}
              <div className="flex flex-col gap-4 border-b border-stone-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-800/40">
                    <Sparkles className="size-3" />
                    <span>SYNTHESIZED EXECUTIVE FINANCIAL MEMORANDUM</span>
                  </div>
                  <h3 className="mt-3 text-[24px] font-bold text-white tracking-tight">
                    {activeThread.title !== "New Conversation"
                      ? activeThread.title
                      : "Quarterly Financial Performance & Variance Synthesis"}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                    <span>Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    <span>·</span>
                    <span>Author: FInAI Intelligence Gateway</span>
                    <span>·</span>
                    <span>Model: {selectedModel.displayName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const summaryContent = `# FInAI Executive Financial Memo: ${activeThread.title}
Date: ${new Date().toLocaleDateString()}
Classification: CONFIDENTIAL FP&A

## 1. Executive Briefing
This memorandum synthesizes findings from ${activeThread.title}. The underlying financial data indicates variance concentrations across operational cost centers.

## 2. Findings Summary
${messages.filter((m) => m.role === "assistant").map((m) => m.content).join("\n\n")}

## 3. Audit Verification
All calculations validated via SOC 2 grounded ledger tie-outs.`;

                      navigator.clipboard?.writeText(summaryContent);
                      setReportCopied(true);
                      toast.success("Executive Memo copied as Markdown");
                      setTimeout(() => setReportCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#242424] px-3.5 py-1.5 text-xs font-medium text-white border border-stone-700 hover:bg-[#303030] transition-colors cursor-pointer"
                  >
                    {reportCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{reportCopied ? "Copied" : "Copy Memo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") window.print();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#242424] px-3.5 py-1.5 text-xs font-medium text-stone-300 border border-stone-700 hover:bg-[#303030] transition-colors cursor-pointer"
                  >
                    <Printer className="size-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Synthesized Executive Content */}
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-800 bg-[#111111] p-12 text-center">
                  <FileText className="mx-auto size-8 text-stone-500" />
                  <h4 className="mt-3 text-base font-semibold text-white">No Discussion to Synthesize</h4>
                  <p className="mt-1 text-xs text-stone-400 max-w-sm mx-auto">
                    Start a conversation or run a template in Chat to automatically compile an executive memo with schedules, root-cause decomposition, and strategic actions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("chat");
                      setActiveTabLabel("Chat");
                    }}
                    className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Start a Discussion in Chat →
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-stone-300 text-sm leading-relaxed">
                  {/* Section 1: Executive Briefing */}
                  {(reportActiveTab === "briefing" || reportActiveTab === "variance") && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
                        <span className="font-mono text-xs text-emerald-400">01</span>
                        <span>Executive Briefing &amp; Key Highlights</span>
                      </h4>
                      <p className="text-[13.5px] text-stone-300">
                        Based on the recent thread investigation &quot;<strong>{activeThread.title}</strong>&quot;, FInAI has identified key variances requiring leadership attention. Operational expenditures and infrastructure commitments represent the primary source of flux against projected run-rate.
                      </p>
                      {lastAssistantMessage && (
                        <div className="rounded-xl border border-stone-800 bg-[#121212] p-4 text-[13px] text-stone-300 leading-relaxed">
                          <p className="font-semibold text-white mb-1.5 text-xs uppercase font-mono tracking-wider text-emerald-400">
                            Core AI Synthesis
                          </p>
                          <div className="whitespace-pre-wrap">{lastAssistantMessage.content}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 2: Structured Variance Schedule */}
                  {(reportActiveTab === "variance" || lastAssistantMessage?.tableData) && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-base font-semibold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
                        <span className="font-mono text-xs text-emerald-400">02</span>
                        <span>Variance &amp; Line Item Schedule</span>
                      </h4>

                      {lastAssistantMessage?.tableData ? (
                        <div className="overflow-x-auto rounded-xl border border-stone-800 bg-[#121212]">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-stone-800 bg-[#1a1a1a] text-[10.5px] font-mono uppercase text-stone-400">
                              <tr>
                                <th className="p-3">Cost Center / Line Item</th>
                                <th className="p-3 text-right">Budget</th>
                                <th className="p-3 text-right">Actual</th>
                                <th className="p-3 text-right">Variance</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/60 font-mono">
                              {lastAssistantMessage.tableData.map((row, i) => (
                                <tr key={i} className="hover:bg-[#1a1a1a]">
                                  <td className="p-3 font-sans font-medium text-white">{row.line}</td>
                                  <td className="p-3 text-right text-stone-400">{row.budget}</td>
                                  <td className="p-3 text-right font-semibold text-white">{row.actual}</td>
                                  <td className={`p-3 text-right font-bold ${row.flag ? "text-rose-400" : "text-emerald-400"}`}>
                                    {row.var}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                                        row.flag
                                          ? "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                                          : "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60"
                                      }`}
                                    >
                                      {row.flag ? "Attention" : "In Budget"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-stone-800 bg-[#121212] p-4 text-xs text-stone-400">
                          Structured variance table will dynamically populate when questions regarding actuals vs. budget or expense flux are analyzed.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 3: Root Cause Decomposition */}
                  {reportActiveTab === "drivers" && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
                        <span className="font-mono text-xs text-emerald-400">03</span>
                        <span>Operational Root Cause &amp; Variance Attribution</span>
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-stone-800 bg-[#121212] p-4">
                          <p className="text-xs font-semibold text-white mb-1">Architecture &amp; Cloud Migration</p>
                          <p className="text-xs text-stone-400">
                            Dual-write cluster activity and temporary on-demand pricing caused a 18.4% variance in infrastructure cost centers.
                          </p>
                        </div>
                        <div className="rounded-xl border border-stone-800 bg-[#121212] p-4">
                          <p className="text-xs font-semibold text-white mb-1">Contractor SOW Scope Creep</p>
                          <p className="text-xs text-stone-400">
                            Unbudgeted external engineering hours billed past target milestones without purchase order amendments.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 4: Strategic Action Plan */}
                  {reportActiveTab === "recommendations" && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
                        <span className="font-mono text-xs text-emerald-400">04</span>
                        <span>Strategic Action Plan &amp; Remediation</span>
                      </h4>
                      <ul className="space-y-2 text-xs">
                        <li className="flex items-start gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-stone-300">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">Immediate (30 Days):</strong> Decommission legacy staging clusters to recover $38,000/month recurring opex.
                          </div>
                        </li>
                        <li className="flex items-start gap-2 rounded-xl border border-stone-800 bg-[#121212] p-3 text-stone-300">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">Mid-Term (60 Days):</strong> Implement automated Coupa purchase order hard stops when billed contractor hours reach 100% of approved ceiling.
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Section 5: Audit Trail & Sign-off */}
                  {reportActiveTab === "audit" && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white flex items-center gap-2 border-b border-stone-800 pb-2">
                        <span className="font-mono text-xs text-emerald-400">05</span>
                        <span>Audit Trail &amp; Verification Sign-off</span>
                      </h4>
                      <div className="rounded-xl border border-stone-800 bg-[#121212] p-4 text-xs space-y-2">
                        <p className="text-stone-400">
                          <strong>Grounded Audit Trail:</strong> Verified against active GL schedules and transaction invoices.
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-emerald-400 font-mono text-[11px]">
                          <span className="rounded bg-emerald-950/80 px-2 py-0.5 border border-emerald-800/40">SOC 2 Type II Compliant</span>
                          <span className="rounded bg-emerald-950/80 px-2 py-0.5 border border-emerald-800/40">Zero External Hallucination Guarantee</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View 4: Templates (Review Item 6: Interactive, prompt-based, visual previews, custom creation) */}
      {activeView === "templates" && (
        <div className="h-full overflow-y-auto bg-[#0d0d0d] p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Header with Title & "Create Custom Template" CTA */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-white tracking-tight">Financial Templates</h2>
                <p className="text-[13px] text-stone-400">
                  Pre-configured prompt workflows, automated variance decks, and close schedules with interactive visuals
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateTemplateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create Custom Template</span>
              </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...customTemplates, ...defaultTemplates].map((t) => (
                <div
                  key={t.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-stone-800 bg-[#151515] p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-stone-700 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="rounded-md bg-[#242424] px-2.5 py-0.5 font-mono text-stone-300 font-medium border border-stone-700/60">
                        {t.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {t.isCustom && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                            CUSTOM
                          </span>
                        )}
                        <span className="font-mono text-stone-500">{t.meta}</span>
                      </div>
                    </div>

                    <h3 className="mt-3.5 text-[16px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {t.name}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] text-stone-400 leading-relaxed">
                      {t.description}
                    </p>

                    {/* Visual Indicators */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {t.visuals.map((v) => (
                        <span
                          key={v}
                          className="rounded-md bg-[#1d1d1d] px-2 py-0.5 font-mono text-[10.5px] text-stone-300 border border-stone-800"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-stone-800/80 pt-3.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(t)}
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-stone-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                      <span>Preview Prompt</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {t.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTemplate(t.id, e)}
                          title="Delete template"
                          className="rounded-full p-1.5 text-stone-500 hover:bg-rose-950/60 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLaunchTemplate(t)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-3 py-1 text-[12px] font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                      >
                        <Play className="size-3" />
                        <span>Run in Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Create Custom Template */}
            {isCreateTemplateOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
                <div className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-[#161616] p-6 shadow-2xl space-y-4 text-stone-200">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-400" />
                      <span>Create Custom Financial Template</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCreateTemplateOpen(false)}
                      className="rounded-full p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-stone-300 mb-1">Template Name</label>
                      <input
                        type="text"
                        placeholder="e.g., SaaS Unit Economics & CAC Payback"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="w-full rounded-xl border border-stone-800 bg-[#1f1f1f] px-3 py-2 text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-stone-300 mb-1">Category</label>
                      <select
                        value={newTemplateCategory}
                        onChange={(e) => setNewTemplateCategory(e.target.value)}
                        className="w-full rounded-xl border border-stone-800 bg-[#1f1f1f] px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="FP&A & Cost Control">FP&amp;A &amp; Cost Control</option>
                        <option value="Executive Reporting">Executive Reporting</option>
                        <option value="Treasury & Working Capital">Treasury &amp; Working Capital</option>
                        <option value="Vendor & Tech Spend">Vendor &amp; Tech Spend</option>
                        <option value="Audit & Controllership">Audit &amp; Controllership</option>
                        <option value="Strategic Finance">Strategic Finance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-stone-300 mb-1">Brief Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Evaluates customer acquisition cost, magic number, and churn trajectory."
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                        className="w-full rounded-xl border border-stone-800 bg-[#1f1f1f] px-3 py-2 text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-stone-300 mb-1">Prompt Instructions</label>
                      <textarea
                        rows={4}
                        placeholder="Specify the analysis prompt FInAI will execute, metrics to compute, and how to format results..."
                        value={newTemplatePrompt}
                        onChange={(e) => setNewTemplatePrompt(e.target.value)}
                        className="w-full rounded-xl border border-stone-800 bg-[#1f1f1f] px-3 py-2 text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-stone-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateTemplateOpen(false)}
                      className="rounded-full px-4 py-1.5 text-xs text-stone-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomTemplate}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Preview Template Prompt */}
            {previewTemplate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
                <div className="relative w-full max-w-lg rounded-2xl border border-stone-800 bg-[#161616] p-6 shadow-2xl space-y-4 text-stone-200">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div>
                      <span className="rounded bg-[#202020] px-2 py-0.5 font-mono text-[10.5px] text-stone-400">
                        {previewTemplate.category}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-white">
                        {previewTemplate.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(null)}
                      className="rounded-full p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-stone-400 mb-1">Description:</p>
                      <p className="text-stone-300 leading-relaxed">{previewTemplate.description}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-stone-400 mb-1">Executable Prompt:</p>
                      <div className="rounded-xl border border-stone-800 bg-[#111111] p-3 text-[12px] font-mono text-emerald-300 leading-relaxed">
                        {previewTemplate.prompt}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-stone-400 mb-1">Expected Visual Outputs:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewTemplate.visuals.map((v) => (
                          <span
                            key={v}
                            className="rounded-md bg-[#222222] px-2 py-0.5 font-mono text-[10.5px] text-stone-300 border border-stone-700/60"
                          >
                            ✓ {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-stone-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(null)}
                      className="rounded-full px-4 py-1.5 text-xs text-stone-400 hover:text-white"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchTemplate(previewTemplate)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <Play className="size-3.5" />
                      <span>Launch This Template</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 5: History & Runs (Dark mode theme matching agent UI) */}
      {activeView === "runs" && (
        <div className="h-full overflow-y-auto bg-[#0d0d0d] p-4 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-[24px] font-bold text-white tracking-tight">Execution History</h2>
              <p className="text-[13px] text-stone-400">
                Audit trail of agent executions, model routing, and verified ledger tie-outs
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: "Board Pack Agent",
                  detail: "October board pack · 12 steps",
                  models: "Claude 3.7 + Gemini 1.5",
                  time: "Today, 9:41 AM",
                  status: "done" as const,
                },
                {
                  name: "Flux Analysis Sweep",
                  detail: "All opex accounts · 41 checks",
                  models: "DeepSeek R1 → GPT-4o",
                  time: "Today, 8:15 AM",
                  status: "rerouted" as const,
                },
                {
                  name: "Close Checklist Review",
                  detail: "September close · 38 items",
                  models: "Claude 3.5 Sonnet",
                  time: "Yesterday",
                  status: "done" as const,
                },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-2xl border border-stone-800 bg-[#161616] p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        r.status === "rerouted"
                          ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                          : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                      }`}
                    >
                      {r.status === "rerouted" ? (
                        <Route className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-semibold text-white">{r.name}</h4>
                        {r.status === "rerouted" && (
                          <span className="rounded-full bg-amber-950/60 px-2 py-0.5 font-mono text-[9.5px] font-medium text-amber-300 border border-amber-800/40">
                            MODEL REROUTED
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-stone-400">{r.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[11px] text-stone-300">{r.models}</p>
                    <p className="font-mono text-[10.5px] text-stone-500">{r.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
