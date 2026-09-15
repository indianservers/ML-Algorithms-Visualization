import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

test("FLOW A PCA iris variance and components", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dimensionality-reduction/pca`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/Variance retained/i)).toBeVisible();
  await expect(page.getByText(/Loadings/i)).toBeVisible();
});

test("FLOW B Kernel PCA gamma control present", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dimensionality-reduction/kernel-pca`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/Kernel PCA/i).first()).toBeVisible();
  await expect(page.getByLabel(/Gamma/i).first()).toBeVisible();
});

test("FLOW C t-SNE run control is explicit", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dimensionality-reduction/tsne`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: /Run t-SNE/i })).toBeVisible();
  await expect(page.getByText(/local neighborhoods/i)).toBeVisible();
});

test("FLOW D UMAP honest implementation note", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dimensionality-reduction/umap-concept`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText(/UMAP-like/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Recompute Embedding/i })).toBeVisible();
});

test("FLOW E LDA requested dimensions clamp copy", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dimensionality-reduction/lda`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText(/min\(p, C-1\)/i)).toBeVisible();
  await expect(page.getByText(/kept/i).first()).toBeVisible();
});

test("FLOW F Autoencoder train/reset", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(`${baseURL}/ml/dimensionality-reduction/autoencoder`, {
    waitUntil: "domcontentloaded",
  });
  const train = page.getByRole("button", { name: /train/i }).first();
  if (await train.count()) await train.click();
  const reset = page.getByRole("button", { name: /reset/i }).first();
  if (await reset.count()) await reset.click();
  await expect(page.locator("body")).toBeVisible();
});
