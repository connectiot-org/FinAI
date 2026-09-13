export interface GuardrailCheckResult {
  passed: boolean;
  warning?: string;
}

/**
 * Checks that financial outputs clearly separate facts from analytical interpretation.
 */
export function checkInterpretationLabeling(text: string): GuardrailCheckResult {
  const containsFinancialFigures = /\$[\d,.]+[kKmMbB]?|\b\d+\.\d+%/g.test(text);

  if (!containsFinancialFigures) {
    return { passed: true };
  }

  const hasInterpretationMarker =
    /interpretation:|analysis:|observation:|summary:|variance:|estimate:/i.test(text);

  if (!hasInterpretationMarker) {
    return {
      passed: false,
      warning: "Output contains numeric financial claims without explicit analytical interpretation labeling.",
    };
  }

  return { passed: true };
}
