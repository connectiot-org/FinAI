import { test, expect } from "@playwright/test";

const fixtures = [
  {
    slug: "chart-of-accounts",
    title: "Starter chart of accounts",
    summary: "A practical chart of accounts for learning and prototypes.",
    category: "Accounting template",
    version: "1.0.0",
    format: "CSV",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceName: "FinAI original template",
    sourceUrl: null,
    recordCount: 20,
    updatedAt: "2026-11-13T00:00:00.000Z",
  },
  {
    slug: "synthetic-ledger-transactions",
    title: "Synthetic ledger transactions",
    summary: "Balanced double-entry examples with fictional company data.",
    category: "Synthetic financial data",
    version: "1.0.0",
    format: "CSV",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceName: "FinAI synthetic examples",
    sourceUrl: null,
    recordCount: 20,
    updatedAt: "2026-11-13T00:00:00.000Z",
  },
  {
    slug: "synthetic-invoices",
    title: "Synthetic customer invoices",
    summary: "Fictional invoice examples for analytics and workflow testing.",
    category: "Synthetic financial data",
    version: "1.0.0",
    format: "CSV",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    sourceName: "FinAI synthetic examples",
    sourceUrl: null,
    recordCount: 10,
    updatedAt: "2026-11-13T00:00:00.000Z",
  },
];

test("public data library loads anonymously, filters datasets and downloads original CSV files", async ({
  page,
}) => {
  let catalogueRequests = 0;
  await page.route("**/api/v1/public/datasets", async (route) => {
    catalogueRequests++;
    expect(route.request().method()).toBe("GET");
    const headers = await route.request().allHeaders();
    expect(headers.cookie).toBeUndefined();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ datasets: fixtures }),
    });
  });

  await page.goto("/datasets");
  await expect(
    page.getByRole("heading", {
      name: "Useful financial data. Open to everyone.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Starter chart of accounts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Synthetic customer invoices" }),
  ).toBeVisible();
  expect(catalogueRequests).toBeGreaterThan(0);

  await page.getByRole("textbox", { name: "Search datasets" }).fill("invoice");
  await expect(
    page.getByRole("heading", { name: "Synthetic customer invoices" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Starter chart of accounts" }),
  ).toHaveCount(0);

  await page.getByRole("textbox", { name: "Search datasets" }).fill("");
  await page.getByRole("button", { name: "Accounting template" }).click();
  await expect(
    page.getByRole("heading", { name: "Starter chart of accounts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Synthetic ledger transactions" }),
  ).toHaveCount(0);

  const response = await page.request.get(
    "http://127.0.0.1:5173/datasets/synthetic-invoices.csv",
  );
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("INV-1001");
});

test("public data library keeps API failures visible instead of showing demo records", async ({
  page,
}) => {
  await page.route("**/api/v1/public/datasets", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "database unavailable" }),
    });
  });
  await page.goto("/datasets");
  await expect(page.getByRole("alert")).toContainText(
    "We couldn’t load the library.",
  );
  await expect(
    page.getByText("Starter chart of accounts", { exact: true }),
  ).toHaveCount(0);
});
