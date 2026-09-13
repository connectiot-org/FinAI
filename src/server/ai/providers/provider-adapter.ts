import { SseEvent } from "../../../lib/sse-types";

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AdapterChatRequest {
  modelId: string;
  messages: ChatMessageParam[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  streamCompletion(request: AdapterChatRequest): AsyncIterable<SseEvent>;
}
