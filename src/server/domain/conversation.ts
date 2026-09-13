export type DomainMessageRole = "USER" | "ASSISTANT" | "SYSTEM";
export type DomainConversationStatus = "ACTIVE" | "ARCHIVED";

export type DomainPartType = "text" | "step" | "evidence" | "usage" | "stopped" | "regenerated";

export interface TextPart {
  type: "text";
  content: string;
  format?: "markdown" | "plain";
}

export interface StepPart {
  type: "step";
  stepType?: "RETRIEVE" | "ANALYZE" | "COMPUTE" | "VERIFY" | "COMPOSE";
  label: string;
  status: "active" | "done" | "failed" | "queued";
  duration?: string;
  detail?: Record<string, unknown>;
}

export interface EvidencePart {
  type: "evidence";
  ref: string;
  label: string;
  kind: string;
  confidence?: number;
}

export interface UsagePart {
  type: "usage";
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export interface StoppedPart {
  type: "stopped";
  reason?: string;
}

export interface RegeneratedPart {
  type: "regenerated";
  previousContent: string;
}

export type MessagePart =
  | TextPart
  | StepPart
  | EvidencePart
  | UsagePart
  | StoppedPart
  | RegeneratedPart;

export interface ConversationDto {
  id: string;
  title: string | null;
  status: DomainConversationStatus;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
