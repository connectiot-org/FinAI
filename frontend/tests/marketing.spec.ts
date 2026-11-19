import { test, expect } from "@playwright/test";
import {
  E2E_ACCOUNT_EMAIL,
  E2E_ACCOUNT_PASSWORD,
} from "./e2e-account";
import { signIn } from "./sign-in";

test("public navigation, product pages and demo entry work on direct refresh", async ({
  page,
}) => {
  // This case deliberately performs about forty full document loads (every
  // public path opened and then refreshed), which already needs ~42s on a
  // healthy CI runner. The suite default of 45s leaves no headroom for
  // runner variance, so allow a generous per-test budget.
  test.setTimeout(120_000);
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Clearer books\.\s*Closer together\./,
  );
  await page.getByRole("button", { name: "Product", exact: true }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: /General ledger/ }).click();
  await expect(page).toHaveURL("/product/automated-general-ledger");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your ledger, with every detail connected",
  );
  for (const path of [
    "/customers",
    "/product/bank-reconciliation",
    "/product/native-integrations",
    "/product/advanced-revenue-recognition",
    "/product/multi-entity",
    "/product/security-permissions",
    "/product/real-time-reporting",
    "/product/accounts-receivable",
    "/product/accounts-payable",
    "/product/financial-reporting",
    "/product/month-end-close",
    "/product/assistant",
    "/product/continuous-close",
    "/product/audit-compliance",
    "/product/implementation",
    "/product/flexible-gaap-reporting",
    "/resources",
    "/about",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await page.reload();
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.getByRole("link", { name: "See the idea in action" }).click();
  await expect(page).toHaveURL("/login");
  // The dashboard opens only after the provisioned sign-in (19 November
  // 2026 founder direction): the CTA lands on the log-in entry.
  await signIn(page);
  await expect(page.locator("main h1")).toHaveText("Overview");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("removed data library is unavailable and absent from public navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('a[href="/datasets"]')).toHaveCount(0);
  await page.goto("/datasets");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
test("homepage dashboard preview routes every entry to a demo request", async ({
  page,
}) => {
  await page.goto("/");
  const preview = page.locator(".reference-workspace");
  await expect(
    preview.getByText("Preview · Request a demo to continue"),
  ).toBeVisible();
  const links = preview.locator("a");
  expect(await links.count()).toBeGreaterThan(15);
  for (const link of await links.all())
    await expect(link).toHaveAttribute("href", "/request-demo");
  for (const selector of [
    ".reference-rail-logo",
    ".finance-ask",
    ".finance-metric",
  ]) {
    await page.goto("/");
    await preview.locator(selector).first().click();
    await expect(page).toHaveURL("/request-demo");
    await expect(
      page.getByRole("heading", {
        name: "See FinAI work with your own eyes.",
      }),
    ).toBeVisible();
  }
});
test("every public page offers a demo request and the log-in entry beside it", async ({
  page,
}) => {
  // Any anchor on a public page must be a demo request, the log-in entry, an
  // informational page, the labelled sample tour, an in-page anchor, the
  // booking form, or the footer GitHub link. Direct links into workspace
  // functions are the bypasses this guards; the log-in page itself is the
  // single sanctioned entry into the dashboard and, per the founder
  // refinement (16 November 2026), shows only the sign-in option.
  const allowed =
    /^(\/request-demo|\/|\/product\/|\/sample|\/customers|\/resources|\/about|\/login|#|https:\/\/forms\.gle\/qFhgN6g52xw4P17D7$|https:\/\/github\.com\/connectiot-org\/FinAI$)/;
  for (const path of [
    "/",
    "/resources",
    "/customers",
    "/about",
    "/request-demo",
    "/login",
    "/product/assistant",
    "/product/automated-general-ledger",
    "/product/accounts-receivable",
    "/product/accounts-payable",
    "/product/financial-reporting",
    "/product/month-end-close",
    "/product/bank-reconciliation",
    "/product/native-integrations",
    "/product/advanced-revenue-recognition",
    "/product/multi-entity",
    "/product/security-permissions",
    "/product/real-time-reporting",
    "/product/continuous-close",
    "/product/audit-compliance",
    "/product/implementation",
    "/product/flexible-gaap-reporting",
  ]) {
    await page.goto(path);
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a")).map((a) =>
        a.getAttribute("href"),
      ),
    );
    // The log-in page is intentionally a focused entry card (brand link plus
    // the sign-in form); every other public page stays a rich marketing
    // surface that must offer the demo funnel.
    const isLogin = path === "/login";
    const minimumLinks = isLogin ? 1 : 10;
    expect(hrefs.length, `${path} exposes links`).toBeGreaterThan(
      minimumLinks - 1,
    );
    const offenders = hrefs.filter((href) => href && !allowed.test(href));
    expect(offenders, `${path} must not link into the workspace`).toEqual([]);
    if (!isLogin) {
      const demoEntries = hrefs.filter((href) => href === "/request-demo");
      expect(
        demoEntries.length,
        `${path} must offer demo request entries`,
      ).toBeGreaterThan(0);
    }
  }
});
test("interactive homepage preview uses real records and search links", async ({
  page,
}) => {
  await page.goto("/resources#interactive-preview");
  await page.getByRole("tab", { name: "General ledger", exact: true }).click();
  const preview = page.getByRole("region", {
    name: "General ledger product preview",
  });
  await expect(preview).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Search product preview" })
    .fill("no matching record");
  await expect(
    preview.getByText("No matching demo records. Try another search."),
  ).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Search product preview" })
    .fill("INV-1001");
  await preview.locator("tbody a").first().click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await page.goto("/resources#interactive-preview");
  await page.getByRole("tab", { name: "Receivables", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Receivables product preview" })
      .locator("tbody tr"),
  ).toHaveCount(5);
  await page.getByRole("tab", { name: "FinAI Assistant", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "FinAI Assistant product preview" })
      .getByText("Demo responses · No model connection"),
  ).toBeVisible();
});
test("guided walkthrough, FAQ keyboard behavior and missing product recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a guided tour", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Bring a close together", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Request a demo to start this walkthrough" })
    .click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await page.goto("/resources#questions");
  const question = page
    .locator("summary")
    .filter({ hasText: "Will this connect to my bank or move real money?" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(
      "No. Bank connections, receipts, and payments are explicitly simulated.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.goto("/product/unknown-product");
  await expect(
    page.getByRole("heading", { name: "That page isn’t in this demo." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page).toHaveURL("/");
});
for (const width of [1440, 1280, 1024, 390])
  test(`public homepage and product containment at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.locator(".reference-hero .finance-metrics"),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".reference-hero h1")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/homepage-${width}.png`,
      fullPage: true,
    });
    if (width === 390) {
      await page
        .getByRole("button", { name: "Open public navigation" })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open public navigation" }),
      ).toBeFocused();
    }
    await page.goto("/product/accounts-receivable");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("original hero artwork and typography remain responsive", async ({
  page,
}) => {
  for (const target of [
    { width: 1440, size: 59.08 },
    { width: 390, size: 40 },
  ]) {
    await page.setViewportSize({ width: target.width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const measured = await page.evaluate(() => {
      const h = document.querySelector(".reference-hero h1")!,
        art = document.querySelector(".reference-hero-art")!,
        r = h.getBoundingClientRect(),
        a = art.getBoundingClientRect(),
        s = getComputedStyle(h);
      return {
        headline: { x: r.x, y: r.y, size: parseFloat(s.fontSize) },
        art: { x: a.x, y: a.y, width: a.width, height: a.height },
        font: s.fontFamily,
        image: (
          document.querySelector(".reference-hero-art>img") as HTMLImageElement
        ).naturalWidth,
      };
    });
    expect(measured.font).toContain("Space Grotesk");
    expect(measured.image).toBeGreaterThan(1000);
    expect(Math.abs(measured.headline.size - target.size)).toBeLessThan(1);
    expect(measured.art.y).toBeGreaterThan(measured.headline.y + 80);
    expect(measured.art.x).toBeGreaterThanOrEqual(0);
    expect(measured.art.x + measured.art.width).toBeLessThanOrEqual(
      target.width + 1,
    );
    expect(measured.art.height).toBeGreaterThan(200);
  }
});
test("public workflow carousel, local guide bookmark and workspace navigation rail work", async ({
  page,
}) => {
  await page.goto("/");
  const story = page.locator(".reference-story-copy h3");
  await expect(story).toHaveText("An invoice. A receipt. A clear trail.");
  await page.getByRole("button", { name: "Next workflow" }).click();
  await expect(story).toHaveText("A number with a source behind it.");
  await page.getByRole("button", { name: "Previous workflow" }).click();
  await expect(story).toHaveText("An invoice. A receipt. A clear trail.");
  await page.getByRole("button", { name: "Save workflow guide" }).click();
  await expect(
    page.getByRole("link", { name: "Workflow guide saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Workflow guide saved" }),
  ).toBeVisible();
  await signIn(page);
  await page.goto("/overview");
  await expect(
    page.getByRole("button", { name: "Expand navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Expand navigation" }).click();
  await expect(
    page.getByRole("button", { name: "Collapse navigation" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Journal entries", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveText("Journal entries");
});

test("platform sections preserve measured desktop spacing and stack full cards on mobile", async ({
  page,
}) => {
  for (const target of [
    { width: 1440, columns: 4 },
    { width: 390, columns: 1 },
  ]) {
    await page.setViewportSize({ width: target.width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".reference-platform-card")).toHaveCount(8);
    const layout = await page.evaluate(() => {
      const grid = document.querySelector(".reference-platform-grid")!,
        heading = document.querySelector(".reference-platform h2")!,
        cards = [...grid.children].map((card) => {
          const r = card.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        });
      return {
        headingY: heading.getBoundingClientRect().y,
        gridY: grid.getBoundingClientRect().y,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        cards,
      };
    });
    expect(layout.gridY - layout.headingY).toBeGreaterThan(100);
    expect(layout.gridY - layout.headingY).toBeLessThan(300);
    expect(layout.columns).toBe(target.columns);
    if (target.width === 390) {
      for (const card of layout.cards) {
        expect(Math.abs(card.width - 342)).toBeLessThan(1);
        expect(card.height).toBeGreaterThan(400);
      }
      for (let i = 1; i < layout.cards.length; i++)
        expect(layout.cards[i].y - layout.cards[i - 1].y).toBeGreaterThan(400);
      await expect(page.locator(".reference-ai-body > nav")).toBeHidden();
    } else {
      expect(Math.abs(layout.cards[0].height - 456.23)).toBeLessThan(2);
      await expect(page.locator(".reference-ai-body > nav")).toBeVisible();
    }
  }
});

test("product feature cards, source story and related-workflow carousel remain functional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/product/automated-general-ledger");
  await expect(page.locator(".marketing-benefits > div")).toHaveCount(3);
  await expect(
    page.locator(".product-reference-feature-grid > article"),
  ).toHaveCount(4);
  const feature = await page
    .locator(".product-reference-feature-grid > article")
    .first()
    .boundingBox();
  expect(Math.abs(feature!.width - 653.55)).toBeLessThan(2);
  expect(Math.abs(feature!.height - 605.33)).toBeLessThan(2);
  const rail = page.locator(".product-reference-related-rail");
  await expect(rail.locator(":scope > a")).toHaveCount(15);
  await expect(
    page.getByRole("button", { name: "Previous related workflows" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next related workflows" }).click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Previous related workflows" }),
  ).toBeEnabled();
  await page
    .getByRole("link", {
      name: "Request a demo to explore the record",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
});

test("FinAI identity, fictional companies and owned artwork replace endorsement cues", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Connected accounting workflows · FinAI");
  await expect(page.locator("h1")).toHaveText("Clearer books.Closer together.");
  await expect(page.locator(".marketing-header .finai-mark")).toBeVisible();
  await expect(page.locator(".reference-companies")).toContainText(
    "not customer endorsements",
  );
  await expect(page.locator(".reference-hero-art > img")).toHaveAttribute(
    "src",
    "/visuals/finai-city.svg",
  );
  await expect(page.locator("main")).not.toContainText(
    /Rillet|Zero-Day Close|trusted by|five.star|5.star/i,
  );
  await expect(page.locator(".reference-integration-grid a")).toHaveCount(6);
  await expect(
    page.getByRole("link", {
      name: "Explore Banking integrations — request a demo",
    }),
  ).toHaveAttribute("href", "/request-demo");
  await page.locator(".reference-company-grid a").first().click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await page.goto("/product/accounts-payable");
  await expect(page).toHaveTitle("Accounts payable · FinAI");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Request a demo", exact: true })
    .click();
  await expect(page).toHaveTitle("Request a demo · FinAI");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore sample workspace" }),
  ).toHaveCount(0);
  await signIn(page);
  await expect(page).toHaveTitle("Overview · FinAI");
});

test("preview tabs support arrow keys, Home and End without leaking searches", async ({
  page,
}) => {
  await page.goto("/resources#interactive-preview");
  const tabs = page.getByRole("tablist", { name: "Product preview views" });
  await tabs.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    tabs.getByRole("tab", { name: "General ledger", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveAccessibleName(
    "General ledger",
  );
  await page
    .getByRole("textbox", { name: "Search product preview" })
    .fill("no matching record");
  await tabs.getByRole("tab", { name: "Receivables", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Search product preview" }),
  ).toHaveValue("");
  await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(5);
  await page.keyboard.press("End");
  await expect(
    tabs.getByRole("tab", { name: "FinAI Assistant", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    tabs.getByRole("tab", { name: "Overview", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    tabs.getByRole("tab", { name: "FinAI Assistant", exact: true }),
  ).toBeFocused();
  await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1);
});

test("small-screen navigation exposes solution links and the workspace fits at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open public navigation" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator("summary")
    .filter({ hasText: "By company size" })
    .click();
  await dialog.getByRole("link", { name: "Mid-size" }).click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);
  // /overview is behind the provisioned sign-in (19 November 2026), so open
  // the workspace before checking the 320px layout of the dashboard.
  await signIn(page);
  for (const route of ["/", "/resources", "/overview"]) {
    await page.goto(route);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  }
  await expect(
    page.getByRole("button", { name: "Ask FinAI" }),
  ).toBeInViewport();
});

test("public header offers a demo request with the log-in entry and mobile navigation routes to both", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Supplier invoices", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Request a demo", exact: true }),
  ).toHaveAttribute("href", "/request-demo");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Log in", exact: true }),
  ).toHaveAttribute("href", "/login");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open public navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile public navigation" })
    .getByRole("link", { name: "Log in", exact: true })
    .click();
  await expect(page).toHaveURL("/login");
  // The card always shows the provisioned sign-in (17 November 2026 founder
  // direction): no create mode exists on any browser.
  await expect(
    page.getByRole("heading", {
      name: "Sign in to your workspace.",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Open public navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile public navigation" })
    .getByRole("link", { name: "Request a demo", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL("/request-demo");
  await expect(
    page.getByRole("heading", {
      name: "See FinAI work with your own eyes.",
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  await page.goto("/overview");
  const sidebarEntry = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Supplier invoices", exact: true });
  await expect(sidebarEntry).toHaveAttribute("href", "/demo/payables/invoices");
  await sidebarEntry.click();
  await expect(page).toHaveURL("/demo/payables/invoices");
  await expect(
    page.getByRole("heading", {
      name: "Invoices",
      exact: true,
    }),
  ).toBeVisible();
});

test("log-in entry opens the workspace only for provisioned accounts", async ({
  page,
}) => {
  await page.goto("/");
  const headerLogin = page
    .getByRole("banner")
    .getByRole("link", { name: "Log in", exact: true });
  await expect(headerLogin).toHaveAttribute("href", "/login");
  await headerLogin.click();
  await expect(page).toHaveURL("/login");
  await expect(page).toHaveTitle("Log in · FinAI");
  // The card is always the provisioned sign-in; no create mode exists.
  await expect(
    page.getByRole("heading", {
      name: "Sign in to your workspace.",
      exact: true,
    }),
  ).toBeVisible();
  const email = page.getByLabel("Email", { exact: true });
  const password = page.getByLabel("Password", { exact: true });
  // An email the company never provisioned is refused: the entry no longer
  // hands the workspace to any visitor (17 November 2026 founder direction).
  await email.fill("random.visitor@gmail.com");
  await password.fill("whatever-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Incorrect email or password.",
  );
  await expect(page).toHaveURL("/login");
  // A provisioned email with the wrong password is refused identically, so
  // the page cannot be used to probe which email is registered.
  await email.fill(E2E_ACCOUNT_EMAIL);
  await password.fill("wrong-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Incorrect email or password.",
  );
  await expect(page).toHaveURL("/login");
  // The reveal toggle can show the typed password before it is committed.
  await password.fill(E2E_ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  // The provisioned email with its password opens the workspace.
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/overview");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  // The whole workspace is usable after logging in.
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    nav.getByRole("link", { name: "General ledger" }),
  ).toHaveAttribute("href", "/accounting/ledger");
  await expect(
    nav.getByRole("link", { name: "Reports", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("FinAI · Local demo · USD")).toBeVisible();
  // Verification never writes a credential to the browser, and the clear
  // password appears nowhere in storage.
  const dumped = await page.evaluate(() => JSON.stringify(localStorage));
  expect(dumped).not.toContain("finai-access-v1");
  expect(dumped).not.toContain(E2E_ACCOUNT_PASSWORD);
  // The entry keeps working: a returning sign-in re-opens the workspace.
  await page.goto("/login");
  await email.fill(E2E_ACCOUNT_EMAIL);
  await password.fill(E2E_ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/overview");
  // The legacy sign-in path still lands on the log-in entry.
  await page.goto("/welcome");
  await expect(page).toHaveURL("/login");
});

test("repeated wrong passwords lock the log-in entry temporarily", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(E2E_ACCOUNT_EMAIL);
  // Four wrong passwords each earn the same non-committal reply.
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.getByLabel("Password", { exact: true }).fill(`no-${attempt}`);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Incorrect email or password.",
    );
  }
  // The fifth arms a cooldown that survives reloads.
  await page.getByLabel("Password", { exact: true }).fill("no-5");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  const lockout = page.getByText(/Too many attempts\. Try again in \d+s\./);
  await expect(lockout).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Password", { exact: true })).toBeDisabled();
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("finai-access-attempts-v1") || "null"),
  );
  expect(ledger.lockedUntil).toBeGreaterThan(Date.now());
  // The countdown runs down while the entry stays closed.
  const first = await lockout.textContent();
  await page.waitForTimeout(1300);
  const second = await lockout.textContent();
  expect(Number(second?.match(/(\d+)s/)?.[1])).toBeLessThan(
    Number(first?.match(/(\d+)s/)?.[1]),
  );
  // Reloading during the cooldown does not sidestep it.
  await page.reload();
  await expect(
    page.getByText(/Too many attempts\. Try again in \d+s\./),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeDisabled();
});

test("the log-in card offers no self-registration and points new teams to book a demo", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", {
      name: "Sign in to your workspace.",
      exact: true,
    }),
  ).toBeVisible();
  // There is no way to create an account or recover one from the page:
  // credentials exist only when the company owner provisions them.
  await expect(
    page.getByRole("button", { name: "Create sign-in", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Forgot your password?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reset access on this browser" }),
  ).toHaveCount(0);
  // A refused attempt still writes no credential to the browser.
  await page.getByLabel("Email", { exact: true }).fill("stranger@gmail.com");
  await page.getByLabel("Password", { exact: true }).fill("denied-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Incorrect email or password.",
  );
  const storage = await page.evaluate(() =>
    Object.keys(localStorage).join(","),
  );
  expect(storage).not.toContain("finai-access-v1");
  // Reloading keeps the same provisioned sign-in — no account was created.
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Sign in to your workspace.",
      exact: true,
    }),
  ).toBeVisible();
  // Visitors without a sign-in are invited to book a demo through the
  // founder's Google Form funnel.
  const bookDemo = page.getByRole("link", { name: "Book a demo", exact: true });
  await expect(bookDemo).toHaveAttribute(
    "href",
    "https://forms.gle/qFhgN6g52xw4P17D7",
  );
  await expect(bookDemo).toHaveAttribute("target", "_blank");
  await expect(page.getByText("Need an account?")).toBeVisible();
});

test("demo request funnel stays intact and separate from the log-in entry", async ({
  page,
}) => {
  await page.goto("/request-demo");
  await expect(page).toHaveTitle("Request a demo · FinAI");
  const frame = page.locator(".request-demo-form-card iframe");
  await expect(frame).toHaveAttribute(
    "src",
    "https://docs.google.com/forms/d/e/1FAIpQLSfo91sNqa9f49OhyAvsmp07ErR3ip8XB_AiqclQn5Kr9l5i3w/viewform?embedded=true&hl=en",
  );
  await expect(frame).toHaveAttribute("title", "FinAI book a demo form");
  await expect(
    page.getByRole("link", { name: /Open the form in a new tab/ }).first(),
  ).toHaveAttribute("href", "https://forms.gle/qFhgN6g52xw4P17D7");
  // The funnel itself stays a pure booking page: no account controls here.
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toHaveCount(0);
  // The log-in page shows only the sign-in-to-your-workspace option (founder
  // refinement, 16 November 2026), and since the 17 November direction that
  // option accepts only company-owner-provisioned credentials — there is no
  // create mode, no recovery panel, no third-party or SSO controls, no
  // divider and no second provisioned sign-in section. Visitors without a
  // sign-in are offered the book-a-demo link instead. The demo funnel stays
  // available on every other public page, the sample tour and the workspace.
  await page.goto("/login");
  await expect(
    page.getByRole("link", { name: "Request access through a demo" }),
  ).toHaveCount(0);
  await expect(page.locator(".login-divider")).toHaveCount(0);
  await expect(page.locator(".login-provisioned")).toHaveCount(0);
  await expect(page.locator(".login-teams")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Book a demo", exact: true }),
  ).toHaveAttribute("href", "https://forms.gle/qFhgN6g52xw4P17D7");
});

test("workspace deep links require the provisioned sign-in and the legacy free entry is closed", async ({
  page,
}) => {
  // Founder direction (19 November 2026): the dashboard is no longer open
  // without an account. /sample (and /welcome) used to offer a free
  // "Enter workspace" button and every workspace deep link opened directly;
  // both must now land on the provisioned log-in entry, which keeps the
  // book-a-demo funnel for visitors without credentials.
  await page.goto("/request-demo");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("link", { name: "Explore the product first" }).click();
  await expect(page).toHaveURL("/product/assistant");
  for (const route of ["/sample", "/welcome", "/overview", "/demo/payables/invoices"]) {
    await page.goto(route);
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("heading", { name: "Sign in to your workspace." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enter workspace" }),
    ).toHaveCount(0);
  }
  const demoFooter = page.getByRole("link", { name: "Book a demo" });
  await expect(demoFooter).toHaveAttribute(
    "href",
    "https://forms.gle/qFhgN6g52xw4P17D7",
  );
  // A provisioned sign-in still opens the full workspace dashboard.
  await signIn(page);
  await expect(page).toHaveURL("/overview");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("FinAI · Local demo · USD")).toBeVisible();
});
