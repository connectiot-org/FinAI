export interface FinancialContextProfile {
  entityId: string;
  entityName: string;
  currency: "USD" | "EUR" | "GBP" | "CAD";
  fiscalYear: number;
  activePeriod: string; // e.g. "Q3 FY26" or "Sep 2026"
  accountingStandard: "US_GAAP" | "IFRS";
  erpSystem?: string; // e.g. "NetSuite", "QuickBooks", "SAP"
  dataAsOfDate: string;
  cashRunwayMonths?: number;
  lastCloseStatus?: "OPEN" | "SOFT_CLOSED" | "LOCKED";
}

export const defaultMockFinancialContext: FinancialContextProfile = {
  entityId: "ent_acme_corp",
  entityName: "Acme Enterprise Corp",
  currency: "USD",
  fiscalYear: 2026,
  activePeriod: "Q3 FY26 (September)",
  accountingStandard: "US_GAAP",
  erpSystem: "NetSuite ERP · GL Active",
  dataAsOfDate: "2026-09-10",
  cashRunwayMonths: 11.2,
  lastCloseStatus: "SOFT_CLOSED",
};
