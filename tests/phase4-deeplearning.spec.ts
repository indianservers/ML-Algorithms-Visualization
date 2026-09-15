import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

const pages = [
  ["/ml/deep-learning/perceptron", /Perceptron/i],
  ["/ml/deep-learning/mlp", /MLP|Multilayer/i],
  ["/ml/deep-learning/nn-playground", /Playground|Neural/i],
  ["/ml/deep-learning/cnn", /CNN|Convolution/i],
  ["/ml/deep-learning/convolution-visualizer", /Convolution/i],
  ["/ml/deep-learning/rnn", /RNN|Recurrent/i],
  ["/ml/deep-learning/lstm", /LSTM/i],
  ["/ml/deep-learning/gru", /GRU/i],
  ["/ml/deep-learning/transformer-attention", /Attention/i],
  ["/ml/deep-learning/multi-head-attention", /Head|Attention/i],
  ["/ml/deep-learning/backpropagation-visualizer", /Backprop/i],
  ["/ml/deep-learning/few-shot-learning", /Few|Shot|Prototype/i],
  ["/ml/deep-learning/network-builder", /Network|Builder/i],
  ["/ml/deep-learning/transfer-learning", /Transfer/i],
] as const;

test.describe("Phase 4 deep learning labs", () => {
  for (const [path, heading] of pages) {
    test(`loads ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20000 });
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 20000 });
      expect(errors.filter((message) => !/ResizeObserver/i.test(message))).toEqual([]);
    });
  }
});
