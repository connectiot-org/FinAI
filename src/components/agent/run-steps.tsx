import { Sparkles, CheckCircle2, CircleDashed, LoaderCircle } from "lucide-react";
import { SseStepPayload } from "@/lib/sse-types";

export interface RunStepsProps {
  steps: SseStepPayload[];
  isStreaming?: boolean;
}

export function RunSteps({ steps, isStreaming = false }: RunStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between font-mono text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5 font-semibold text-stone-800">
          <Sparkles className="size-3.5 text-moss" />
          Orchestration Run · {steps.length} steps
        </span>
        <span className="font-mono text-[10px]">
          {isStreaming ? "Executing…" : "Completed"}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 border-t border-line/60 pt-2 text-[12px]">
        {steps.map((st) => (
          <div key={st.id || st.label} className="flex items-center justify-between text-stone-600">
            <div className="flex items-center gap-2">
              {st.status === "done" || st.status === "complete" ? (
                <CheckCircle2 className="size-3.5 text-moss" />
              ) : st.status === "active" || st.status === "running" ? (
                <LoaderCircle className="size-3.5 animate-spin text-moss" />
              ) : (
                <CircleDashed className="size-3.5 text-stone-300" />
              )}
              <span
                className={
                  st.status === "active" || st.status === "running"
                    ? "font-medium text-stone-900"
                    : ""
                }
              >
                {st.label}
              </span>
            </div>
            {st.duration && (
              <span className="font-mono text-[10px] text-stone-400">{st.duration}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
