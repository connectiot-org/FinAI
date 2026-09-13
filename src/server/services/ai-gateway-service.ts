import { aiGateway } from "../ai/gateway/ai-gateway";
import { ChatMessageParam } from "../ai/providers/provider-adapter";
import { SseEvent } from "../../lib/sse-types";

export interface StreamChatTurnInput {
  modelId: string;
  messages: ChatMessageParam[];
  answerMode?: "quick" | "deep";
  requestId: string;
  signal?: AbortSignal;
}

export class AIGatewayService {
  async *streamTurn(input: StreamChatTurnInput): AsyncIterable<SseEvent> {
    const stream = aiGateway.stream({
      modelId: input.modelId,
      messages: input.messages,
      answerMode: input.answerMode,
      requestId: input.requestId,
      signal: input.signal,
    });

    for await (const evt of stream) {
      yield evt;
    }
  }
}

export const aiGatewayService = new AIGatewayService();
