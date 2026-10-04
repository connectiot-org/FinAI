import fs from "fs";
import path from "path";

export interface PromptAssemblyOptions {
  mode?: "quick" | "deep";
  modelTier?: "Fast" | "Balanced" | "Reasoning" | "Open" | "Finance Specialist";
  financialContextSummary?: string;
}

/**
 * Inline fallback persona. The canonical prompt lives in
 * `prompts/system/base-financial-system.md`, but serverless bundles do not
 * always include untraced `fs`-read files — without this fallback the system
 * prompt would silently degrade to an empty string in production.
 */
const FALLBACK_BASE_PROMPT = `You are FInAI, a senior financial intelligence analyst and controller assistant.
Your tone is professional, rigorous, and grounded in corporate finance standards (FP&A, accounting, auditing, variance analysis).
Always format financial analysis cleanly with markdown tables, precise figures, clear assumptions, and variance percentages (+/-).
When asked to compare budgets or actuals, highlight key variances and suggest concrete operational action items.
When datasets are attached, ground every figure in the provided data. Never invent numbers that are not present in the dataset. If information is not present, say so explicitly.
Include a brief note that outputs are for informational purposes and are not financial advice or an audit opinion.`;

const FALLBACK_MODE_PROMPT =
  "Answer with executive-level depth: structured sections, markdown tables, precise figures, assumptions, and recommended actions.";

export interface AssembledPrompt {
  content: string;
  version: string;
}

export class PromptAssembler {
  private promptsRoot: string;
  private cache = new Map<string, { content: string; version: string }>();

  constructor() {
    this.promptsRoot = path.join(process.cwd(), "prompts");
  }

  private loadPromptFile(relativePath: string): { content: string; version: string } {
    const cached = this.cache.get(relativePath);
    if (cached) return cached;

    try {
      const fullPath = path.join(this.promptsRoot, relativePath);
      if (!fs.existsSync(fullPath)) {
        return { content: "", version: "1.0.0" };
      }
      const raw = fs.readFileSync(fullPath, "utf-8");

      // Strip YAML frontmatter
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (match) {
        const frontmatter = match[1];
        const body = match[2].trim();
        const versionMatch = frontmatter.match(/version:\s*"([^"]+)"/);
        const result = { content: body, version: versionMatch ? versionMatch[1] : "1.0.0" };
        this.cache.set(relativePath, result);
        return result;
      }
      const result = { content: raw.trim(), version: "1.0.0" };
      this.cache.set(relativePath, result);
      return result;
    } catch (e) {
      console.warn(`Could not load prompt file ${relativePath}, falling back to defaults`, e);
      return { content: "", version: "1.0.0" };
    }
  }

  /**
   * Assembles the system prompt. `withMeta` returns the prompt version so
   * usage tracking can record which prompt produced an answer.
   */
  assemble(options?: PromptAssemblyOptions, withMeta?: false): string;
  assemble(options: PromptAssemblyOptions | undefined, withMeta: true): AssembledPrompt;
  assemble(options: PromptAssemblyOptions = {}, withMeta = false): string | AssembledPrompt {
    const { mode = "deep", financialContextSummary } = options;

    const base = this.loadPromptFile("system/base-financial-system.md");
    const modePrompt =
      mode === "quick"
        ? this.loadPromptFile("financial/quick-answer.md")
        : this.loadPromptFile("financial/deep-analysis.md");

    const parts = [base.content || FALLBACK_BASE_PROMPT];

    if (financialContextSummary) {
      parts.push(`### Injected Financial Context:\n${financialContextSummary}`);
    }

    parts.push(modePrompt.content || FALLBACK_MODE_PROMPT);

    const assembled = parts.filter(Boolean).join("\n\n");
    if (withMeta) {
      return { content: assembled, version: base.version };
    }
    return assembled;
  }
}

export const promptAssembler = new PromptAssembler();
