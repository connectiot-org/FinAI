import { FileText, ExternalLink, ShieldCheck, Database } from "lucide-react";
import { SseEvidencePayload } from "@/lib/sse-types";

export interface EvidencePanelProps {
  evidenceItems: SseEvidencePayload[];
  onClose?: () => void;
}

export function EvidencePanel({ evidenceItems }: EvidencePanelProps) {
  if (!evidenceItems || evidenceItems.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-moss" />
          <h4 className="text-[13px] font-semibold text-stone-900">
            Attached Evidence Chain ({evidenceItems.length})
          </h4>
        </div>
        <span className="font-mono text-[10px] text-stone-400">Auditable Grounding</span>
      </div>

      <div className="mt-3 space-y-2">
        {evidenceItems.map((item) => (
          <div
            key={item.id || item.ref}
            className="flex items-start justify-between rounded-xl border border-line/70 bg-paper-soft/50 p-2.5 transition-colors hover:bg-paper-soft"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-6 place-items-center rounded-lg bg-white text-stone-600 shadow-xs">
                <FileText className="size-3.5" />
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-stone-900">{item.label}</p>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-stone-400">
                  <span>Ref: {item.ref}</span>
                  <span>•</span>
                  <span>Kind: {item.kind}</span>
                  {item.confidence && (
                    <>
                      <span>•</span>
                      <span className="text-moss">
                        Tie: {Math.round(item.confidence * 100)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert(`Inspecting audit workpaper: ${item.ref}`)}
              className="rounded-lg p-1 text-stone-400 hover:bg-white hover:text-stone-700"
              title="Inspect workpaper"
            >
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-400 border-t border-line/40 pt-2.5">
        <ShieldCheck className="size-3.5 text-moss" />
        <span>Every calculation is grounded in authoritative general ledger rows.</span>
      </div>
    </div>
  );
}
