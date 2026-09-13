import { GuardrailCheckResult } from "./label-check";

/**
 * Asserts presence of required non-advice disclaimer on material financial answers.
 */
export function checkDisclaimerPresence(text: string): GuardrailCheckResult {
  const requiresDisclaimer =
    /\b(ebitda|valuation|runway|forecast|burn|opex|variance|margin)\b/i.test(text);

  if (!requiresDisclaimer) {
    return { passed: true };
  }

  const hasDisclaimer =
    /disclaimer|not financial advice|for informational purposes|subject to verification|not an audit/i.test(
      text
    );

  if (!hasDisclaimer) {
    return {
      passed: false,
      warning: "Mandatory standard financial disclaimer is absent from final output.",
    };
  }

  return { passed: true };
}
