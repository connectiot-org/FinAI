// Public sample/chat routes and authenticated company routes keep separate data authority.
import { RouteError } from "./RouteError";
import { OperationalSource } from "../features/assistant/OperationalSource";
import { LedgerSource } from "../features/assistant/LedgerSource";
import { Imports } from "../features/workspace/Imports";
import { Administration as WorkspaceAdministration } from "../features/workspace/Administration";
import { Component, Suspense, lazy, type ReactNode } from "react";
import {
  createBrowserRouter,
  type RouteObject,
  Navigate,
  RouterProvider,
  useLocation,
  Link,
} from "react-router-dom";
import { Shell } from "./Shell";
import { RequireWorkspaceSession } from "../components/RequireWorkspaceSession";
import {
  MarketingLayout,
  HomePage,
  ProductPage,
  ResourcesPage,
  AboutPage,
  DemoCustomersPage,
} from "../features/marketing/Marketing";
import { RequestDemoPage } from "../features/marketing/RequestDemo";
import { LogInPage } from "../features/marketing/LogIn";
import { Overview } from "../features/Overview";
import {
  Accounts,
  Audit,
  JournalDetail,
  Journals,
  Ledger,
  TrialBalance,
} from "../features/Accounting";
import {
  BankAccounts,
  BillDetail,
  Bills,
  ContractDetail,
  Contracts,
  InvoiceDetail,
  Invoices,
  Parties,
  PartyDetail,
  Reconciliation,
  Schedules,
} from "../features/Operations";
import { Close } from "../features/Close";
import { SubscriptionRenewals } from "../features/subscriptions/SubscriptionRenewals";
import { MonthlyChecklist } from "../features/checklist/MonthlyChecklist";
import {
  Consolidation,
  Entities,
  Reports,
  Statement,
} from "../features/Reports";
import { Assistant } from "../features/Assistant";
import {
  AutomationDetail,
  Automations,
  Integrations,
  Settings,
} from "../features/Administration";
import {
  Workspace,
  WorkspaceOverview,
  WorkspaceMissing,
} from "../features/workspace/Workspace";
import { ReceivablesRegister } from "../features/workspace/ReceivablesRegister";
function NotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <p>The route does not exist in this demo.</p>
      <Link className="button primary" to="/overview">
        Go to overview
      </Link>
    </div>
  );
}
const DevelopmentPayables = lazy(() =>
  import("../features/payables/DevelopmentPayables").then((m) => ({
    default: m.DevelopmentPayables,
  })),
);
const Payables = lazy(() =>
  import("../features/payables/Payables").then((m) => ({
    default: m.Payables,
  })),
);
const ImportChanges = lazy(() =>
  import("../features/workspace/ImportChanges").then((module) => ({
    default: module.ImportChanges,
  })),
);
const ProductionAssistant = lazy(() =>
  import("../features/assistant/Assistant").then((m) => ({
    default: m.ProductionAssistant,
  })),
);
const LegacyAssistant = lazy(() =>
  import("../features/LegacyAssistant").then((module) => ({
    default: module.LegacyAssistant,
  })),
);
function LegacyPayablesRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // A real company UUID cannot select a browser-only sample company.
  params.delete("entityId");
  const query = params.toString();
  return (
    <Navigate
      replace
      to={
        location.pathname.replace(
          /^\/development\/payables/,
          "/demo/payables",
        ) +
        (query ? "?" + query : "") +
        location.hash
      }
    />
  );
}
const routes: RouteObject[] = [
  {
    path: "/",
    element: <MarketingLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "product/:product", element: <ProductPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "customers", element: <DemoCustomersPage /> },
      { path: "request-demo", element: <RequestDemoPage /> },
    ],
  },
  // The public log-in entry (founder direction, 16 November 2026): the only
  // way into the workspace dashboard is a provisioned sign-in (17 November
  // 2026) — see src/lib/provisioned-credentials.ts. /welcome and /sample are
  // the legacy no-credential entries and now land on /login, so no visitor
  // can reach the dashboard without the owner-provisioned credentials.
  { path: "/login", element: <LogInPage /> },
  { path: "/welcome", element: <Navigate to="/login" replace /> },
  { path: "/sample", element: <Navigate to="/login" replace /> },
  ...["/invoices", "/invoice-approvals"].map((path) => ({
    path,
    element: <Navigate to="/demo/payables/invoices" replace />,
  })),
  { path: "/development/payables/*", element: <LegacyPayablesRedirect /> },
  {
    path: "/demo/invoices",
    element: <Navigate to="/demo/payables/invoices" replace />,
  },
  ...[
    "invoices",
    "invoices/:id",
    "suppliers",
    "export",
    "settings/approvals",
  ].map((path) => ({
    path: "/demo/payables/" + path,
    element: (
      <RequireWorkspaceSession>
        <Suspense fallback={<p role="status">Opening invoices…</p>}>
          <DevelopmentPayables />
        </Suspense>
      </RequireWorkspaceSession>
    ),
  })),
  {
    path: "/assistant",
    element: <Navigate to="/demo/assistant" replace />,
  },
  {
    path: "/workspace/assistant",
    element: <Navigate to="/workspace/assistant/records" replace />,
  },
  {
    path: "/workspace",
    element: <Workspace />,
    children: [
      {
        path: "assistant/records",
        element: (
          <Suspense fallback={<p role="status">Opening FinAI Assistant…</p>}>
            <ProductionAssistant />
          </Suspense>
        ),
      },
      { path: "assistant/source", element: <OperationalSource /> },
      { path: "ledger", element: <LedgerSource /> },
      { path: "imports", element: <Imports /> },
      ...[
        "payables/invoices",
        "payables/invoices/:id",
        "payables/suppliers",
        "payables/export",
        "payables/settings/approvals",
        "payables/settings/access",
      ].map((path) => ({
        path,
        element: (
          <Suspense fallback={<p role="status">Opening invoices…</p>}>
            <Payables />
          </Suspense>
        ),
      })),
      { path: "administration", element: <WorkspaceAdministration /> },
      { index: true, element: <Navigate to="/workspace/overview" replace /> },
      { path: "overview", element: <WorkspaceOverview /> },
      {
        path: "receivables/invoices",
        element: <ReceivablesRegister view="invoice" />,
      },
      {
        path: "receivables/changes",
        element: (
          <Suspense fallback={<p role="status">Opening import comparison…</p>}>
            <ImportChanges />
          </Suspense>
        ),
      },
      {
        path: "receivables/customers",
        element: <ReceivablesRegister view="customer" />,
      },
      {
        path: "receivables/periods",
        element: <ReceivablesRegister view="issue-period" />,
      },
      { path: "checklist", element: <MonthlyChecklist workspace /> },
      { path: "subscriptions", element: <SubscriptionRenewals /> },
      { path: "*", element: <WorkspaceMissing /> },
    ],
  },
  // Workspace dashboard routes (founder direction, 19 November 2026): every
  // data route — overview, accounting, receivables, revenue, payables,
  // banking, close, tools, reports, entities, automations, integrations,
  // audit and settings — sits behind RequireWorkspaceSession, so a deep link
  // like /overview or /demo/payables/invoices redirects an anonymous visitor
  // to /login instead of opening the dashboard. The public stateless chat
  // (/demo/assistant, a deliberate marketing surface with its own anonymous
  // integration suite) and the not-found page stay in the open Shell block.
  {
    element: (
      <RequireWorkspaceSession>
        <Shell />
      </RequireWorkspaceSession>
    ),
    children: [
      { path: "overview", element: <Overview /> },
      { path: "accounting/ledger", element: <Ledger /> },
      { path: "accounting/journals", element: <Journals /> },
      { path: "accounting/journals/:id", element: <JournalDetail /> },
      { path: "accounting/accounts", element: <Accounts /> },
      { path: "accounting/trial-balance", element: <TrialBalance /> },
      { path: "receivables/invoices", element: <Invoices /> },
      { path: "receivables/invoices/:id", element: <InvoiceDetail /> },
      { path: "receivables/customers", element: <Parties /> },
      { path: "receivables/customers/:id", element: <PartyDetail /> },
      { path: "revenue/contracts", element: <Contracts /> },
      { path: "revenue/contracts/:id", element: <ContractDetail /> },
      { path: "revenue/schedules", element: <Schedules /> },
      { path: "payables/bills", element: <Bills /> },
      { path: "payables/bills/:id", element: <BillDetail /> },
      { path: "payables/vendors", element: <Parties vendor /> },
      { path: "payables/vendors/:id", element: <PartyDetail vendor /> },
      { path: "banking/accounts", element: <BankAccounts /> },
      { path: "banking/reconciliation", element: <Reconciliation /> },
      { path: "close", element: <Close /> },
      { path: "close/checklist", element: <MonthlyChecklist /> },
      { path: "tools/subscriptions", element: <SubscriptionRenewals /> },
      { path: "reports", element: <Reports /> },
      {
        path: "reports/profit-and-loss",
        element: <Statement kind="profit-and-loss" />,
      },
      {
        path: "reports/balance-sheet",
        element: <Statement kind="balance-sheet" />,
      },
      { path: "reports/cash-flow", element: <Statement kind="cash-flow" /> },
      { path: "entities", element: <Entities /> },
      { path: "entities/consolidation", element: <Consolidation /> },
      { path: "automations", element: <Automations /> },
      { path: "automations/:id", element: <AutomationDetail /> },
      { path: "integrations", element: <Integrations /> },
      { path: "audit-log", element: <Audit /> },
      {
        path: "settings",
        element: <Navigate to="/settings/workspace" replace />,
      },
      { path: "settings/:section", element: <Settings /> },
    ],
  },
  {
    element: <Shell />,
    children: [
      { path: "demo/assistant", element: <Assistant /> },
      {
        path: "demo/assistant/offline",
        element: (
          <Suspense fallback={<p role="status">Opening example…</p>}>
            <LegacyAssistant />
          </Suspense>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
const router = createBrowserRouter(
  routes.map((route) => ({ ...route, errorElement: <RouteError /> })),
);
export class AppBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Unable to display the demo</h1>
        <p>
          Try reloading. If local data is damaged, reset the demo to recover.
        </p>
        <button onClick={() => location.reload()}>Reload</button>
        <button
          onClick={() => {
            localStorage.removeItem("finai-demo-v1");
            location.assign("/");
          }}
        >
          Reset local demo
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function AppRouter() {
  return (
    <AppBoundary>
      <RouterProvider router={router} />
    </AppBoundary>
  );
}
