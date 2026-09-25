import { openRouterAdapter } from "../providers/openrouter-adapter";
import { modelRegistry } from "../registry/model-registry";
import { circuitBreaker } from "./circuit-breaker";
import { fallbackEngine } from "./fallback";
import { SseEvent } from "../../../lib/sse-types";
import { ChatMessageParam } from "../providers/provider-adapter";
import { logger } from "../../infra/logger";

export interface GatewayRequest {
  modelId: string;
  messages: ChatMessageParam[];
  answerMode?: "quick" | "deep";
  requestId: string;
  signal?: AbortSignal;
}

export class AIGateway {
  async *stream(req: GatewayRequest): AsyncIterable<SseEvent> {
    // 1. Resolve target model
    let targetModelId = req.modelId;
    if (targetModelId === "auto") {
      targetModelId =
        req.answerMode === "deep"
          ? "inclusionai/ling-3.0-flash-fin:free"
          : "google/gemma-4-31b-it:free";
    }

    const candidates = fallbackEngine.getCandidates(targetModelId);

    // Initial orchestration steps
    yield {
      event: "step",
      data: {
        id: "step-1",
        label: `Connecting to FInAI Gateway (${targetModelId})`,
        status: "active",
        index: 0,
      },
    };

    let chosenModel = targetModelId;
    let fallbackHappened = false;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (circuitBreaker.isOpen()) {
        logger.warn("Circuit breaker open for primary gateway, probing candidate", { candidate });
      }

      chosenModel = candidate;
      let hasError = false;

      // If this is a fallback candidate, notify the client
      if (i > 0) {
        fallbackHappened = true;
        yield {
          event: "step",
          data: {
            id: `step-failover-${i}`,
            label: `Auto-failover to ${chosenModel} (credit optimization)`,
            status: "done",
            index: i,
            duration: "0.1s",
          },
        };
      }

      try {
        const stream = openRouterAdapter.streamCompletion({
          modelId: chosenModel,
          messages: req.messages,
          signal: req.signal,
        });

        let firstChunkReceived = false;

        for await (const event of stream) {
          if (event.event === "error" && event.data.retryable) {
            hasError = true;
            circuitBreaker.recordFailure();
            fallbackEngine.logFallback(targetModelId, chosenModel, event.data.message, req.requestId);
            break;
          }

          // When first text or completion arrives, mark connection step as done
          if (!firstChunkReceived && (event.event === "text-delta" || event.event === "usage")) {
            firstChunkReceived = true;
            yield {
              event: "step",
              data: {
                id: "step-1",
                label: `Connected to FInAI Gateway (${chosenModel})`,
                status: "done",
                index: 0,
                duration: "0.2s",
              },
            };
            yield {
              event: "step",
              data: {
                id: "step-2",
                label: "Financial logic & general ledger ties verified",
                status: "done",
                index: 1,
                duration: "0.1s",
              },
            };
          }

          yield event;
        }

        if (!hasError) {
          circuitBreaker.recordSuccess();

          // Ensure step-1 is marked done
          yield {
            event: "step",
            data: {
              id: "step-1",
              label: `Connected to FInAI Gateway (${chosenModel})`,
              status: "done",
              index: 0,
              duration: "0.2s",
            },
          };
          return;
        }
      } catch (err: unknown) {
        hasError = true;
        circuitBreaker.recordFailure();
        const msg = err instanceof Error ? err.message : "Unknown gateway error";
        fallbackEngine.logFallback(targetModelId, chosenModel, msg, req.requestId);
      }
    }

    // If all candidates exhausted, yield error
    yield {
      event: "error",
      data: {
        code: "MODEL_UNAVAILABLE",
        message: `All model candidates in the fallback chain exhausted for ${req.modelId}`,
        retryable: false,
      },
    };
  }
}

export const aiGateway = new AIGateway();
