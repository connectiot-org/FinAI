import { ProviderAdapter, AdapterChatRequest } from "./provider-adapter";
import { SseEvent } from "../../../lib/sse-types";
import { env } from "../../env";

/** Hard timeout for the upstream completion request (the caller's AbortSignal
 *  only covers user-initiated cancellation). */
const UPSTREAM_TIMEOUT_MS = 55_000;

export class OpenRouterAdapter implements ProviderAdapter {
  id = "openrouter";
  name = "OpenRouter Gateway";

  async *streamCompletion(request: AdapterChatRequest): AsyncIterable<SseEvent> {
    const apiKey = env.OPENROUTER_API_KEY;
    const baseUrl = env.OPENROUTER_BASE_URL.replace(/\/+$/, "");
    const startTime = Date.now();

    if (!apiKey) {
      yield {
        event: "error",
        data: {
          code: "UPSTREAM_AUTH",
          message:
            "AI provider is not configured on this deployment (missing OPENROUTER_API_KEY).",
          retryable: false,
        },
      };
      return;
    }

    // Combine the caller's signal with a hard timeout.
    const timeoutSignal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    const signal = request.signal
      ? AbortSignal.any([request.signal, timeoutSignal])
      : timeoutSignal;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.APP_URL,
        "X-Title": "FInAI Financial Workspace",
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 4096,
        stream: true,
        // Ask the provider to include a real usage frame in the final chunk.
        stream_options: { include_usage: true },
      }),
      signal,
    }).catch((err: unknown) => {
      // fetch rejects on abort/network failure — translate into a typed error.
      return {
        ok: false,
        status: 599,
        text: async () =>
          err instanceof Error ? err.message : "Upstream connection failed",
      } as unknown as Response;
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorCode = "UPSTREAM_ERROR";
      let retryable = true;

      if (response.status === 401 || response.status === 403) {
        errorCode = "UPSTREAM_AUTH";
        retryable = false;
      } else if (response.status === 402) {
        errorCode = "INSUFFICIENT_CREDITS";
        retryable = true;
      } else if (response.status === 408 || response.status === 504 || response.status === 599) {
        errorCode = "UPSTREAM_TIMEOUT";
        retryable = true;
      } else if (response.status === 429) {
        errorCode = "RATE_LIMITED";
        retryable = true;
      }

      // Log the raw upstream error body server-side for diagnosis, but do
      // NOT echo it to the client: provider/proxy error bodies can leak
      // internal details (URLs, account hints, stack traces).
      if (errorText) {
        console.warn(
          `[openrouter] upstream ${response.status} for model ${request.modelId}: ${errorText.slice(0, 400)}`
        );
      }

      yield {
        event: "error",
        data: {
          code: errorCode,
          message: `Provider returned status ${response.status}`,
          retryable,
        },
      };
      return;
    }

    if (!response.body) {
      yield {
        event: "error",
        data: {
          code: "UPSTREAM_ERROR",
          message: "Empty response body from AI provider",
          retryable: true,
        },
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedContent = "";
    let accumulatedReasoning = "";
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;
    let contentDelivered = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.error) {
              const errMsg = parsed.error.message || "Provider error in stream";
              const errCode = parsed.error.code || "UPSTREAM_ERROR";
              yield {
                event: "error",
                data: {
                  code: String(errCode),
                  message: String(errMsg),
                  retryable: true,
                },
              };
              return;
            }

            const choice = parsed.choices?.[0];
            const deltaContent = choice?.delta?.content;
            const deltaReasoning =
              choice?.delta?.reasoning ||
              choice?.delta?.reasoning_content ||
              choice?.delta?.thought;

            if (deltaContent) {
              accumulatedContent += deltaContent;
              yield {
                event: "text-delta",
                data: { text: deltaContent },
              };
            } else if (deltaReasoning) {
              accumulatedReasoning += deltaReasoning;
            }

            if (parsed.usage) {
              promptTokens =
                parsed.usage.prompt_tokens ?? promptTokens;
              completionTokens =
                parsed.usage.completion_tokens ?? completionTokens;
            }
          } catch {
            // Ignore partial parse
          }
        }
      }

      // If model only output reasoning (e.g. thinking models before cutoff),
      // emit the reasoning as the answer.
      if (!accumulatedContent.trim() && accumulatedReasoning.trim()) {
        accumulatedContent = accumulatedReasoning;
        contentDelivered = true;
        yield {
          event: "text-delta",
          data: { text: accumulatedReasoning },
        };
      }
      if (accumulatedContent.trim() && accumulatedContent !== accumulatedReasoning) {
        contentDelivered = true;
      }

      // If the model returned nothing usable, surface a retryable error so the
      // gateway can try the next candidate (unless we already delivered
      // reasoning-as-content above).
      if (!contentDelivered && !accumulatedContent.trim()) {
        yield {
          event: "error",
          data: {
            code: "EMPTY_COMPLETION",
            message: "Model completed with empty response content",
            retryable: true,
          },
        };
        return;
      }

      // Usage frame. When the provider did not report token counts we mark
      // the values as estimated instead of inventing plausible-looking ones —
      // cost accounting stays honest.
      const hasRealUsage = promptTokens !== null || completionTokens !== null;
      const estPrompt =
        promptTokens ??
        Math.ceil(
          request.messages.reduce((acc, m) => acc + m.content.length, 0) / 4
        );
      const estCompletion =
        completionTokens ?? Math.ceil(accumulatedContent.length / 4);

      yield {
        event: "usage",
        data: {
          model: request.modelId,
          promptTokens: estPrompt,
          completionTokens: estCompletion,
          costUsd:
            Math.round(
              (estPrompt * 0.000001 + estCompletion * 0.000003) * 1e6
            ) / 1e6,
          durationMs: Date.now() - startTime,
          estimated: !hasRealUsage,
        },
      };

      // Done frame
      yield {
        event: "done",
        data: {
          messageId: `msg_${Date.now()}`,
          status: "SUCCEEDED",
        },
      };
    } finally {
      // Ensure the upstream connection is not left dangling on early exit
      // (in-stream error, empty completion, client abort). cancel() aborts
      // the underlying stream AND releases the reader lock — calling
      // releaseLock() first would turn cancel() into a rejected no-op and
      // leave the socket pinned.
      try {
        await reader.cancel();
      } catch {
        // Reader already closed/released — nothing to do.
      }
    }
  }
}

export const openRouterAdapter = new OpenRouterAdapter();
