# Fintra Versioned Prompt Library

This directory is the authoritative repository of financial prompt engineering artifacts for Fintra AI.

## Directory Structure
- `system/`: Base financial intelligence system prompts enforcing D9 principles.
- `financial/`: Specialized mode prompts (e.g. `quick-answer.md`, `deep-analysis.md`).
- `analysis/`: Variance flux, EBITDA bridge, and ratio analysis templates.
- `reporting/`: Board deck narratives, memo drafting, and executive summaries.
- `forecasting/`: Cash flow modeling, runway projections, and scenario planning.
- `error-detection/`: 3-way tie-outs, anomaly sweeps, and formula validation.
- `model-specific/`: Model-tailored format constraints and token optimizations.

## Authoring Rules
1. **Frontmatter**: Every prompt markdown file must define YAML frontmatter:
   ```yaml
   ---
   id: base-financial-system
   version: "1.0.0"
   tierAffinity: ["Fast", "Balanced", "Reasoning"]
   description: "Foundational financial intelligence and safety instructions"
   ---
   ```
2. **Immutable Versions**: Never modify a published prompt in place. Introduce a new semantic version (e.g., `1.1.0` or `2.0.0`).
3. **Data, Not Code**: Prompt files are data loaded by `prompt-assembler.ts` — never import raw prompt strings directly into TypeScript.
