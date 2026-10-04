import { SseEvent } from "./sse-types";

export interface StreamClientCallbacks {
  onStep?: (step: SseEvent & { event: "step" }) => void;
  onTextDelta?: (delta: string) => void;
  onEvidence?: (evidence: SseEvent & { event: "evidence" }) => void;
  onUsage?: (usage: SseEvent & { event: "usage" }) => void;
  onNotice?: (notice: SseEvent & { event: "notice" }) => void;
  onError?: (error: { code: string; message: string; retryable: boolean }) => void;
  onDone?: (done: { messageId: string; conversationId?: string; status?: string }) => void;
}

/**
 * Consumes an SSE ReadableStream and parses `event:` and `data:` blocks
 */
export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  callbacks: StreamClientCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        callbacks.onDone?.({ messageId: `msg-${Date.now()}`, status: "STOPPED" });
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.trim()) continue;

        const lines = part.split("\n");
        let eventName = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsedData = JSON.parse(dataStr);
          switch (eventName) {
            case "step":
              callbacks.onStep?.({ event: "step", data: parsedData });
              break;
            case "text-delta":
              callbacks.onTextDelta?.(parsedData.text);
              break;
            case "evidence":
              callbacks.onEvidence?.({ event: "evidence", data: parsedData });
              break;
            case "usage":
              callbacks.onUsage?.({ event: "usage", data: parsedData });
              break;
            case "notice":
              callbacks.onNotice?.({ event: "notice", data: parsedData });
              break;
            case "error":
              callbacks.onError?.(parsedData);
              break;
            case "done":
              callbacks.onDone?.(parsedData);
              break;
          }
        } catch (e) {
          console.warn("Failed to parse SSE JSON block:", dataStr, e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
