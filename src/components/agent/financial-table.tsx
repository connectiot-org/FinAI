export interface FinancialTableRow {
  line: string;
  budget: string;
  actual: string;
  var: string;
  flag?: boolean;
}

export interface FinancialTableProps {
  rows: FinancialTableRow[];
  caption?: string;
}

export function FinancialTable({ rows, caption }: FinancialTableProps) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      {caption && (
        <div className="border-b border-line bg-paper-soft/40 px-3.5 py-2 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
          {caption}
        </div>
      )}
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-line bg-paper-soft/80 font-mono text-[10.5px] uppercase tracking-wider text-stone-500">
            <th className="px-3.5 py-2.5 font-medium">Line Item</th>
            <th className="px-3.5 py-2.5 text-right font-medium">Budget</th>
            <th className="px-3.5 py-2.5 text-right font-medium">Actual</th>
            <th className="px-3.5 py-2.5 text-right font-medium">Variance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.line}
              className="border-b border-line/60 last:border-0 hover:bg-paper-soft/40 transition-colors"
            >
              <td className="px-3.5 py-2.5 font-medium text-stone-800">
                {row.line}
                {row.flag && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9.5px] font-medium text-amber-700 ring-1 ring-amber-200">
                    REVIEW
                  </span>
                )}
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-stone-500">
                {row.budget}
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono tabular-nums font-semibold text-stone-900">
                {row.actual}
              </td>
              <td
                className={`px-3.5 py-2.5 text-right font-mono tabular-nums ${
                  row.flag ? "font-semibold text-amber-700" : "text-stone-600"
                }`}
              >
                {row.var}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
