import { GuardrailCheckResult } from "./label-check";

/**
 * Asserts that user-provided numbers are contextualized as provided inputs,
 * not generated as ground-truth calculations.
 */
export function checkUserFigureRestatement(
  userText: string,
  assistantText: string
): GuardrailCheckResult {
  const userNumbers = userText.match(/\b\d+(\.\d+)?%?|\$[\d,.]+/g);

  if (!userNumbers || userNumbers.length === 0) {
    return { passed: true };
  }

  // Check if assistant referenced the provided context
  const acknowledgesProvidedInput =
    /provided|stated|per your input|reported as|budget of|actuals of/i.test(assistantText);

  if (!acknowledgesProvidedInput) {
    return {
      passed: false,
      warning: "User-supplied numeric figures may not be explicitly designated as input assumptions.",
    };
  }

  return { passed: true };
}
