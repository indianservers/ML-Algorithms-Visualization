import { expect, test } from "@playwright/test";

const url = "http://localhost:3355/ml/deep-learning/perceptron?tab=visualize";

test("Perceptron visualization shows the plot and can start training", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);

  await expect(page.getByRole("img", { name: "Decision boundary plot" })).toBeVisible();
  await expect(page.locator(".pc-controls")).toBeVisible();
  await page.getByRole("button", { name: "Play training" }).click();
  await expect(page.getByText(/Training prepared \d+ epochs?/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause training" })).toBeVisible();
  await page.locator(".pc-controls").getByRole("button", { name: "Dataset" }).click();
  await expect(page.locator(".pc-dataset")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Perceptron visualization fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);

  await expect(page.getByRole("img", { name: "Decision boundary plot" })).toBeVisible();
  await expect(page.locator(".pc-controls")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("Perceptron dataset points can be edited visually and as values", async ({ page }) => {
  await page.goto("http://localhost:3355/ml/deep-learning/perceptron?tab=dataset");
  const editor = page.locator(".pc-data-editor");
  await expect(editor.getByText("Visual point editor")).toBeVisible();
  const x = editor.getByRole("spinbutton", { name: "Selected dataset point x" });
  await x.fill("2.5");
  await expect(editor.getByRole("textbox", { name: "x row 1", exact: true })).toHaveValue("2.5");
  await page.getByRole("tab", { name: /Visualize/ }).click();
  await expect(page.getByRole("img", { name: "Decision boundary plot" })).toBeVisible();
});
