import { modelRegistry } from "../registry/model-registry";
import { logger } from "../../infra/logger";

export interface FallbackCandidate {
  modelId: string;
  reason: string;
}

export class FallbackEngine {
  getCandidates(initialModelId: string): string[] {
    const chain = modelRegistry.getFallbackChain(initialModelId);
    return [initialModelId, ...chain.filter((m) => m !== initialModelId)];
  }

  logFallback(originalModel: string, chosenModel: string, reason: string, requestId: string) {
    logger.warn("AI Gateway Model Fallback Activated", {
      requestId,
      originalModel,
      chosenModel,
      reason,
    });
  }
}

export const fallbackEngine = new FallbackEngine();
