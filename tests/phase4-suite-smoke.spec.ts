import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

const suite = [
  "/ml/supervised/simple-linear-regression",
  "/ml/supervised/multiple-linear-regression",
  "/ml/supervised/polynomial-regression",
  "/ml/supervised/ridge-regression",
  "/ml/supervised/lasso-regression",
  "/ml/supervised/elastic-net-regression",
  "/ml/supervised/decision-tree-regression",
  "/ml/supervised/random-forest-regression",
  "/ml/supervised/gradient-boosting-regression",
  "/ml/supervised/support-vector-regression",
  "/ml/supervised/logistic-regression",
  "/ml/supervised/multinomial-logistic-regression",
  "/ml/supervised/knn-classification",
  "/ml/supervised/naive-bayes",
  "/ml/supervised/decision-tree-classification",
  "/ml/supervised/random-forest-classification",
  "/ml/supervised/svm-classification",
  "/ml/supervised/gradient-boosting-classification",
  "/ml/supervised/adaboost-classification",
  "/ml/supervised/xgboost-concept",
  "/ml/clustering/k-means",
  "/ml/clustering/k-medoids",
  "/ml/clustering/hierarchical-clustering",
  "/ml/clustering/dbscan",
  "/ml/clustering/mean-shift",
  "/ml/clustering/gaussian-mixture-model",
  "/ml/clustering/spectral-clustering",
  "/ml/clustering/optics",
  "/ml/deep-learning/perceptron",
  "/ml/deep-learning/mlp",
  "/ml/deep-learning/nn-playground",
  "/ml/deep-learning/cnn",
  "/ml/deep-learning/convolution-visualizer",
  "/ml/deep-learning/rnn",
  "/ml/deep-learning/lstm",
  "/ml/deep-learning/gru",
  "/ml/deep-learning/transformer-attention",
  "/ml/deep-learning/multi-head-attention",
  "/ml/deep-learning/backpropagation-visualizer",
  "/ml/deep-learning/few-shot-learning",
  "/ml/deep-learning/network-builder",
  "/ml/deep-learning/transfer-learning",
  "/ml/time-series/moving-average",
  "/ml/time-series/exponential-smoothing",
  "/ml/time-series/holt-winters",
  "/ml/time-series/arima-concept",
  "/ml/time-series/anomaly-detection",
  "/ml/time-series/rnn-forecasting",
  "/ml/time-series/lstm-forecasting",
  "/ml/time-series/gru-forecasting",
];

test("50-page smoke: every scoped algorithm route renders a heading", async ({ page }) => {
  expect(suite).toHaveLength(50);
  const failed: string[] = [];
  for (const path of suite) {
    await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
    const heading = page.locator("h1").first();
    const ok = await heading.isVisible().catch(() => false);
    const crashed = await page.getByText("failed to render", { exact: false }).count();
    if (!ok || crashed > 0) failed.push(path);
  }
  expect(failed).toEqual([]);
});
