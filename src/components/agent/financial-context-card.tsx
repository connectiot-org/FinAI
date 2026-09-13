import { Building, ShieldCheck, Calendar, DollarSign } from "lucide-react";
import { FinancialContextProfile, defaultMockFinancialContext } from "@/server/domain/financial-context";

export interface FinancialContextCardProps {
  profile?: FinancialContextProfile;
}

export function FinancialContextCard({ profile = defaultMockFinancialContext }: FinancialContextCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-line/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-moss text-white shadow-sm">
            <Building className="size-4" />
          </div>
          <div>
            <h4 className="text-[13.5px] font-semibold text-stone-900">{profile.entityName}</h4>
            <p className="text-[11px] font-mono text-stone-400">{profile.erpSystem}</p>
          </div>
        </div>
        <span className="rounded-full bg-moss-soft px-2.5 py-0.5 font-mono text-[10px] font-medium text-moss-deep">
          {profile.lastCloseStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
        <div className="rounded-xl bg-paper-soft/60 p-2">
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-stone-400">Reporting Currency</p>
          <div className="mt-0.5 flex items-center gap-1 font-mono font-semibold text-stone-800">
            <DollarSign className="size-3 text-stone-400" />
            {profile.currency}
          </div>
        </div>

        <div className="rounded-xl bg-paper-soft/60 p-2">
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-stone-400">Active Period</p>
          <div className="mt-0.5 flex items-center gap-1 font-mono font-semibold text-stone-800">
            <Calendar className="size-3 text-stone-400" />
            {profile.activePeriod}
          </div>
        </div>

        <div className="rounded-xl bg-paper-soft/60 p-2">
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-stone-400">Accounting Standard</p>
          <p className="mt-0.5 font-mono font-semibold text-stone-800">{profile.accountingStandard}</p>
        </div>

        <div className="rounded-xl bg-paper-soft/60 p-2">
          <p className="font-mono text-[9.5px] uppercase tracking-wider text-stone-400">Cash Runway</p>
          <p className="mt-0.5 font-mono font-semibold text-moss">
            {profile.cashRunwayMonths} months
          </p>
        </div>
      </div>
    </div>
  );
}
