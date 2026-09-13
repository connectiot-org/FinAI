import { PrismaClient } from "@prisma/client";
import { modelsConfig } from "../src/config/models.config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Fintra Database...");

  // 1. Seed ModelCatalog from models.config.ts (Idempotent upsert)
  for (const model of modelsConfig) {
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
  console.log(`✅ Seeded ${modelsConfig.length} models into ModelCatalog.`);

  // 2. Seed Default Admin & Demo User
  const devUser = await prisma.user.upsert({
    where: { email: "admin@fintra.ai" },
    update: {},
    create: {
      email: "admin@fintra.ai",
      name: "Fintra Controller Admin",
      role: "ADMIN",
    },
  });
  console.log(`✅ Seeded default admin user: ${devUser.email}`);

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
