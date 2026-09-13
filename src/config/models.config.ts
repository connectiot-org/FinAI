/**
 * Fintra Model Registry Configuration (D4 authoritative)
 * Illustrative examples — this config is the source of truth; refresh IDs without code changes.
 * UI components render exclusively from this registry.
 */

export type ModelTier = "Fast" | "Balanced" | "Reasoning" | "Open" | "Finance Specialist";
export type LatencyClass = "FAST" | "BALANCED" | "REASONING";
export type AvailabilityStatus = "AVAILABLE" | "DEGRADED" | "RETIRED";

export interface ModelCapability {
  reasoning: boolean;
  vision: boolean;
  tools: boolean;
}

export interface ModelConfig {
  id: string;
  modelId: string;
  provider: string;
  family: string;
  displayName: string;
  desc: string;
  tier: ModelTier;
  contextWindow: number;
  maxOutput: number;
  capabilities: ModelCapability;
  latencyClass: LatencyClass;
  pricingTier: 1 | 2 | 3 | 4;
  pricingInputPer1M: number;
  pricingOutputPer1M: number;
  availability: AvailabilityStatus;
  releaseDate?: string;
  badge: string;
  isFree?: boolean;
  notes?: string;
}

export const modelsConfig: ModelConfig[] = [
  // Smart Heuristic Auto-Router
  {
    id: "auto",
    modelId: "auto",
    provider: "Fintra Smart Router",
    family: "router",
    displayName: "Auto (Smart Router)",
    desc: "Complexity-based heuristic router with automatic rate-limit and credit-failover",
    tier: "Balanced",
    contextWindow: 200000,
    maxOutput: 4096,
    capabilities: { reasoning: true, vision: true, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 2,
    pricingInputPer1M: 0.8,
    pricingOutputPer1M: 2.4,
    availability: "AVAILABLE",
    badge: "Auto",
    isFree: true,
    notes: "Primary router tier. Selects optimal model based on query token count and mode.",
  },

  // Finance Specialist
  {
    id: "inclusionai/ling-3.0-flash-fin:free",
    modelId: "inclusionai/ling-3.0-flash-fin:free",
    provider: "InclusionAI",
    family: "ling",
    displayName: "Ling 3.0 Flash Fin",
    desc: "Domain-native financial model pre-trained on XBRL statements, SEC filings, GAAP & IFRS",
    tier: "Finance Specialist",
    contextWindow: 262000,
    maxOutput: 4096,
    capabilities: { reasoning: true, vision: false, tools: false },
    latencyClass: "FAST",
    pricingTier: 1,
    pricingInputPer1M: 0.0,
    pricingOutputPer1M: 0.0,
    availability: "AVAILABLE",
    badge: "LingFin",
    isFree: true,
    notes: "Excellent for quick XBRL tag parsing and general ledger rule checks.",
  },

  // Fast Tier
  {
    id: "anthropic/claude-3.5-haiku",
    modelId: "anthropic/claude-3.5-haiku",
    provider: "Anthropic",
    family: "claude",
    displayName: "Claude 3.5 Haiku",
    desc: "High-speed reasoning for accounting lookups, quick classification, and formula verification",
    tier: "Fast",
    contextWindow: 200000,
    maxOutput: 8192,
    capabilities: { reasoning: false, vision: true, tools: true },
    latencyClass: "FAST",
    pricingTier: 1,
    pricingInputPer1M: 0.8,
    pricingOutputPer1M: 4.0,
    availability: "AVAILABLE",
    badge: "Haiku",
  },
  {
    id: "openai/gpt-4o-mini",
    modelId: "openai/gpt-4o-mini",
    provider: "OpenAI",
    family: "gpt",
    displayName: "GPT-4o Mini",
    desc: "Cost-efficient high-speed engine for continuous data-cleansing and schedule categorization",
    tier: "Fast",
    contextWindow: 128000,
    maxOutput: 16384,
    capabilities: { reasoning: false, vision: true, tools: true },
    latencyClass: "FAST",
    pricingTier: 1,
    pricingInputPer1M: 0.15,
    pricingOutputPer1M: 0.6,
    availability: "AVAILABLE",
    badge: "GPT-Mini",
  },
  {
    id: "google/gemini-2.0-flash-001",
    modelId: "google/gemini-2.0-flash-001",
    provider: "Google",
    family: "gemini",
    displayName: "Gemini 2.0 Flash",
    desc: "Ultra-fast multimodal model with receipt/invoice OCR and real-time processing",
    tier: "Fast",
    contextWindow: 1000000,
    maxOutput: 8192,
    capabilities: { reasoning: false, vision: true, tools: true },
    latencyClass: "FAST",
    pricingTier: 1,
    pricingInputPer1M: 0.1,
    pricingOutputPer1M: 0.4,
    availability: "AVAILABLE",
    badge: "Gemini",
  },

  // Balanced Tier
  {
    id: "anthropic/claude-3.5-sonnet",
    modelId: "anthropic/claude-3.5-sonnet",
    provider: "Anthropic",
    family: "claude",
    displayName: "Claude 3.5 Sonnet",
    desc: "Industry standard for flux variance memos, multi-tab tie-outs, and credit agreements",
    tier: "Balanced",
    contextWindow: 200000,
    maxOutput: 8192,
    capabilities: { reasoning: true, vision: true, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 2,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
    availability: "AVAILABLE",
    badge: "Claude",
  },
  {
    id: "openai/gpt-4o",
    modelId: "openai/gpt-4o",
    provider: "OpenAI",
    family: "gpt",
    displayName: "GPT-4o",
    desc: "Versatile reasoning, memo drafting, executive summaries, and structured outputs",
    tier: "Balanced",
    contextWindow: 128000,
    maxOutput: 4096,
    capabilities: { reasoning: true, vision: true, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 2,
    pricingInputPer1M: 2.5,
    pricingOutputPer1M: 10.0,
    availability: "AVAILABLE",
    badge: "GPT-4o",
  },
  {
    id: "google/gemini-1.5-pro",
    modelId: "google/gemini-1.5-pro",
    provider: "Google",
    family: "gemini",
    displayName: "Gemini 1.5 Pro",
    desc: "2M token context window for ingesting full multi-year 10-K filings and credit facilities",
    tier: "Balanced",
    contextWindow: 2000000,
    maxOutput: 8192,
    capabilities: { reasoning: true, vision: true, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 2,
    pricingInputPer1M: 1.25,
    pricingOutputPer1M: 5.0,
    availability: "AVAILABLE",
    badge: "Gemini-Pro",
  },
  {
    id: "deepseek/deepseek-chat",
    modelId: "deepseek/deepseek-chat",
    provider: "DeepSeek",
    family: "deepseek",
    displayName: "DeepSeek V3",
    desc: "671B parameter Mixture-of-Experts with frontier-calibre accounting and cost efficiency",
    tier: "Balanced",
    contextWindow: 64000,
    maxOutput: 8192,
    capabilities: { reasoning: false, vision: false, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 1,
    pricingInputPer1M: 0.14,
    pricingOutputPer1M: 0.28,
    availability: "AVAILABLE",
    badge: "DeepSeek",
  },

  // Reasoning Tier
  {
    id: "anthropic/claude-3.7-sonnet",
    modelId: "anthropic/claude-3.7-sonnet",
    provider: "Anthropic",
    family: "claude",
    displayName: "Claude 3.7 Sonnet (Thinking)",
    desc: "Hybrid frontier reasoning with transparent thinking steps for high-stakes audits & modeling",
    tier: "Reasoning",
    contextWindow: 200000,
    maxOutput: 16384,
    capabilities: { reasoning: true, vision: true, tools: true },
    latencyClass: "REASONING",
    pricingTier: 3,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
    availability: "AVAILABLE",
    badge: "Claude 3.7",
  },
  {
    id: "openai/o3-mini",
    modelId: "openai/o3-mini",
    provider: "OpenAI",
    family: "gpt-reasoning",
    displayName: "OpenAI o3-mini",
    desc: "Mathematical reasoning tailored for financial formula derivations, Python transforms & DCF",
    tier: "Reasoning",
    contextWindow: 200000,
    maxOutput: 65536,
    capabilities: { reasoning: true, vision: false, tools: true },
    latencyClass: "REASONING",
    pricingTier: 3,
    pricingInputPer1M: 1.1,
    pricingOutputPer1M: 4.4,
    availability: "AVAILABLE",
    badge: "o3-mini",
  },
  {
    id: "deepseek/deepseek-r1",
    modelId: "deepseek/deepseek-r1",
    provider: "DeepSeek",
    family: "deepseek-reasoning",
    displayName: "DeepSeek R1",
    desc: "Open reasoning model with transparent chain-of-thought for quantitative verification",
    tier: "Reasoning",
    contextWindow: 64000,
    maxOutput: 8192,
    capabilities: { reasoning: true, vision: false, tools: false },
    latencyClass: "REASONING",
    pricingTier: 2,
    pricingInputPer1M: 0.55,
    pricingOutputPer1M: 2.19,
    availability: "AVAILABLE",
    badge: "DeepSeek-R1",
  },

  // Open Weights Tier
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    modelId: "meta-llama/llama-3.3-70b-instruct",
    provider: "Meta",
    family: "llama",
    displayName: "Llama 3.3 70B",
    desc: "Leading open weights model offering GPT-4 class capabilities without vendor lock-in",
    tier: "Open",
    contextWindow: 128000,
    maxOutput: 4096,
    capabilities: { reasoning: true, vision: false, tools: true },
    latencyClass: "BALANCED",
    pricingTier: 1,
    pricingInputPer1M: 0.4,
    pricingOutputPer1M: 0.8,
    availability: "AVAILABLE",
    badge: "Llama 3.3",
  },
  {
    id: "google/gemma-4-31b-it:free",
    modelId: "google/gemma-4-31b-it:free",
    provider: "Google",
    family: "gemma",
    displayName: "Gemma 4 31B",
    desc: "Open model fine-tuned for analytical tasks and structured ledger queries",
    tier: "Open",
    contextWindow: 128000,
    maxOutput: 4096,
    capabilities: { reasoning: false, vision: false, tools: false },
    latencyClass: "BALANCED",
    pricingTier: 1,
    pricingInputPer1M: 0.0,
    pricingOutputPer1M: 0.0,
    availability: "AVAILABLE",
    badge: "Gemma",
    isFree: true,
  },
];

export const fallbackChainMap: Record<string, string[]> = {
  "anthropic/claude-3.7-sonnet": ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "deepseek/deepseek-chat"],
  "anthropic/claude-3.5-sonnet": ["openai/gpt-4o", "deepseek/deepseek-chat", "inclusionai/ling-3.0-flash-fin:free"],
  "openai/gpt-4o": ["anthropic/claude-3.5-sonnet", "google/gemini-1.5-pro", "inclusionai/ling-3.0-flash-fin:free"],
  "openai/o3-mini": ["deepseek/deepseek-r1", "anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
  "deepseek/deepseek-r1": ["openai/o3-mini", "anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
  auto: ["inclusionai/ling-3.0-flash-fin:free", "google/gemma-4-31b-it:free", "openai/gpt-4o-mini"],
};
