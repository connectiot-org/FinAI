import { ChatMessageParam } from "../providers/provider-adapter";
import { logger } from "../../infra/logger";

export interface ContextWindowOptions {
  maxContextTokens: number;
  systemPromptTokensReservation?: number;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function assembleContextWindow(
  systemPrompt: string,
  messages: ChatMessageParam[],
  options: ContextWindowOptions
): ChatMessageParam[] {
  const reservation = options.systemPromptTokensReservation ?? 1200;
  const availableTokens = options.maxContextTokens - reservation;

  if (messages.length === 0) {
    return [{ role: "system", content: systemPrompt }];
  }

  // Always retain the latest user turn
  const lastTurn = messages[messages.length - 1];
  let currentTokenCount = estimateTokens(lastTurn.content);

  const retainedHistory: ChatMessageParam[] = [];

  // Walk backwards from second-to-last message
  for (let i = messages.length - 2; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (currentTokenCount + msgTokens <= availableTokens) {
      currentTokenCount += msgTokens;
      retainedHistory.unshift(msg);
    } else {
      logger.debug("Context window evicted older message to respect limit", {
        evictedRole: msg.role,
        availableTokens,
        currentTokenCount,
      });
    }
  }

  return [
    { role: "system", content: systemPrompt },
    ...retainedHistory,
    lastTurn,
  ];
}
