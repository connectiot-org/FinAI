"use client";

import { useState, useRef, useCallback } from "react";
import { consumeSseStream } from "./stream-client";
import { createMockStream } from "./mock-stream";
import { SseStepPayload, SseEvidencePayload, SseUsagePayload } from "./sse-types";

export interface UseThreadStreamOptions {
  modelId: string;
  answerMode?: "quick" | "deep";
  conversationId?: string;
  useMock?: boolean;
}

export interface StreamResult {
  text: string;
  steps: SseStepPayload[];
  evidence: SseEvidencePayload[];
  usage: SseUsagePayload | null;
  isStopped: boolean;
  error?: { code: string; message: string; retryable: boolean } | null;
}

export function useThreadStream(options: UseThreadStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [steps, setSteps] = useState<SseStepPayload[]>([]);
  const [evidence, setEvidence] = useState<SseEvidencePayload[]>([]);
  const [usage, setUsage] = useState<SseUsagePayload | null>(null);
  const [error, setError] = useState<{ code: string; message: string; retryable: boolean } | null>(null);
  const [isStopped, setIsStopped] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsStopped(true);
    }
  }, []);

  const startStream = useCallback(
    async (
      prompt: string,
      messagesHistory: Array<{ role: string; content: string }> = []
    ): Promise<StreamResult> => {
      setIsStreaming(true);
      setStreamText("");
      setSteps([]);
      setEvidence([]);
      setUsage(null);
      setError(null);
      setIsStopped(false);

      let accumulatedText = "";
      const currentSteps: SseStepPayload[] = [];
      const currentEvidence: SseEvidencePayload[] = [];
      let currentUsage: SseUsagePayload | null = null;
      let currentError: { code: string; message: string; retryable: boolean } | null = null;
      let stopped = false;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let stream: ReadableStream<Uint8Array>;

        if (options.useMock) {
          stream = createMockStream(prompt, {
            modelId: options.modelId,
          });
        } else {
          // Attempt real endpoint
          const res = await fetch("/api/v1/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelId: options.modelId,
              answerMode: options.answerMode || "deep",
              conversationId: options.conversationId,
              messages: [...messagesHistory, { role: "user", content: prompt }],
            }),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            // Surface real API failures instead of silently swapping in demo data —
            // users were seeing fabricated financial numbers on gateway errors.
            const errorText = await res.text().catch(() => "");
            let errorMessage = `Chat stream request failed (HTTP ${res.status})`;
            try {
              const parsed = JSON.parse(errorText);
              if (parsed?.error?.message) errorMessage = parsed.error.message;
            } catch {
              // not JSON — keep default message
            }
            throw Object.assign(new Error(errorMessage), { httpStatus: res.status });
          }
          stream = res.body;
        }

        await consumeSseStream(
          stream,
          {
            onStep: (stepEvt) => {
              const idx = currentSteps.findIndex((s) => s.id === stepEvt.data.id);
              if (idx >= 0) {
                currentSteps[idx] = stepEvt.data;
              } else {
                currentSteps.push(stepEvt.data);
              }
              setSteps([...currentSteps]);
            },
            onTextDelta: (delta) => {
              accumulatedText += delta;
              setStreamText(accumulatedText);
            },
            onEvidence: (evEvt) => {
              currentEvidence.push(evEvt.data);
              setEvidence([...currentEvidence]);
            },
            onUsage: (uEvt) => {
              currentUsage = uEvt.data;
              setUsage(uEvt.data);
            },
            onError: (err) => {
              currentError = err;
              setError(err);
            },
            onDone: (donePayload) => {
              if (donePayload.status === "STOPPED") {
                stopped = true;
                setIsStopped(true);
              }
            },
          },
          controller.signal
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          stopped = true;
          setIsStopped(true);
        } else {
          const errObj = {
            code: "STREAM_ERROR",
            message: err instanceof Error ? err.message : "Stream connection failed",
            retryable: true,
          };
          currentError = errObj;
          setError(errObj);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }

      return {
        text: accumulatedText,
        steps: currentSteps,
        evidence: currentEvidence,
        usage: currentUsage,
        isStopped: stopped,
        error: currentError,
      };
    },
    [options]
  );

  return {
    isStreaming,
    streamText,
    steps,
    evidence,
    usage,
    error,
    isStopped,
    startStream,
    stopStream,
  };
}
