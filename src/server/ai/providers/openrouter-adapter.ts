import { ProviderAdapter, AdapterChatRequest } from "./provider-adapter";
import { SseEvent } from "../../../lib/sse-types";
import { env } from "../../env";

export class OpenRouterAdapter implements ProviderAdapter {
  id = "openrouter";
  name = "OpenRouter Gateway";

  async *streamCompletion(request: AdapterChatRequest): AsyncIterable<SseEvent> {
    const apiKey = env.OPENROUTER_API_KEY;
    const startTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://finai.ai",
        "X-Title": "FInAI Financial Workspace",
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 4096,
        stream: true,
      }),
      signal: request.signal,
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
      } else if (response.status === 408 || response.status === 504) {
        errorCode = "UPSTREAM_TIMEOUT";
        retryable = true;
      } else if (response.status === 429) {
        errorCode = "RATE_LIMITED";
        retryable = true;
      }

      yield {
        event: "error",
        data: {
          code: errorCode,
          message: `Provider returned status ${response.status}: ${errorText.slice(0, 120)}`,
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
    let promptTokens = 0;
    let completionTokens = 0;

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
              completionTokens += Math.ceil(deltaContent.length / 4);
              yield {
                event: "text-delta",
                data: { text: deltaContent },
              };
            } else if (deltaReasoning) {
              accumulatedReasoning += deltaReasoning;
              completionTokens += Math.ceil(deltaReasoning.length / 4);
            }

            if (parsed.usage) {
              promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
              completionTokens = parsed.usage.completion_tokens ?? completionTokens;
            }
          } catch {
            // Ignore partial parse
          }
        }
      }

      // If model only output reasoning (e.g. thinking models before cutoff), emit reasoning as the answer
      if (!accumulatedContent.trim() && accumulatedReasoning.trim()) {
        accumulatedContent = accumulatedReasoning;
        yield {
          event: "text-delta",
          data: { text: accumulatedReasoning },
        };
      }

      // If response is just a guardrail artifact or empty, trigger retryable error for fallback
      const cleanContent = accumulatedContent.replace(/^user safety:\s*safe\s*/i, "").trim();
      if (!cleanContent) {
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

      // Usage frame
      yield {
        event: "usage",
        data: {
          model: request.modelId,
          promptTokens: promptTokens || 600,
          completionTokens: completionTokens || 240,
          costUsd: (promptTokens * 0.000001 + completionTokens * 0.000003),
          durationMs: Date.now() - startTime,
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
      reader.releaseLock();
    }
  }
}

export const openRouterAdapter = new OpenRouterAdapter();
