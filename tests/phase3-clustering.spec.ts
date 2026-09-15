import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

test.describe("Phase 3 clustering labs", () => {
  test("k-means lesson loads blobs and exposes K controls", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseURL}/ml/clustering/k-means`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /K-Means Clustering/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/Inertia/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("dbscan can switch datasets and show noise counts", async ({ page }) => {
    await page.goto(`${baseURL}/ml/clustering/dbscan`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /DBSCAN/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Noise/i).first()).toBeVisible();
  });

  test("gmm shows AIC/BIC after loading", async ({ page }) => {
    await page.goto(`${baseURL}/ml/clustering/gaussian-mixture-model`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/BIC/i).first()).toBeVisible({ timeout: 20000 });
  });

  test("hierarchical linkage control is present", async ({ page }) => {
    await page.goto(`${baseURL}/ml/clustering/hierarchical-clustering`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/Ward|Single|Complete|Average/i).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("optics reachability plot is present", async ({ page }) => {
    await page.goto(`${baseURL}/ml/clustering/optics`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Reachability/i).first()).toBeVisible({ timeout: 20000 });
  });

  test("k-medoids, mean-shift, and spectral labs render headings", async ({ page }) => {
    await page.goto(`${baseURL}/ml/clustering/k-medoids`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /K\s*-?\s*Medoids/i })).toBeVisible({
      timeout: 20000,
    });
    await page.goto(`${baseURL}/ml/clustering/mean-shift`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Mean Shift/i })).toBeVisible({
      timeout: 20000,
    });
    await page.goto(`${baseURL}/ml/clustering/spectral-clustering`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /Spectral/i })).toBeVisible({
      timeout: 20000,
    });
  });
});
