import fs from "fs";
import path from "path";

export interface PromptAssemblyOptions {
  mode?: "quick" | "deep";
  modelTier?: "Fast" | "Balanced" | "Reasoning" | "Open" | "Finance Specialist";
  financialContextSummary?: string;
}

export class PromptAssembler {
  private promptsRoot: string;

  constructor() {
    this.promptsRoot = path.join(process.cwd(), "prompts");
  }

  private loadPromptFile(relativePath: string): { content: string; version: string } {
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
        return { content: body, version: versionMatch ? versionMatch[1] : "1.0.0" };
      }
      return { content: raw.trim(), version: "1.0.0" };
    } catch (e) {
      console.warn(`Could not load prompt file ${relativePath}, falling back to defaults`, e);
      return { content: "", version: "1.0.0" };
    }
  }

  assemble(options: PromptAssemblyOptions = {}): string {
    const { mode = "deep", financialContextSummary } = options;

    const base = this.loadPromptFile("system/base-financial-system.md");
    const modePrompt =
      mode === "quick"
        ? this.loadPromptFile("financial/quick-answer.md")
        : this.loadPromptFile("financial/deep-analysis.md");

    const parts = [base.content];

    if (financialContextSummary) {
      parts.push(`### Injected Financial Context:\n${financialContextSummary}`);
    }

    if (modePrompt.content) {
      parts.push(modePrompt.content);
    }

    return parts.filter(Boolean).join("\n\n");
  }
}

export const promptAssembler = new PromptAssembler();
