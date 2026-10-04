import { modelsConfig, ModelConfig, fallbackChainMap } from "../../../config/models.config";
import { prisma } from "../../db/client";

export class ModelRegistry {
  /**
   * Default concrete model used when the client asks for "auto".
   * Resolved from the auto fallback chain's first entry (a real provider id).
   */
  getDefaultModel(): string {
    const chain = fallbackChainMap["auto"];
    return chain && chain.length > 0 ? chain[0] : modelsConfig[0]?.modelId ?? "auto";
  }

  async listModels(): Promise<ModelConfig[]> {
    try {
      const dbModels = await prisma.modelCatalog.findMany();
      if (!dbModels || dbModels.length === 0) {
        return modelsConfig;
      }

      const dbMap = new Map(dbModels.map((m) => [m.modelId, m]));

      return modelsConfig.map((cfg) => {
        const dbRow = dbMap.get(cfg.modelId);
        if (!dbRow) return cfg;

        return {
          ...cfg,
          availability: dbRow.availability as ModelConfig["availability"],
          notes: dbRow.notes ?? cfg.notes,
        };
      });
    } catch {
      // Fallback to static config if DB is unreachable
      return modelsConfig;
    }
  }

  getFallbackChain(modelId: string): string[] {
    return (
      fallbackChainMap[modelId] || [
        "openrouter/free",
        "nvidia/nemotron-3.5-lightning:free",
        "dots-studio/dots-3-note-preview:free",
      ]
    );
  }
}

export const modelRegistry = new ModelRegistry();
