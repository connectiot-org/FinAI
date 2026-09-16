import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("file:../db/custom.db"),
  DIRECT_URL: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().default("fintra-auth-secret-development-key-32-chars-min"),
  OPENROUTER_API_KEY: z
    .string()
    .default("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"),
  AI_LIVE_TESTS: z.string().default("false"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

export const env = parseEnv();
