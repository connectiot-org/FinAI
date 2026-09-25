/**
 * FInAI Shared Server-Sent Events (SSE) Contract Types
 * Used by both client stream parser and server AI gateway.
 */

export type RunStepStatus = "running" | "complete" | "failed" | "active" | "queued" | "done";

export interface SseStepPayload {
  id: string;
  label: string;
  status: RunStepStatus;
  index: number;
  duration?: string;
  detail?: Record<string, unknown>;
}

export interface SseTextDeltaPayload {
  text: string;
}

export interface SseUsagePayload {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  durationMs?: number;
  estimated?: boolean;
}

export interface SseEvidencePayload {
  id: string;
  ref: string;
  label: string;
  kind: string;
  confidence?: number;
}

export interface SseErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
}

export interface SseDonePayload {
  messageId: string;
  conversationId?: string;
  status?: "SUCCEEDED" | "STOPPED" | "FAILED";
}

export type SseEvent =
  | { event: "step"; data: SseStepPayload }
  | { event: "text-delta"; data: SseTextDeltaPayload }
  | { event: "evidence"; data: SseEvidencePayload }
  | { event: "usage"; data: SseUsagePayload }
  | { event: "error"; data: SseErrorPayload }
  | { event: "done"; data: SseDonePayload };
