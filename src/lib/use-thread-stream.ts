"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { consumeSseStream } from "./stream-client";
import { createMockStream } from "./mock-stream";
import {
  SseStepPayload,
  SseEvidencePayload,
  SseUsagePayload,
  SseNoticePayload,
} from "./sse-types";
import { toast } from "sonner";

export interface UseThreadStreamOptions {
  modelId: string;
  answerMode?: "quick" | "deep";
  conversationId?: string;
  useMock?: boolean;
}

export interface StartStreamOptions {
  /** Thread the stream belongs to (scopes the streaming UI to that thread). */
  threadId?: string;
  /** Server conversation id for persistence (authenticated users). */
  conversationId?: string;
}

export interface StreamResult {
  text: string;
  steps: SseStepPayload[];
  evidence: SseEvidencePayload[];
  usage: SseUsagePayload | null;
  isStopped: boolean;
  error?: { code: string; message: string; retryable: boolean } | null;
  /** Server conversation id returned in the done event, if any. */
  conversationId?: string;
}

export function useThreadStream(options: UseThreadStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [steps, setSteps] = useState<SseStepPayload[]>([]);
  const [evidence, setEvidence] = useState<SseEvidencePayload[]>([]);
  const [usage, setUsage] = useState<SseUsagePayload | null>(null);
  const [error, setError] = useState<{ code: string; message: string; retryable: boolean } | null>(null);
  const [isStopped, setIsStopped] = useState(false);
  /** Thread the active stream belongs to — streaming UI is scoped to it so
   * switching threads mid-stream cannot render the in-flight answer inside
   * an unrelated transcript. */
  const [streamingThreadId, setStreamingThreadId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Latest-ref pattern: keep the current options readable inside a stable
  // callback without re-creating startStream on every render (which churned
  // child components subscribed to it). useMock used to be captured directly
  // — toggling it after mount had no effect (stale closure).
  const modelIdRef = useRef(options.modelId);
  const answerModeRef = useRef(options.answerMode);
  const conversationIdRef = useRef(options.conversationId);
  const useMockRef = useRef(Boolean(options.useMock));
  modelIdRef.current = options.modelId;
  answerModeRef.current = options.answerMode;
  conversationIdRef.current = options.conversationId;
  useMockRef.current = Boolean(options.useMock);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsStopped(true);
    }
  }, []);

  // Abort the in-flight stream when the component unmounts (route change):
  // otherwise the fetch/reader loop keeps running and calls setState on an
  // unmounted component for the lifetime of the stream.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const startStream = useCallback(
    async (
      prompt: string,
      messagesHistory: Array<{ role: string; content: string }> = [],
      streamOpts?: StartStreamOptions
    ): Promise<StreamResult> => {
      setIsStreaming(true);
      setStreamText("");
      setSteps([]);
      setEvidence([]);
      setUsage(null);
      setError(null);
      setIsStopped(false);
      setStreamingThreadId(streamOpts?.threadId ?? null);

      let accumulatedText = "";
      const currentSteps: SseStepPayload[] = [];
      const currentEvidence: SseEvidencePayload[] = [];
      let currentUsage: SseUsagePayload | null = null;
      let currentError: { code: string; message: string; retryable: boolean } | null = null;
      let stopped = false;
      let doneConversationId: string | undefined;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let stream: ReadableStream<Uint8Array>;
        const conversationId =
          streamOpts?.conversationId ?? conversationIdRef.current;

        if (useMockRef.current) {
          stream = createMockStream(prompt, {
            modelId: modelIdRef.current,
          });
        } else {
          // Attempt real endpoint
          const res = await fetch("/api/v1/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelId: modelIdRef.current,
              answerMode: answerModeRef.current || "deep",
              conversationId,
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
            onNotice: (nEvt) => {
              const payload = nEvt.data as SseNoticePayload;
              if (payload?.notices?.length) {
                toast.info("Quality notice", {
                  description: payload.notices.join(" "),
                });
              }
            },
            onError: (err) => {
              currentError = err;
              setError(err);
            },
            onDone: (donePayload) => {
              if (donePayload.conversationId) {
                doneConversationId = donePayload.conversationId;
              }
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
        setStreamingThreadId(null);
        abortControllerRef.current = null;
      }

      return {
        text: accumulatedText,
        steps: currentSteps,
        evidence: currentEvidence,
        usage: currentUsage,
        isStopped: stopped,
        error: currentError,
        conversationId: doneConversationId,
      };
    },
    []
  );

  return {
    isStreaming,
    streamText,
    steps,
    evidence,
    usage,
    error,
    isStopped,
    streamingThreadId,
    startStream,
    stopStream,
  };
}
