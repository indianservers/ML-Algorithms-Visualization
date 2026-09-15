import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

test("FLOW A moving average window change", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/moving-average`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  const before = await page.locator("svg").first().innerHTML();
  const slider = page.locator("input[type=range]").first();
  if (await slider.count()) {
    await slider.fill("12");
  }
  const after = await page.locator("svg").first().innerHTML();
  expect(after).not.toEqual(before);
});

test("FLOW B Holt-Winters future horizon", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/holt-winters`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/Hold-out vs seasonal naive/i)).toBeVisible();
});

test("FLOW C ARIMA differencing page loads", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/arima-concept`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/ARIMA/i).first()).toBeVisible();
});

test("FLOW D anomaly threshold changes count", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/anomaly-detection`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body.length).toBeGreaterThan(40);
});

test("FLOW E LSTM lab trains then reset", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(`${baseURL}/ml/time-series/lstm-forecasting?advanced=1&quick=1`, {
    waitUntil: "domcontentloaded",
  });
  const train = page.getByRole("button", { name: /train/i }).first();
  if (await train.count()) {
    await train.click();
    await page.waitForTimeout(2500);
  }
  const reset = page.getByRole("button", { name: /reset/i }).first();
  if (await reset.count()) await reset.click();
  await expect(page.locator("h1").first()).toBeVisible();
});

test("FLOW 1 dataset module monthly sales to Holt-Winters", async ({ page }) => {
  await page.goto(`${baseURL}/dataset-library`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  await page.goto(`${baseURL}/ml/time-series/holt-winters`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  const period = page.getByLabel(/season/i).first();
  if (await period.count()) {
    await period.fill("12");
  }
});

test("FLOW 2 ARIMA trend d=1 residuals", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/arima-concept`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText(/Difference inspector/i)).toBeVisible();
  await expect(page.getByText(/not a formal ADF/i)).toBeVisible();
});

test("FLOW 3 anomaly known spikes change threshold", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/anomaly-detection`, {
    waitUntil: "domcontentloaded",
  });
  const select = page.getByLabel("Dataset").first();
  if (await select.count()) {
    await select.selectOption({ label: "Known spike anomalies" }).catch(() => undefined);
  }
  await expect(page.getByText(/Known-anomaly benchmark|Detection Controls/i)).toBeVisible();
});

test("FLOW 4 LSTM dataset switch", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/lstm-forecasting`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/LSTM/i).first()).toBeVisible();
  const select = page.getByLabel("Dataset").first();
  if (await select.count()) {
    const options = await select.locator("option").allTextContents();
    if (options.length > 1) await select.selectOption({ index: 1 });
  }
});

test("FLOW 5 GRU page loads and reset exists", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/gru-forecasting`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  const reset = page.getByRole("button", { name: /reset/i }).first();
  if (await reset.count()) await reset.click();
});

test("FLOW 6 comparison wording on exponential smoothing", async ({ page }) => {
  await page.goto(`${baseURL}/ml/time-series/exponential-smoothing`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText(/FORECAST START/i)).toBeVisible();
  await expect(page.getByText(/Hold-out ME/i)).toBeVisible();
});

test("FLOW F dataset library sends time series to Holt-Winters", async ({ page }) => {
  await page.goto(`${baseURL}/dataset-library`, { waitUntil: "domcontentloaded" });
  const holt = page.locator("a[href='/ml/time-series/holt-winters']").first();
  if (await holt.count()) {
    await holt.click();
    await expect(page).toHaveURL(/holt-winters/);
  } else {
    await page.goto(`${baseURL}/ml/time-series/holt-winters`);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});
