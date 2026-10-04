import { PrismaClient } from "@prisma/client";
import { modelsConfig } from "../src/config/models.config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FInAI Database...");

  // 1. Seed ModelCatalog from models.config.ts (idempotent upsert).
  //    Note: the "auto" entry is a router alias, not a real provider model —
  //    it is skipped so the catalog mirrors the live OpenRouter registry.
  const catalogModels = modelsConfig.filter((m) => m.modelId !== "auto");
  for (const model of catalogModels) {
    await prisma.modelCatalog.upsert({
      where: { modelId: model.modelId },
      update: {
        provider: model.provider,
        family: model.family,
        displayName: model.displayName,
        contextWindow: model.contextWindow,
        maxOutput: model.maxOutput,
        capabilities: model.capabilities as unknown as object,
        latencyClass: model.latencyClass,
        pricingTier: model.pricingTier,
        pricingInputPer1M: model.pricingInputPer1M,
        pricingOutputPer1M: model.pricingOutputPer1M,
        availability: model.availability,
        notes: model.notes,
      },
      create: {
        modelId: model.modelId,
        provider: model.provider,
        family: model.family,
        displayName: model.displayName,
        contextWindow: model.contextWindow,
        maxOutput: model.maxOutput,
        capabilities: model.capabilities as unknown as object,
        latencyClass: model.latencyClass,
        pricingTier: model.pricingTier,
        pricingInputPer1M: model.pricingInputPer1M,
        pricingOutputPer1M: model.pricingOutputPer1M,
        availability: model.availability,
        notes: model.notes,
      },
    });
  }
  console.log(`✅ Seeded ${catalogModels.length} models into ModelCatalog.`);
  console.log(
    "ℹ️  No admin user is seeded by default (admin accounts are provisioned out-of-band)."
  );

  console.log("🎉 Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
