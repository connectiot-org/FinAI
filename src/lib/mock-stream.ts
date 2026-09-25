import { SseEvent } from "./sse-types";

export type MockScenario = "normal" | "error-mid-stream" | "stop-abort" | "empty-response";

export interface MockStreamOptions {
  scenario?: MockScenario;
  modelId?: string;
  delayMs?: number;
}

export function createMockStream(
  prompt: string,
  options: MockStreamOptions = {}
): ReadableStream<Uint8Array> {
  const { scenario = "normal", modelId = "anthropic/claude-3.5-sonnet", delayMs = 30 } = options;
  const encoder = new TextEncoder();

  const steps = [
    "Resolving model routing policy & gateway quota",
    "Ingesting financial context and schedule mappings",
    "Executing variance flux decomposition and GL ties",
    "Verifying calculations against GAAP / IFRS standards",
    "Synthesizing auditable financial response with evidence",
  ];

  const sampleResponse = `Based on your analysis request for **"${prompt}"**:

### Executive Summary
Operating expense ran **$23.1M** vs. an approved budget of **$22.4M** (+3.1% variance). Two major drivers account for 92% of the deviation:

| Line Item | Budget | Actual | Variance (%) | Status |
| :--- | :---: | :---: | :---: | :---: |
| Cloud Infrastructure | $0.92M | $1.09M | +18.4% | REVIEW |
| External Contractors | $0.63M | $0.71M | +12.7% | REVIEW |
| Payroll & Benefits | $4.82M | $4.97M | +3.2% | NORMAL |
| Marketing Programs | $1.10M | $1.01M | -8.1% | FAVORABLE |
| Travel & Entertainment | $0.40M | $0.42M | +5.0% | NORMAL |

### Key Observations
1. **Cloud & Infrastructure**: Unplanned data-platform migration costs ($0.17M) in July have compounded due to dual-running systems.
2. **Contractor Utilization**: Engineering and audit surge staffing exceeded forecasted headcount with no matching approved PO variance.

*Disclaimer: FInAI outputs are structured analytical interpretations for finance teams. Always review underlying workpapers prior to final board publication.*`;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      function sendEvent(eventObj: SseEvent) {
        const payload = `event: ${eventObj.event}\ndata: ${JSON.stringify(eventObj.data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      if (scenario === "empty-response") {
        sendEvent({
          event: "done",
          data: { messageId: `msg-${Date.now()}`, status: "SUCCEEDED" },
        });
        controller.close();
        return;
      }

      // 1. Emit Steps
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, delayMs * 2));
        sendEvent({
          event: "step",
          data: {
            id: `step-${i + 1}`,
            label: steps[i],
            status: "active",
            index: i,
          },
        });
        await new Promise((r) => setTimeout(r, delayMs * 2));
        sendEvent({
          event: "step",
          data: {
            id: `step-${i + 1}`,
            label: steps[i],
            status: "done",
            index: i,
            duration: "0.2s",
          },
        });
      }

      // 2. Emit Evidence
      sendEvent({
        event: "evidence",
        data: {
          id: "ev-1",
          ref: "GL-6100",
          label: "General Ledger 6100 · 84 lines reconciled",
          kind: "ledger-lines",
          confidence: 0.98,
        },
      });

      // 3. Emit Text Deltas
      const chunks = sampleResponse.split(" ");
      for (let i = 0; i < chunks.length; i++) {
        if (scenario === "error-mid-stream" && i === 15) {
          sendEvent({
            event: "error",
            data: {
              code: "UPSTREAM_TIMEOUT",
              message: "Gateway timed out waiting for completion token.",
              retryable: true,
            },
          });
          controller.close();
          return;
        }

        if (scenario === "stop-abort" && i === 20) {
          sendEvent({
            event: "done",
            data: {
              messageId: `msg-${Date.now()}`,
              status: "STOPPED",
            },
          });
          controller.close();
          return;
        }

        const delta = chunks[i] + (i === chunks.length - 1 ? "" : " ");
        sendEvent({
          event: "text-delta",
          data: { text: delta },
        });
        await new Promise((r) => setTimeout(r, delayMs));
      }

      // 4. Emit Usage
      sendEvent({
        event: "usage",
        data: {
          model: modelId,
          promptTokens: 840,
          completionTokens: 320,
          costUsd: 0.0034,
          durationMs: 1420,
        },
      });

      // 5. Emit Done
      sendEvent({
        event: "done",
        data: {
          messageId: `msg-${Date.now()}`,
          status: "SUCCEEDED",
        },
      });

      controller.close();
    },
  });
}
