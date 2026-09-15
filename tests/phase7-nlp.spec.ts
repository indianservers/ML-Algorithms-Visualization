import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:7544";

test("FLOW A bag of words matrix and bigrams", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/bag-of-words`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/Document-term matrix/i)).toBeVisible();
  await page.getByRole("combobox", { name: /N-grams/i }).selectOption("12");
  await expect(page.getByText(/Vocabulary/i).first()).toBeVisible();
});

test("FLOW B tf-idf inspector", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/tf-idf`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/TF\(t, d\) = count/i)).toBeVisible();
  await expect(page.getByText(/Term inspector/i)).toBeVisible();
  await expect(page.getByText(/Search corpus by TF-IDF cosine/i)).toBeVisible();
});

test("FLOW C text classification train", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/text-classification`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /^Train$/i })).toBeVisible();
  await expect(page.getByText(/Held-out metrics/i)).toBeVisible();
});

test("FLOW D sentiment lexicon and NB", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/sentiment-analysis`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Lexicon/i).first()).toBeVisible();
  await page.getByRole("textbox").last().fill("I do not like this");
  await expect(page.getByText(/score/i).first()).toBeVisible();
});

test("FLOW E spam priors", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/naive-bayes-spam`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Laplace/i)).toBeVisible();
  await expect(page.getByText(/Spam threshold/i)).toBeVisible();
});

test("FLOW H embeddings coverage and top-k", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/word-embedding-concept`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/not trained on your corpus/i)).toBeVisible();
  await expect(page.getByText(/Coverage on dataset F/i)).toBeVisible();
});

test("FLOW I dataset library NLP profile", async ({ page }) => {
  await page.goto(`${baseURL}/ml/dataset-library`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible();
});

test("FLOW G audio pcm and train controls", async ({ page }) => {
  await page.goto(`${baseURL}/ml/nlp/audio-classification`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /Load synthetic tones/i })).toBeVisible();
  await page.getByRole("button", { name: /Load synthetic tones/i }).click();
  await expect(page.getByText(/PCM waveform/i)).toBeVisible();
});
