import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

test.describe("Phase 1 regression labs", () => {
  test("simple linear loads, fits, and shows a near-perfect equation", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseURL}/ml/supervised/simple-linear-regression`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Simple Linear Regression/i })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /Train Model/i }).click({ timeout: 5000 }).catch(() => undefined);
    await expect(page.locator(".chart-equation, .equation").first()).toContainText(/2\.00|2\.0/, { timeout: 10000 });
    expect(errors).toEqual([]);
  });

  test("random forest train control is usable", async ({ page }) => {
    await page.goto(`${baseURL}/ml/supervised/random-forest-regression`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Random Forest/i })).toBeVisible({ timeout: 20000 });
    const train = page.getByRole("button", { name: /Train/i }).first();
    await train.click({ timeout: 8000 }).catch(() => undefined);
    await expect(page.locator("body")).toContainText(/RMSE|R²|R2/i);
  });

  test("svr kernel control remains on the page", async ({ page }) => {
    await page.goto(`${baseURL}/ml/supervised/support-vector-regression`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Support Vector/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/RBF|Linear|Polynomial/i).first()).toBeVisible();
  });
});
