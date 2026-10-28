import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { languages } from '../src/i18n/languages';
const baseline = JSON.parse(
  readFileSync(
    new URL("./fixtures/localization-english-baseline.json", import.meta.url),
    "utf8",
  ),
) as Record<string, string[]>;
async function language(page: Page, code: string) {
  await page.locator(".ml-locale-trigger").click();
  await page.locator(".ml-locale-menu input").fill(code);
  await page.locator(`.ml-locale-options button[lang="${code}"]`).click();
  await expect(page.locator("html")).toHaveAttribute("lang", code);
}
test('All 41 locales switch, persist and restore English without runtime translation requests', async ({page}) => {
  test.setTimeout(240000);
  const errors:string[]=[], translationRequests:string[]=[];
  page.on('pageerror', error=>errors.push(error.message));
  page.on('request', request=>{if(/translate\.googleapis|translation\.googleapis|microsofttranslator/.test(request.url()))translationRequests.push(request.url());});
  await page.goto('/');
  for(const locale of languages){
    await language(page, locale.code);
    await expect(page.locator('html')).toHaveAttribute('dir', locale.dir);
    expect(await page.evaluate(()=>localStorage.getItem('mlSuite.locale'))).toBe(locale.code);
    await expect(page.locator('main')).not.toContainText(/s_[0-9a-f]{8}/);
  }
  await language(page, 'en-IN');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','en-IN');
  expect(errors).toEqual([]);
  expect(translationRequests).toEqual([]);
});
test('Standalone lab keeps its iframe and simulation controls across locale changes', async ({page})=>{
  await page.goto('/ai-algorithms/uniform-cost-search');
  const frame=page.frameLocator('iframe.ai-virtual-lab-frame');
  await expect(frame.locator('#app')).toBeVisible();
  const select=frame.locator('select').first();
  const value=await select.inputValue();
  const identity=await page.locator('iframe.ai-virtual-lab-frame').evaluate(element=>{
    const iframe=element as HTMLIFrameElement;
    iframe.dataset.testIdentity='preserved';
    return iframe.src;
  });
  await language(page,'hi');
  await expect(frame.locator('html')).toHaveAttribute('lang','hi');
  await expect(select).toHaveValue(value);
  await expect(page.locator('iframe.ai-virtual-lab-frame')).toHaveAttribute('data-test-identity','preserved');
  expect(await page.locator('iframe.ai-virtual-lab-frame').getAttribute('src')).toBe(new URL(identity).pathname+new URL(identity).search);
  await language(page,'en-IN');
  await expect(frame.locator('html')).toHaveAttribute('lang','en-IN');
  await expect(select).toHaveValue(value);
});
for (const [route, original] of Object.entries(baseline))
  test(`Original English regression: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator(".ml-locale-trigger")).toBeVisible();
    await expect(page.locator("main h1").first()).toBeVisible({
      timeout: 45000,
    });
    if (route === "/ml/lab/dataset-manager") await expect(page.locator('#editable-grid tbody input[aria-label]').first()).toBeVisible({timeout:60000});
    await expect(page.locator('[aria-label="Loading algorithm tools"]')).toHaveCount(0, {timeout:60000});
    await page.waitForTimeout(1800);
    const current = await page.evaluate(() => {
      const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        ),
        text: string[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (
          node.parentElement?.closest("script,style,.ml-locale,.route-progress")
        )
          continue;
        if (!node.parentElement?.checkVisibility()) continue;
        const value = node.textContent?.replace(/\s+/g, " ").trim();
        if (value) text.push(value);
      }
      return text;
    });
    expect(current).toEqual(original);
    expect(errors).toEqual([]);
  });
test("Explicit selection, lazy resources, persistence, fallback and keyboard access", async ({
  page,
}) => {
  const resources: string[] = [];
  page.on("request", (request) => resources.push(request.url()));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "language", { value: "fr-FR" }),
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await page.locator(".ml-locale-trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ml-locale-menu input")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ml-locale-trigger")).toBeFocused();
  await language(page, "te");
  await expect(page.locator(".ml-locale-trigger")).toContainText("తెలుగు");
  expect(
    await page.evaluate(() => localStorage.getItem("mlSuite.locale")),
  ).toBe("te");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
  await language(page, "fr");
  await expect(
    page.locator('a[href="/"]').filter({ hasText: "Accueil" }).first(),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("mlSuite.locale", "not-supported"),
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  expect(
    resources.filter((url) => /\/locales\/.*\.json/.test(url)).length,
  ).toBe(0); // Bundled imports, no translation API.
});
test("Optimizer parameters, iteration and chart values survive language changes", async ({
  page,
}) => {
  await page.goto("/ml/optimization/gradient-descent");
  const controls = page.locator('[data-control-panel=true]').filter({has:page.getByRole('heading',{name:'Shared Controls',exact:true})});
  const stepper = page.locator('[data-control-panel=true]').filter({has:page.getByRole('heading',{name:'Step Controls',exact:true})});
  const trail = page.getByRole('table').filter({has:page.getByRole('columnheader',{name:'grad',exact:true})});
  await controls.getByRole("slider").first().fill("0.123");
  await stepper.getByRole("button", { name: "Step", exact: true }).click();
  const read = async () => ({ values: await controls.getByRole('slider').evaluateAll(inputs=>inputs.map(input=>(input as HTMLInputElement).value)), step: await stepper.getByRole('slider').inputValue() });
  const before = await read();
  const cells = await trail.locator("tbody").allTextContents();
  const path = page.url();
  await language(page, "ru");
  expect(await read()).toEqual(before);
  expect(await trail.locator("tbody").allTextContents()).toEqual(cells);
  expect(page.url()).toBe(path);
  await language(page, "en-IN");
  expect(await read()).toEqual(before);
});
test("Actual TensorFlow.js model, metrics and hyperparameters survive locale changes", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.goto("/ml/time-series/gru-forecasting?quick=1");
  await page.getByRole("button", { name: "Train model", exact: true }).click();
  await language(page, "hi");
  await expect(page.locator(".tsw-status")).toContainText("Fit complete", {
    timeout: 60000,
  });
  await language(page, "en-IN");
  await page.getByRole("tab", { name: "Metrics", exact: true }).click();
  const metrics = await page.locator(".tsw-stat-grid strong").allTextContents();
  const config = await page
    .locator(".tsw-config input")
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
  await language(page, "hi");
  expect(await page.locator(".tsw-stat-grid strong").allTextContents()).toEqual(
    metrics,
  );
  await language(page, "en-IN");
  await page.getByRole("tab", { name: "Visualize", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Predict from latest observation",
      exact: true,
    })
    .click();
  await expect(page.locator(".tsw-status")).toContainText(
    "Future forecast generated",
  );
  expect(
    await page
      .locator(".tsw-config input")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual(config);
});
test("Dataset edits and schema survive language selection", async ({
  page,
}) => {
  await page.goto("/ml/lab/dataset-manager");
  const cell = page.locator('#editable-grid tbody input[aria-label]').first();
  await expect(cell).toBeVisible({ timeout: 45000 });
  await cell.fill("17.25");
  const schema = await page
    .locator("#editable-grid thead input")
    .evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    );
  await language(page, "fr");
  await expect(cell).toHaveValue("17.25");
  expect(
    await page
      .locator("#editable-grid thead input")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual(schema);
});
test("Lesson page and route remain fixed", async ({ page }) => {
  await page.goto("/ml/supervised/simple-linear-regression/lessons/3");
  const path = page.url(),
    content = await page.locator("main").textContent();
  await language(page, "te");
  expect(page.url()).toBe(path);
  expect(content).toContain("3");
  expect(await page.locator("main").textContent()).toContain("3");
});
for (const locale of ["ru", "de", "te", "ar"])
  test(`Responsive and direction checks: ${locale}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/ml/time-series/moving-average");
    await language(page, locale);
    if (locale === "ar") await expect(page.locator('nav.lab-topbar a[href="/"]').first()).toContainText("الرئيسية");
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr",
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.locator(".ml-locale-trigger")).toBeVisible();
      const geometry = await page.evaluate(() => ({
        view: innerWidth,
        width: document.documentElement.scrollWidth,
        chart: document.querySelector(".tsw-chart")?.getBoundingClientRect()
          .width,
      }));
      expect(geometry.width).toBeLessThanOrEqual(geometry.view + 1);
      expect(geometry.chart).toBeGreaterThan(250);
      await page.screenshot({
        path: info.outputPath(`${locale}-${width}.png`),
      });
    }
    expect(errors).toEqual([]);
  });
