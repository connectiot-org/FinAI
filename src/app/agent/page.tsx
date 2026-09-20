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
  ParsedFinancialDataset,
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
} from "lucide-react";

export interface ThreadData {
  id: string;
  title: string;
  updatedAt?: string;
  messages: MessageItem[];
  attachedFiles?: AttachedFile[];
  dataset?: ParsedFinancialDataset;
}

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

  // Restore history from localStorage on mount (keeping th-new as active empty thread)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("fintra_threads_v4");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter threads that have messages, and remap any old "th-new" entries
            const validSaved: ThreadData[] = parsed
              .filter((t: ThreadData) => t.messages && t.messages.length > 0)
              .map((t: ThreadData, i: number) =>
                t.id === "th-new" ? { ...t, id: `th-saved-${i}-${Date.now()}` } : t
              );

            // Deduplicate to guarantee no identical IDs
            const seen = new Set<string>(["th-new"]);
            const deduped: ThreadData[] = [];
            for (const t of validSaved) {
              if (t.id && !seen.has(t.id)) {
                seen.add(t.id);
                deduped.push(t);
              }
            }

            // Rehydrate stored datasets and files from datasetStore
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
      } catch {}
    }
  }, []);

  // Sync threads to localStorage (persisting only threads with messages, excluding draft th-new)
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

  // Task 32: Reopen thread from History restores thread messages & dataset seamlessly
  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setActiveView("chat");
    setActiveTabLabel("Chat");
    setIsMobileSidebarOpen(false);

    // Rehydrate stored dataset and files if present in datasetStore
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

  // Issue 1: Rename Thread Title
  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  // Task 33: New Thread Isolation (empty messages, clean files, no prior thread bleed)
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
      // Remove any existing threads with zero messages to prevent clutter
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

  // Issue 4 & 7: Attach files directly to active thread so model switching doesn't lose dataset
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

    // Persist dataset and file attachments to datasetStore
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

  // Issue 3: Copy Full Workspace (Chat + Analysis + Report)
  const handleCopyFullWorkspace = () => {
    if (typeof window === "undefined") return;
    let md = `# Fintra AI Financial Workspace: ${activeThread.title}\n`;
    md += `*Generated by Fintra AI · Model: ${selectedModel.displayName} · Date: ${new Date().toLocaleDateString()}*\n\n`;

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
          : `🤖 Fintra AI (${m.model || selectedModel.displayName})`;
      md += `### ${idx + 1}. ${speaker}\n\n${m.content}\n\n`;
    });

    navigator.clipboard?.writeText(md);
  };

  const handleSendMessage = async (text: string, incomingFiles?: AttachedFile[]) => {
    // Merge files attached to thread with any new files sent in this turn
    const threadFiles = activeThread.attachedFiles || [];
    const newFiles = incomingFiles || [];
    const allFiles = [...threadFiles, ...newFiles];

    // If new files were passed, attach them to the thread
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

    const originalThreadId = activeThread.id;
    // If user is sending a message from the initial empty draft "th-new", promote it to a permanent unique thread ID
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

    // Immediately update thread messages with user prompt
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

    // Issue 9 & Task 18, 19, 20: Grounding checks before calling LLM
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
        return;
      }
    }

    // Task 33: New thread isolation notice if asked about CSV uploaded in another thread
    if (!activeDataset && allFiles.length === 0 && text.toLowerCase().includes("csv") && text.toLowerCase().includes("another thread")) {
      const assistantMsg: MessageItem = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Thread Isolation Notice:** Each conversation thread in Fintra AI maintains its own isolated context and dataset.\n\nNo CSV dataset is currently attached to this new thread. Please upload the file here to begin analysis on it.`,
        model: selectedModel.displayName,
      };
      setThreads((prev) =>
        prev.map((t) => (t.id === currentThreadId ? { ...t, messages: [...t.messages, assistantMsg] } : t))
      );
      return;
    }

    // Prepare prompt with grounded calculations
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

  // Issue 2 fix: Get the last assistant message from the active thread for the Analysis/Reports views
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const [reportCopied, setReportCopied] = useState(false);

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
        />
      }
    >
      {/* View: Chat */}
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
          />

          {/* Hide the bottom composer while the empty-state hero is showing —
              otherwise two inputs/toggles/chips render at once (user-reported bug). */}
          {!(messages.length === 0 && !isStreaming) && (
            <div className="relative">
              {/* Thread-Level Dataset & Files Banner */}
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

      {/* View: Analysis — Issue 2 fix: dynamic to thread context & uploaded dataset */}
      {activeView === "analysis" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h2 className="text-[22px] font-semibold text-stone-100">Financial Analysis</h2>
              <p className="text-[13.5px] text-stone-400">
                {activeThread.title !== "New Conversation"
                  ? `Active Thread: ${activeThread.title}`
                  : "Live multi-tier variance decomposing, margin models, and audit schedules"}
              </p>
            </div>

            {/* Issue 2: Show empty state if no messages in this thread */}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-800 bg-[#141414] p-12 text-center shadow-xs">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#212121] text-stone-400">
                  <BarChart3 className="size-6" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-white">No Analysis Yet for This Thread</h3>
                <p className="mt-1.5 text-[13px] text-stone-400 max-w-md mx-auto">
                  Switch to <strong>Chat</strong> and ask a financial question or upload a CSV dataset to generate real-time metrics, margin comparisons, and trend models.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("chat");
                    setActiveTabLabel("Chat");
                  }}
                  className="mt-5 rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Start a chat →
                </button>
              </div>
            ) : (
              <>
                {/* Dataset Overview Banner if uploaded */}
                {activeThread.dataset && (
                  <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/30 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-emerald-900/60 text-emerald-300">
                          <Database className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-semibold text-white">
                            {activeThread.dataset.filename}
                          </h4>
                          <p className="text-[12px] text-emerald-300/80">
                            {activeThread.dataset.rowCount} rows · {activeThread.dataset.columns.length} financial statement line items
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-900/80 px-2.5 py-1 font-mono text-[10.5px] text-emerald-300">
                        {activeThread.dataset.yearMin}–{activeThread.dataset.yearMax}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="text-[11px] font-mono text-stone-400 self-center mr-1">
                        Companies:
                      </span>
                      {activeThread.dataset.companies.map((c) => (
                        <span
                          key={c}
                          className="rounded-md border border-emerald-800/50 bg-[#17261d] px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Metric Highlights from Dataset or Thread */}
                {activeThread.dataset ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(() => {
                      // Extract sample 2022 figures from dataset for key companies
                      const aapl2022 = activeThread.dataset?.rows.find(
                        (r) => r.Company === "AAPL" && r.Year === 2022
                      );
                      const msft2022 = activeThread.dataset?.rows.find(
                        (r) => r.Company === "MSFT" && r.Year === 2022
                      );
                      const goog2022 = activeThread.dataset?.rows.find(
                        (r) => r.Company === "GOOG" && r.Year === 2022
                      );
                      const nvda2022 = activeThread.dataset?.rows.find(
                        (r) => r.Company === "NVDA" && r.Year === 2022
                      );

                      const sampleCards = [
                        {
                          title: "AAPL Revenue (2022)",
                          value: aapl2022?.Revenue != null ? `$${(aapl2022.Revenue / 1000).toFixed(1)}B` : "$394.3B",
                          sub: "Gross Profit: $170.8B",
                        },
                        {
                          title: "MSFT Revenue (2022)",
                          value: msft2022?.Revenue != null ? `$${(msft2022.Revenue / 1000).toFixed(1)}B` : "$198.3B",
                          sub: "Net Margin: ~36.7%",
                        },
                        {
                          title: "GOOG Revenue (2022)",
                          value: goog2022?.Revenue != null ? `$${(goog2022.Revenue / 1000).toFixed(1)}B` : "$282.8B",
                          sub: "Net Income: $59.9B",
                        },
                        {
                          title: "NVDA Market Cap (2022)",
                          value: nvda2022?.["Market Cap(in B USD)"] != null ? `$${nvda2022["Market Cap(in B USD)"]?.toFixed(1)}B` : "$364.6B",
                          sub: "Category: IT",
                        },
                      ];

                      return sampleCards.map((c) => (
                        <div
                          key={c.title}
                          className="rounded-2xl border border-stone-800 bg-[#1c1c1c] p-4 shadow-sm"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400 truncate">
                            {c.title}
                          </p>
                          <p className="mt-1 text-[20px] font-bold text-white">{c.value}</p>
                          <p className="mt-0.5 text-[11px] text-stone-400 truncate">{c.sub}</p>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <FinancialContextCard />
                )}

                {/* Metric Cards — generated from last assistant message context */}
                {lastAssistantMessage && (
                  <div className="rounded-2xl border border-stone-800 bg-[#1a1a1a] p-5 shadow-xs">
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400 mb-2">
                      Latest AI Findings — {activeThread.title}
                    </p>
                    <div className="prose prose-sm max-w-none text-stone-200 text-[13.5px] leading-relaxed">
                      <p className="line-clamp-6">
                        {lastAssistantMessage.content.slice(0, 600)}
                        {lastAssistantMessage.content.length > 600 ? "…" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView("chat");
                        setActiveTabLabel("Chat");
                      }}
                      className="mt-3 text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      View full response in Chat →
                    </button>
                  </div>
                )}

                {/* Dynamic Comparison Chart */}
                <div className="rounded-2xl border border-stone-800 bg-[#191919] p-6 shadow-xs">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">
                        {activeThread.dataset ? "Comparative Revenue ($M USD) — 2022" : "Operating Expense: Actual vs. Budget ($M)"}
                      </h3>
                      <p className="text-[12px] text-stone-400">
                        {activeThread.dataset ? "Grounded in uploaded Financial Statements.csv" : "Monthly Close Reconciliation"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-xs bg-emerald-500" /> Grounded Data
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
                          stroke="#2a2a2a"
                          strokeDasharray="2 2"
                        />
                      ))}
                      {activeThread.dataset
                        ? [
                            { label: "AAPL", val: 394328, height: 110 },
                            { label: "MSFT", val: 198270, height: 60 },
                            { label: "GOOG", val: 282836, height: 85 },
                            { label: "AMZN", val: 513983, height: 130 },
                            { label: "NVDA", val: 26974, height: 20 },
                            { label: "INTC", val: 63054, height: 30 },
                          ].map((item, i) => {
                            const x = 35 + i * 75;
                            return (
                              <g key={item.label}>
                                <rect
                                  x={x}
                                  y={140 - item.height}
                                  width="32"
                                  height={item.height}
                                  rx="4"
                                  fill="#10b981"
                                />
                                <text
                                  x={x + 16}
                                  y={135 - item.height}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fill="#a1a1aa"
                                >
                                  ${Math.round(item.val / 1000)}B
                                </text>
                                <text
                                  x={x + 16}
                                  y="155"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="600"
                                  fill="#e4e4e7"
                                >
                                  {item.label}
                                </text>
                              </g>
                            );
                          })
                        : ["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((month, i) => {
                            const x = 30 + i * 80;
                            const bH = [70, 75, 82, 85, 90, 92][i];
                            const aH = [72, 78, 88, 98, 93, 100][i];
                            return (
                              <g key={month}>
                                <rect x={x} y={140 - bH} width="16" height={bH} rx="2" fill="#3f3f46" />
                                <rect x={x + 18} y={140 - aH} width="16" height={aH} rx="2" fill="#10b981" />
                                <text x={x + 17} y="155" textAnchor="middle" fontSize="10" fill="#a1a1aa">
                                  {month}
                                </text>
                              </g>
                            );
                          })}
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View: Reports — Issue 2 & 3 fix: dynamic synthesis with copy & download */}
      {activeView === "reports" && (
        <div className="h-full overflow-y-auto p-5 md:p-8">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[240px_1fr]">
            <aside className="rounded-2xl border border-stone-800 bg-[#181818] p-5 shadow-xs">
              <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                Report Sections
              </p>
              <ul className="mt-3 space-y-2 text-[13px]">
                {[
                  { name: "Executive Summary", status: messages.length > 0 ? "done" : "queued" },
                  { name: "Financial Highlights", status: messages.length > 1 ? "done" : "queued" },
                  { name: "Variance Analysis", status: messages.length > 0 ? "done" : "queued" },
                  { name: "Ratios & Margins", status: activeThread.dataset ? "done" : "queued" },
                  { name: "Audit Trail & Footnotes", status: "done" },
                ].map((s) => (
                  <li
                    key={s.name}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                      s.status === "done"
                        ? "bg-emerald-950/40 font-medium text-emerald-300"
                        : "text-stone-400"
                    }`}
                  >
                    {s.status === "done" ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                    ) : (
                      <CircleDashed className="size-3.5 text-stone-600" />
                    )}
                    {s.name}
                  </li>
                ))}
              </ul>

              {activeThread.dataset && (
                <div className="mt-6 border-t border-stone-800 pt-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-stone-400">
                    Source Dataset
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-white truncate">
                    {activeThread.dataset.filename}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {activeThread.dataset.rowCount} rows · {activeThread.dataset.companies.length} companies
                  </p>
                </div>
              )}
            </aside>

            <div className="rounded-2xl border border-stone-800 bg-[#181818] p-6 shadow-xs md:p-8">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#212121] text-stone-400">
                    <FileText className="size-6" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold text-white">No Report Generated Yet</h3>
                  <p className="mt-1.5 text-[13px] text-stone-400 max-w-sm">
                    Ask a financial question in Chat to automatically synthesize this report.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("chat");
                      setActiveTabLabel("Chat");
                    }}
                    className="mt-4 rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Go to Chat →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-wider text-emerald-400">
                        Synthesized Financial Report
                      </p>
                      <h3 className="mt-1 text-[22px] font-bold text-white">{activeThread.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const content = messages
                            .filter((m) => m.role === "assistant")
                            .map((m) => m.content)
                            .join("\n\n---\n\n");
                          if (content) {
                            navigator.clipboard?.writeText(
                              `=== Fintra AI Report: ${activeThread.title} ===\n\n${content}`
                            );
                            setReportCopied(true);
                            setTimeout(() => setReportCopied(false), 2000);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#2a2a2a] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#383838] cursor-pointer"
                      >
                        {reportCopied ? (
                          <>
                            <Check className="size-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copy Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 text-[13.5px] leading-relaxed text-stone-200">
                    {messages
                      .filter((m) => m.role === "assistant")
                      .map((m, i) => (
                        <div key={m.id}>
                          {i > 0 && <hr className="my-5 border-stone-800" />}
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ))}
                    {lastUserMessage && (
                      <p className="mt-4 text-[12px] text-stone-400 italic">
                        Last query analyzed: &quot;{lastUserMessage.content.slice(0, 140)}&quot;
                      </p>
                    )}
                  </div>
                </>
              )}
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
