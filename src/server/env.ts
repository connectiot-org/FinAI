import { z } from "zod";

/**
 * Environment configuration.
 *
 * Security rules:
 * - No secret values are ever defaulted or committed. `OPENROUTER_API_KEY` and
 *   `AUTH_SECRET` must be provided through the environment in production.
 * - Missing configuration must degrade gracefully per-request (clear error
 *   codes) instead of crashing the process at import time, so that builds and
 *   health checks keep working in partially-configured environments.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  /** Postgres connection string. Required for DB-backed features (conversations, usage, audit). */
  DATABASE_URL: z.string().optional(),

  /** Optional direct (non-pooled) connection URL for Prisma migrations. */
  DIRECT_URL: z.string().optional(),

  /** Public origin of the app (used for OAuth callbacks and metadata). */
  APP_URL: z.string().default("http://localhost:3000"),

  /** NextAuth signing secret. Generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z.string().optional(),

  /** OpenRouter gateway API key. No default: leaked/defaulted keys are forbidden. */
  OPENROUTER_API_KEY: z.string().optional(),

  /** Optional OpenRouter-compatible base URL (self-hosted gateway / proxy / test double). */
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),

  /** Opt-in strict auth: gate /agent and protected APIs behind a session. */
  STRICT_AUTH: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  /** Whether live AI calls are allowed in tests. */
  AI_LIVE_TESTS: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

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

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[env] ${message}`);
}

if (!env.AUTH_SECRET && env.NODE_ENV === "production") {
  warnOnce(
    "AUTH_SECRET",
    "AUTH_SECRET is not set. Set it before serving production traffic (openssl rand -base64 32)."
  );
}

if (!env.OPENROUTER_API_KEY && env.NODE_ENV === "production") {
  warnOnce(
    "OPENROUTER_API_KEY",
    "OPENROUTER_API_KEY is not set. AI chat streaming will return UPSTREAM_AUTH errors until a valid key is configured."
  );
}

if (!env.DATABASE_URL && env.NODE_ENV === "production") {
  warnOnce(
    "DATABASE_URL",
    "DATABASE_URL is not set. Database-backed features (conversations, usage tracking) will return 503."
  );
}

/** Whether a NextAuth secret is usable (development fallback keeps local dev friction low). */
export function getAuthSecret(): string | undefined {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (env.NODE_ENV === "development") {
    warnOnce(
      "AUTH_SECRET_DEV",
      "AUTH_SECRET not set; using an insecure development-only fallback. Do NOT use in production."
    );
    return "finai-dev-only-insecure-secret";
  }
  return undefined;
}
