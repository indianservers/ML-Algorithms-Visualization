import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const labs = [
  "moving-average",
  "exponential-smoothing",
  "holt-winters",
  "arima-concept",
  "anomaly-detection",
  "rnn-forecasting",
  "lstm-forecasting",
  "gru-forecasting",
];
const csv =
  "date,value,second\n" +
  Array.from(
    { length: 60 },
    (_, i) =>
      `2024-01-${String((i % 28) + 1).padStart(2, "0")},${i + 1},${i * 2}`,
  ).join("\n");
const validCsv =
  "date,value,second\n" +
  Array.from(
    { length: 60 },
    (_, i) =>
      `${new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10)},${i + 1},${i * 2}`,
  ).join("\n");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("ml-suite-theme-v3", "dark"),
  );
});
for (const lab of labs)
  test(`${lab}: route, tabs, dataset switching, upload and responsive controls`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/ml/time-series/${lab}?quick=1`);
    await expect(page.locator("[data-time-series-lab]")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "More", exact: true }),
    ).toHaveCount(1);
    for (const name of [
      "Learn",
      "Dataset",
      "Transform",
      "Metrics",
      "Compare",
      "Explain",
      "More",
      "Visualize",
    ]) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect(
        page.getByRole("tab", { name, exact: true }),
      ).toHaveAttribute("aria-selected", "true");
    }
    await page
      .getByRole("combobox", { name: "Dataset", exact: true })
      .selectOption("linear-trend");
    await expect(page.locator(".tsw-status")).toContainText("cleared");
    await page.getByRole("tab", { name: "Dataset", exact: true }).click();
    await page.getByLabel("Upload CSV", { exact: true }).setInputFiles({
      name: "series.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(validCsv),
    });
    await expect(
      page.getByRole("heading", { name: "series.csv", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Target variable", exact: true })
      .selectOption("second");
    await expect(
      page.getByRole("combobox", { name: "Target variable", exact: true }),
    ).toHaveValue("second");
    await page.getByRole("tab", { name: "Visualize", exact: true }).click();
    await page.screenshot({
      path: info.outputPath(`${lab}-1440.png`),
      fullPage: false,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("tab", { name: "Dataset", exact: true }),
    ).toBeVisible();
    const width = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: innerWidth,
      work: document.querySelector(".ts-workbench")!.getBoundingClientRect()
        .width,
    }));
    expect(width.doc).toBeLessThanOrEqual(width.view + 1);
    expect(width.work).toBeLessThanOrEqual(width.view + 1);
    await page.screenshot({ path: info.outputPath(`${lab}-390.png`) });
    expect(errors).toEqual([]);
  });
test("moving average: exact slider calculation, playback, verified challenge and matching prediction CSV", async ({
  page,
}) => {
  await page.goto("/ml/time-series/moving-average");
  await page.getByRole("tab", { name: "Dataset", exact: true }).click();
  await page.getByLabel("Upload CSV", { exact: true }).setInputFiles({
    name: "linear.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(validCsv),
  });
  await page.getByRole("tab", { name: "Visualize", exact: true }).click();
  await page
    .getByRole("slider", { name: "Window size", exact: true })
    .fill("3");
  await page
    .getByRole("slider", { name: "Selected observation", exact: true })
    .fill("5");
  await expect(page.getByTestId("ts-window-mean")).toHaveText("5.00");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByTestId("ts-window-mean")).toHaveText("6.00");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("tab", { name: "Learn", exact: true }).click();
  await page.getByLabel("Challenge numeric answer").fill("999999");
  await page
    .getByRole("button", { name: "Check calculation", exact: true })
    .click();
  await expect(page.getByText(/Not yet/)).toBeVisible();
  await page.getByRole("tab", { name: "Visualize", exact: true }).click();
  await page
    .getByRole("slider", { name: "Forecast horizon", exact: true })
    .fill("3");
  await page.getByRole("tab", { name: "More", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Prediction CSV", exact: true })
    .click();
  const file = await downloadPromise;
  const text = await readFile((await file.path())!, "utf8");
  const row = text.split("\n")[1].split(",");
  expect(+row[1]).toBe(49);
  expect(+row[2]).toBe(47);
});
test("CSV validation is explicit and retains the original data", async ({
  page,
}) => {
  await page.goto("/ml/time-series/exponential-smoothing");
  await page.getByRole("tab", { name: "Dataset", exact: true }).click();
  await page.getByLabel("Upload CSV", { exact: true }).setInputFiles({
    name: "duplicate.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByRole("alert")).toContainText("duplicate");
  await page
    .getByRole("combobox", { name: "Duplicate timestamps", exact: true })
    .selectOption("mean");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Original data · before transformations",
    }),
  ).toBeVisible();
});
test("SES: both reference modes and alpha changes produce evaluated comparisons", async ({
  page,
}) => {
  await page.goto("/ml/time-series/exponential-smoothing");
  await page
    .getByRole("slider", { name: "Alpha (level)", exact: true })
    .fill("0.7");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Alpha scenarios · same forecast origin",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Alpha scenarios · holdout errors (actual − forecast)",
      exact: true,
    }),
  ).toBeVisible();
  const alphaRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "α = 0.1", exact: true }) });
  await expect(alphaRow).toHaveCount(1);
  expect(await alphaRow.locator("td").nth(2).textContent()).toMatch(/\d/);
  await page.getByRole("checkbox", { name: "α = 0.1", exact: true }).uncheck();
  await expect(alphaRow).toHaveCount(0);
  await page.getByRole("checkbox", { name: "α = 0.1", exact: true }).check();
  await page
    .getByRole("button", {
      name: "Compare classical models + ARIMA",
      exact: true,
    })
    .click();
  await expect(page.locator(".tsw-status")).toContainText(
    "Compared compatible",
    { timeout: 35000 },
  );
  await expect(page.locator("td").filter({ hasText: "ARIMA (" })).toBeVisible();
});
test("ARIMA: real worker fit and parameter invalidation", async ({ page }) => {
  await page.goto("/ml/time-series/arima-concept?quick=1");
  await page
    .getByRole("button", { name: "Run ARIMA model", exact: true })
    .click();
  await expect(page.locator(".tsw-status")).toContainText("Fit complete", {
    timeout: 35000,
  });
  await page.getByRole("tab", { name: "Metrics", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Forecast accuracy · untouched test observations",
    }),
  ).toBeVisible();
  await page
    .getByRole("slider", { name: "d (differences)", exact: true })
    .fill("0");
  await expect(page.locator(".tsw-status")).toContainText("cleared");
});
test("anomaly replay: injection, causal detector and sensitivity", async ({
  page,
}) => {
  await page.goto("/ml/time-series/anomaly-detection");
  await page
    .getByRole("button", {
      name: "Inject anomaly at selected step",
      exact: true,
    })
    .click();
  await expect(page.locator(".tsw-status")).toContainText("Injected");
  await page
    .getByRole("slider", { name: "Selected observation", exact: true })
    .fill("70");
  await expect(
    page.getByRole("heading", { name: "Recent anomaly alerts", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".tsw-table-wrap tbody tr").first()).toBeVisible();
  await page
    .getByRole("combobox", { name: "Detection method", exact: true })
    .selectOption("modified");
  await page
    .getByRole("slider", { name: "Sensitivity threshold", exact: true })
    .fill("2");
  await expect(
    page.getByRole("combobox", { name: "Detection method", exact: true }),
  ).toHaveValue("modified");
  await page.getByRole("tab", { name: "Metrics", exact: true }).click();
  await expect(page.getByTestId("ts-replay-benchmark")).toContainText(
    "Replayed events detected",
  );
  await expect(page.getByTestId("ts-replay-benchmark")).toContainText(
    "Labelled observations without alert",
  );
});
for (const kind of ["rnn", "lstm", "gru"])
  test(`${kind}: actual browser training, inference, save/reload, cancellation and stale-result invalidation`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto(`/ml/time-series/${kind}-forecasting?quick=1`);
    await page
      .getByRole("button", { name: "Train model", exact: true })
      .click();
    await expect(page.locator(".tsw-status")).toContainText("Fit complete", {
      timeout: 60000,
    });
    await expect(
      page.getByRole("heading", { name: "Real training & validation loss" }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Predict from latest observation",
        exact: true,
      })
      .click();
    await expect(page.locator(".tsw-status")).toContainText(
      "Future forecast generated",
    );
    await page
      .getByRole("button", { name: "Save trained model", exact: true })
      .click();
    await expect(page.locator(".tsw-status")).toContainText("saved");
    await page
      .getByRole("button", { name: "Reload trained model", exact: true })
      .click();
    await expect(page.locator(".tsw-status")).toContainText("reloaded", {
      timeout: 30000,
    });
    await page.getByRole("tab", { name: "More", exact: true }).click();
    await expect(page.getByTestId("ts-model-shapes")).toContainText(
      "Actual model input: [batch,",
    );
    await expect(page.getByTestId("ts-model-shapes")).toContainText(
      "output: [batch, 1]",
    );
    await page.getByRole("tab", { name: "Visualize", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Dataset", exact: true })
      .selectOption("linear-trend");
    await expect(
      page.getByRole("button", {
        name: "Predict from latest observation",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(page.locator(".tsw-status")).toContainText("cleared");
    await page.getByRole("slider", { name: "Epochs", exact: true }).fill("100");
    await page
      .getByRole("button", { name: "Train model", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Stop safely", exact: true })
      .click();
    await expect(page.locator(".tsw-status")).toContainText("Cancelled");
  });

for (const width of [1920, 1366, 834])
  test(`all eight labs: layout at ${width}px`, async ({ page }, info) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 1000 });
    for (const lab of labs) {
      await page.goto(`/ml/time-series/${lab}?quick=1`);
      await expect(page.locator(".tsw-hero")).toBeVisible();
      const layout = await page.evaluate(() => {
        const root = document
          .querySelector(".ts-workbench")!
          .getBoundingClientRect();
        const charts = [...document.querySelectorAll(".tsw-chart")].map(
          (e) => e.getBoundingClientRect().width,
        );
        const clipped = [
          ...document.querySelectorAll(".tsw-config input,.tsw-config select"),
        ].filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 && (r.left < root.left - 1 || r.right > root.right + 1)
          );
        });
        return {
          width: document.documentElement.scrollWidth,
          view: innerWidth,
          charts,
          clipped: clipped.length,
        };
      });
      expect(layout.width).toBeLessThanOrEqual(layout.view + 1);
      expect(layout.charts.every((w) => w >= 250)).toBe(true);
      expect(layout.clipped).toBe(0);
      await page.screenshot({ path: info.outputPath(`${lab}-${width}.png`) });
    }
  });
for (const lab of [
  "moving-average",
  "exponential-smoothing",
  "holt-winters",
  "arima-concept",
])
  test(`${lab}: future forecasts keep the earlier holdout metrics unchanged`, async ({
    page,
  }) => {
    await page.goto(`/ml/time-series/${lab}?quick=1`);
    if (lab === "arima-concept") {
      await page
        .getByRole("button", { name: "Run ARIMA model", exact: true })
        .click();
      await expect(page.locator(".tsw-status")).toContainText("Fit complete", {
        timeout: 35000,
      });
    }
    await page.getByRole("tab", { name: "Metrics", exact: true }).click();
    const before = await page.locator(".tsw-stat-grid").textContent();
    await page.getByRole("tab", { name: "Visualize", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Forecast from latest observation",
        exact: true,
      })
      .click();
    await expect(page.locator(".tsw-status")).toContainText(
      "Future forecast generated",
      { timeout: 35000 },
    );
    await expect(
      page.getByRole("heading", {
        name: "Future forecast · no observed target",
      }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Metrics", exact: true }).click();
    expect(await page.locator(".tsw-stat-grid").textContent()).toBe(before);
  });
test("corrupt experiment history cannot crash the workspace", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("aimers.ts.experiments.v1", "{}"),
  );
  await page.goto("/ml/time-series/moving-average");
  await expect(
    page.getByRole("heading", { name: "Moving Average", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "More", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Experiments and exports" }),
  ).toBeVisible();
});
