/**
 * Fintra Feature Configuration Flags
 */

export const featuresConfig = {
  // Gates /agent in production until full auth rollout, allowed in dev/preview
  agentUiPreview: true,
  // Enable fallback to mock stream if provider key is not provided
  mockStreamFallback: true,
  // Allow switching models in the middle of a thread
  midThreadModelSwitch: true,
  // Evidence panel drawer preview
  evidencePanelEnabled: true,
  // Financial Context injected profile card
  financialContextPreview: true,
  // Auto title generation on first completion
  autoTitleGeneration: true,
  // Guardrails post-processing hooks
  guardrailsEnabled: true,
} as const;
