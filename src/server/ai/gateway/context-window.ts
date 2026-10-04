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
  const reservation = options.systemPromptTokensReservation ?? 2000;
  const availableTokens = Math.max(1000, options.maxContextTokens - reservation);

  if (messages.length === 0) {
    return [{ role: "system", content: systemPrompt }];
  }

  // Always retain the latest user turn. If it alone exceeds the budget it is
  // still included (the upstream provider will surface a 400 if truly too
  // large) — but log it so the condition is observable.
  const lastTurn = messages[messages.length - 1];
  const lastTurnTokens = estimateTokens(lastTurn.content);
  if (lastTurnTokens > availableTokens) {
    logger.warn("Latest user turn exceeds the context budget", {
      lastTurnTokens,
      availableTokens,
    });
    return [{ role: "system", content: systemPrompt }, lastTurn];
  }

  let currentTokenCount = lastTurnTokens;
  let budgetExhausted = false;
  const retainedHistory: ChatMessageParam[] = [];

  // Walk backwards from the second-to-last message. Once an older message no
  // longer fits, stop — retaining a *contiguous* window. (The previous
  // implementation kept scanning and produced gaps in the middle of the
  // conversation, which confused models.)
  for (let i = messages.length - 2; i >= 0 && !budgetExhausted; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (currentTokenCount + msgTokens <= availableTokens) {
      currentTokenCount += msgTokens;
      retainedHistory.unshift(msg);
    } else {
      budgetExhausted = true;
      logger.debug("Context window evicted older messages to respect limit", {
        evictedFromIndex: i,
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
