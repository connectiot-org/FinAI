import { Sparkles, CheckCircle2, CircleDashed, LoaderCircle } from "lucide-react";
import { SseStepPayload } from "@/lib/sse-types";

export interface RunStepsProps {
  steps: SseStepPayload[];
  isStreaming?: boolean;
}

export function RunSteps({ steps: _steps, isStreaming: _isStreaming = false }: RunStepsProps) {
  // Orchestration run is hidden per user request
  return null;
}
