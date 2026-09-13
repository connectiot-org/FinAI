"use client";

import { useState } from "react";
import { modelsConfig, ModelConfig } from "@/config/models.config";
import { WorkspaceShell } from "@/components/agent/workspace-shell";
import { ThreadSidebar, ViewId } from "@/components/agent/thread-sidebar";
import { ThreadCanvas, MessageItem } from "@/components/agent/thread-canvas";
import { Composer, AttachedFile, formatFileSize } from "@/components/agent/composer";
import { FinancialContextCard } from "@/components/agent/financial-context-card";
import { EvidencePanel } from "@/components/agent/evidence-panel";
import { useThreadStream } from "@/lib/use-thread-stream";
import { CheckCircle2, CircleDashed, LoaderCircle, Route } from "lucide-react";

export interface ThreadData {
  id: string;
  title: string;
  updatedAt?: string;
  messages: MessageItem[];
}

const initialThreads: ThreadData[] = [
  {
    id: "th-1",
    title: "Q3 Actuals vs Budget Variance",
    updatedAt: "Today, 10:42 AM",
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

export default function WorkspacePage() {
  const [activeView, setActiveView] = useState<ViewId>("chat");
  const [activeTabLabel, setActiveTabLabel] = useState("Chat");
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(modelsConfig[0]);
  const [answerMode, setAnswerMode] = useState<"quick" | "deep">("deep");
  const [threads, setThreads] = useState<ThreadData[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>("th-1");

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || {
    id: "th-empty",
    title: "New Conversation",
    messages: [],
  };

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
  };

  const handleNewThread = () => {
    const newId = `th-${Date.now()}`;
    const newThread: ThreadData = {
      id: newId,
      title: "New Conversation",
      updatedAt: "Just now",
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setActiveView("chat");
    setActiveTabLabel("Chat");
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
          },
        ];
      }
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleSendMessage = async (text: string, files?: AttachedFile[]) => {
    const hasText = Boolean(text.trim());
    const hasFiles = Boolean(files && files.length > 0);
    if ((!hasText && !hasFiles) || isStreaming) return;

    const currentThreadId = activeThread.id;
    const fileNames = files?.map((f) => f.name) || [];
    const displayContent = hasText
      ? text.trim()
      : `Attached ${fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`} for financial review and analysis`;

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

    // Immediately update thread messages with user prompt
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === currentThreadId) {
          return {
            ...t,
            title: autoTitle || t.title,
            updatedAt: "Just now",
            messages: [...t.messages, userMsg],
          };
        }
        return t;
      })
    );

    // Build rich prompt for AI gateway including file metadata and extracted contents
    let promptToSend = displayContent;
    if (files && files.length > 0) {
      const fileContexts = files
        .map((f) => {
          if (f.textContent) {
            const preview =
              f.textContent.length > 4000
                ? f.textContent.slice(0, 4000) + "\n...[truncated for length]"
                : f.textContent;
            return `[Attached File: ${f.name} (${formatFileSize(f.size)})]\nContent:\n${preview}`;
          }
          return `[Attached File: ${f.name} (${formatFileSize(f.size)}, type: ${f.type || "binary/document"})]`;
        })
        .join("\n\n");
      promptToSend = `${displayContent}\n\n${fileContexts}`;
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
        const isRerouted = result.steps?.some((s) =>
          s.label?.toLowerCase().includes("failover")
        );

        const assistantMsg: MessageItem = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content:
            result.text ||
            (result.error
              ? `⚠️ Gateway notice: ${result.error.message}`
              : "(No response generated)"),
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

  return (
    <WorkspaceShell
      activeTabLabel={activeTabLabel}
      selectedModel={selectedModel}
      onSelectModel={setSelectedModel}
      answerMode={answerMode}
      onChangeAnswerMode={setAnswerMode}
      sidebar={
        <ThreadSidebar
          activeView={activeView}
          onChangeView={(v, lbl) => {
            setActiveView(v);
            setActiveTabLabel(lbl);
          }}
          onNewThread={handleNewThread}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
        />
      }
    >
      {/* View: Chat */}
      {activeView === "chat" && (
        <div className="flex h-full flex-col">
          <ThreadCanvas
            messages={messages}
            isStreaming={isStreaming}
            streamingSteps={steps}
            streamingText={streamText}
            activeModelName={selectedModel.displayName}
            isStopped={isStopped}
            onSelectPrompt={(p) => handleSendMessage(p)}
          />
          <Composer
            selectedModel={selectedModel}
            answerMode={answerMode}
            onChangeAnswerMode={setAnswerMode}
            isStreaming={isStreaming}
            onSend={handleSendMessage}
            onStop={stopStream}
          />
        </div>
      )}

      {/* View: Analysis */}
      {activeView === "analysis" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-[22px] font-semibold text-stone-950">Financial Analysis</h2>
              <p className="text-[13.5px] text-stone-500">
                Live variance decomposing, flux trends, and runway projections
              </p>
            </div>

            <FinancialContextCard />

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Revenue", value: "$24.8M", delta: "+12.4%", good: true, note: "vs. $22.1M LY" },
                { label: "Gross margin", value: "61.3%", delta: "-0.8pp", good: false, note: "mix shift" },
                { label: "Opex ratio", value: "34.2%", delta: "+1.1pp", good: false, note: "vs. plan 33.1%" },
                { label: "Cash reserves", value: "$18.2M", delta: "+$2.1M", good: true, note: "11.2 mo runway" },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">{m.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-[24px] font-bold text-stone-950">{m.value}</p>
                    <span
                      className={`font-mono text-[12px] font-semibold ${
                        m.good ? "text-moss" : "text-amber-700"
                      }`}
                    >
                      {m.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-stone-400">{m.note}</p>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-stone-900">
                    Operating Expense: Actual vs. Budget
                  </h3>
                  <p className="text-[12px] text-stone-400">$M per month · H2 FY26</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-xs bg-moss" /> Actual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-xs bg-stone-300" /> Budget
                  </span>
                </div>
              </div>
              <div className="h-60 w-full pt-4">
                <svg viewBox="0 0 500 160" className="h-full w-full">
                  {[0, 40, 80, 120].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="500"
                      y2={y}
                      stroke="#e5e5e5"
                      strokeDasharray="2 2"
                    />
                  ))}
                  {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((month, i) => {
                    const x = 30 + i * 80;
                    const bH = [70, 75, 82, 85, 90, 92][i];
                    const aH = [72, 78, 88, 98, 93, 100][i];
                    return (
                      <g key={month}>
                        <rect x={x} y={140 - bH} width="16" height={bH} rx="2" fill="#d6d3d1" />
                        <rect x={x + 18} y={140 - aH} width="16" height={aH} rx="2" fill="#006548" />
                        <text x={x + 17} y="155" textAnchor="middle" fontSize="10" fill="#78716c">
                          {month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View: Reports */}
      {activeView === "reports" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[240px_1fr]">
            <aside className="rounded-2xl border border-line bg-white p-5 shadow-xs">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">Report Outline</p>
              <ul className="mt-3 space-y-2 text-[13px]">
                {[
                  { name: "Executive summary", status: "done" },
                  { name: "Financial highlights", status: "done" },
                  { name: "Variance analysis", status: "active" },
                  { name: "Cash & runway", status: "queued" },
                  { name: "Risks & asks", status: "queued" },
                ].map((s) => (
                  <li
                    key={s.name}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                      s.status === "active"
                        ? "bg-moss-soft font-semibold text-moss-deep"
                        : "text-stone-600"
                    }`}
                  >
                    {s.status === "done" ? (
                      <CheckCircle2 className="size-3.5 text-moss" />
                    ) : s.status === "active" ? (
                      <LoaderCircle className="size-3.5 animate-spin text-moss" />
                    ) : (
                      <CircleDashed className="size-3.5 text-stone-300" />
                    )}
                    {s.name}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400">
                    Draft · v0.9 (Ready for Board)
                  </p>
                  <h3 className="mt-1 text-[22px] font-bold text-stone-950">Q3 FY26 Board Report</h3>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Board pack exported successfully to PDF")}
                  className="rounded-full bg-stone-950 px-4 py-2 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-moss-deep"
                >
                  Export PDF
                </button>
              </div>
              <div className="mt-6 space-y-4 text-[13px] leading-relaxed text-stone-700">
                <p>
                  <strong className="text-stone-950">3. Variance analysis.</strong> Total operating
                  expense of $23.1M ran $0.7M (+3.1%) ahead of the approved plan, driven primarily by
                  unplanned cloud infrastructure spend ($0.17M) and contractor utilization ($0.08M).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View: Templates */}
      {activeView === "templates" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-[22px] font-semibold text-stone-950">Financial Templates</h2>
              <p className="text-[13.5px] text-stone-500">
                Pre-configured financial workflows, close checklists, and board decks
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Monthly board pack", meta: "Deck · 12 slides", uses: "1.2k runs" },
                { name: "Budget vs. actual memo", meta: "Report · 4 pages", uses: "860 runs" },
                { name: "Flux analysis write-up", meta: "Report · 2 pages", uses: "740 runs" },
                { name: "Audit PBC checklist", meta: "Tracker · 38 items", uses: "410 runs" },
                { name: "13-week cash review", meta: "Analysis · model", uses: "295 runs" },
                { name: "Investor update", meta: "Email + deck", uses: "230 runs" },
              ].map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setActiveView("chat");
                    setActiveTabLabel("Chat");
                    handleSendMessage(`Run template: ${t.name}`);
                  }}
                  className="group rounded-2xl border border-line bg-white p-5 text-left shadow-xs transition-all hover:-translate-y-1 hover:border-stone-300 hover:shadow-card"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="rounded bg-paper-soft px-2 py-0.5 font-mono text-stone-600">
                      {t.meta}
                    </span>
                    <span className="font-mono text-stone-400">{t.uses}</span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-stone-900">{t.name}</h3>
                  <p className="mt-2 text-[12px] font-medium text-moss opacity-0 transition-opacity group-hover:opacity-100">
                    Launch template →
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View: History */}
      {activeView === "runs" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-[22px] font-semibold text-stone-950">Execution History</h2>
              <p className="text-[13.5px] text-stone-500">
                Audit trail of all agent executions, model routing, and outputs
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: "Board Pack Agent",
                  detail: "October board pack · 12 steps",
                  models: "Claude 3.7 + Gemini 1.5",
                  time: "Today, 9:41",
                  status: "done" as const,
                },
                {
                  name: "Flux analysis sweep",
                  detail: "All opex accounts · 41 checks",
                  models: "DeepSeek R1 → GPT-4o",
                  time: "Today, 8:15",
                  status: "rerouted" as const,
                },
                {
                  name: "Close checklist review",
                  detail: "September close · 38 items",
                  models: "Claude 3.5 Sonnet",
                  time: "Yesterday",
                  status: "done" as const,
                },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        r.status === "rerouted"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-moss-soft text-moss-deep"
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
                        <h4 className="text-[14px] font-medium text-stone-900">{r.name}</h4>
                        {r.status === "rerouted" && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9.5px] font-medium text-amber-700 ring-1 ring-amber-200">
                            MODEL REROUTED
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-stone-500">{r.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[11px] text-stone-600">{r.models}</p>
                    <p className="font-mono text-[10.5px] text-stone-400">{r.time}</p>
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
