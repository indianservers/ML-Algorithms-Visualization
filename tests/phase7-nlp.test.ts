import { describe, expect, it } from "vitest";
import { ngrams, preprocessDocument, tokenizeText } from "../src/lib/nlp/textPrep";
import {
  bagOfWordsMatrix,
  cosineSimilarity,
  fitVocabulary,
  idfValue,
  inspectTerm,
  l1Normalize,
  l2Normalize,
  sparsity,
  tfidfMatrix,
  transformTfIdf,
  vectorNorm,
} from "../src/lib/nlp/vectorize";
import {
  logLikelihood,
  majorityBaseline,
  predictMultinomialNB,
  stratifiedSplit,
  trainMultinomialNB,
} from "../src/lib/nlp/naiveBayesText";
import { analogy, embeddingCoverage, getEmbedding, nearestWords } from "../src/lib/nlp/embeddings";
import { lexiconSentiment } from "../src/lib/nlp/lexiconSentiment";
import {
  dftMagnitude,
  featureScaler,
  generateSine,
  isSilent,
  mfccFromLogSpectrum,
  resampleLinear,
  stereoToMono,
  stft,
} from "../src/lib/nlp/audioFeatures";
import { softmax } from "../src/lib/math/statistics";
import { profileTextDataset } from "../src/lib/nlp/nlpDatasets";

describe("tokenization and n-grams", () => {
  it("tokenizes spaces, punctuation, apostrophes, and empty text", () => {
    expect(tokenizeText("")).toEqual([]);
    expect(tokenizeText("   ")).toEqual([]);
    expect(tokenizeText("cat   dog")).toEqual(["cat", "dog"]);
    expect(tokenizeText("GOOD!!!", { lowercase: true, stripPunctuation: true })).toEqual(["good"]);
    expect(tokenizeText("don't", { lowercase: true, stripPunctuation: true })).toEqual(["don't"]);
    expect(tokenizeText("machine-learning", { lowercase: true, stripPunctuation: true })).toEqual(["machine", "learning"]);
    expect(tokenizeText("price 500", { removeNumbers: true })).toEqual(["price"]);
    expect(tokenizeText("Hello.", { tokenMode: "character", lowercase: false }).join("")).toContain("H");
    expect(tokenizeText("One. Two!", { tokenMode: "sentence", lowercase: false })).toEqual(["One", "Two"]);
  });

  it("builds unigrams and bigrams", () => {
    expect(ngrams(["machine", "learning", "is", "powerful"], 1, 2)).toEqual([
      "machine", "learning", "is", "powerful",
      "machine learning", "learning is", "is powerful",
    ]);
  });

  it("keeps not for bigram negation and documents tokenizer edge cases", () => {
    expect(preprocessDocument("not good", { ngramMin: 1, ngramMax: 2, removeStopwords: true }).features).toContain("not good");
    expect(tokenizeText("Machine learning is great!", { lowercase: true, stripPunctuation: true })).toEqual([
      "machine", "learning", "is", "great",
    ]);
    expect(tokenizeText("Apple apple APPLE", { lowercase: true })).toEqual(["apple", "apple", "apple"]);
    expect(tokenizeText("Apple apple APPLE", { lowercase: false })).toEqual(["Apple", "apple", "APPLE"]);
    expect(tokenizeText("don't can't", { lowercase: true, stripPunctuation: true })).toEqual(["don't", "can't"]);
    expect(tokenizeText("C++ C# node.js", { lowercase: true, stripPunctuation: true })).toEqual(["c++", "c#", "node.js"]);
    expect(tokenizeText("user@example.com https://example.com", { lowercase: true, stripPunctuation: true })).toEqual([
      "user@example.com", "https://example.com",
    ]);
    expect(tokenizeText("₹500 $100 2026-09-15", { lowercase: true, stripPunctuation: true })).toEqual(["₹500", "$100", "2026-09-15"]);
    expect(tokenizeText("తెలుగు हिंदी", { lowercase: true, stripPunctuation: true })).toEqual(["తెలుగు", "हिंदी"]);
  });
});

describe("bag of words", () => {
  it("matches the cat cat milk / dog milk count and binary matrices", () => {
    const counts = bagOfWordsMatrix(["cat cat milk", "dog milk"], { lowercase: true, stripPunctuation: true });
    expect(counts.vocabulary).toEqual(["cat", "dog", "milk"]);
    expect(counts.matrix).toEqual([
      [2, 0, 1],
      [0, 1, 1],
    ]);
    const binary = bagOfWordsMatrix(["cat cat milk", "dog milk"], { lowercase: true, stripPunctuation: true, binary: true });
    expect(binary.matrix).toEqual([
      [1, 0, 1],
      [0, 1, 1],
    ]);
    expect(sparsity(counts.matrix).nnz).toBe(4);
  });

  it("matches the cat/dog count matrix in alphabetical order", () => {
    const result = bagOfWordsMatrix(["cat likes milk", "dog likes food"], { lowercase: true, stripPunctuation: true });
    expect(result.vocabulary).toEqual(["cat", "dog", "food", "likes", "milk"]);
    expect(result.matrix).toEqual([
      [1, 0, 0, 1, 1],
      [0, 1, 1, 1, 0],
    ]);
  });

  it("uses binary presence and ignores OOV columns", () => {
    const result = bagOfWordsMatrix(["cat cat cat"], { binary: true, lowercase: true });
    expect(result.matrix[0][result.vocabulary.indexOf("cat")]).toBe(1);
    const model = fitVocabulary(["cat likes milk"], { lowercase: true });
    const transformed = transformTfIdf(["futuretestuniquetoken milk"], model);
    expect(model.vocabulary.includes("futuretestuniquetoken")).toBe(false);
    expect(transformed[0].oov).toContain("futuretestuniquetoken");
  });
});

describe("tf-idf", () => {
  it("matches the two-document cat/dog example", () => {
    const docs = ["cat dog", "cat"];
    const { model, rows } = tfidfMatrix(docs, { lowercase: true, stripPunctuation: true });
    expect(model.vocabulary).toEqual(["cat", "dog"]);
    expect(rows[0].tf).toEqual([1, 1]);
    expect(rows[1].tf).toEqual([1, 0]);
    const idfCat = idfValue(2, 2);
    const idfDog = idfValue(2, 1);
    expect(idfCat).toBeCloseTo(Math.log(3 / 3) + 1);
    expect(idfDog).toBeGreaterThan(idfCat);
    expect(rows[0].raw[0]).toBeCloseTo(1 * idfCat);
    expect(rows[0].raw[1]).toBeCloseTo(1 * idfDog);
    const l2 = l2Normalize(rows[0].raw);
    expect(vectorNorm(l2, "l2")).toBeCloseTo(1);
    const l1 = l1Normalize(rows[0].raw);
    expect(vectorNorm(l1, "l1")).toBeCloseTo(1);
    const zero = transformTfIdf(["the the the"], { ...model, l2: true })[0];
    expect(zero.normalized.every((v) => v === 0)).toBe(true);
  });

  it("uses count TF and sklearn-like smoothed IDF", () => {
    const docs = ["a a b", "a c"];
    const { model, rows } = tfidfMatrix(docs, { lowercase: true, stripPunctuation: true, l2: false });
    expect(model.vocabulary).toEqual(["a", "b", "c"]);
    expect(rows[0].tf).toEqual([2, 1, 0]);
    const idfA = idfValue(2, 2);
    const idfB = idfValue(2, 1);
    expect(idfA).toBeCloseTo(1);
    expect(rows[0].raw[0]).toBeCloseTo(2 * idfA);
    expect(rows[0].raw[1]).toBeCloseTo(1 * idfB);
    const info = inspectTerm(docs, model, 0, "a");
    expect(info.tf).toBe(2);
    expect(info.df).toBe(2);
    expect(info.idf).toBeCloseTo(idfA);
  });
});

describe("cosine similarity", () => {
  it("handles orthogonal, identical, and zero vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });
});

describe("naive bayes text", () => {
  it("fits train-only vocabulary and ranks spam on obvious tokens", () => {
    const rows = [
      { text: "meet lunch office", label: "ham" },
      { text: "see you office", label: "ham" },
      { text: "free prize win", label: "spam" },
      { text: "win cash prize", label: "spam" },
      { text: "futuretestuniquetoken only here", label: "ham" },
    ];
    const { train, test } = stratifiedSplit(rows, 7, 0.2);
    expect(train.some((row) => row.text.includes("futuretestuniquetoken")) || test.some((row) => row.text.includes("futuretestuniquetoken"))).toBe(true);
    const holdTokenTrain = train.filter((row) => !row.text.includes("futuretestuniquetoken"));
    const model = trainMultinomialNB(holdTokenTrain, 1, { lowercase: true, stripPunctuation: true }, 50);
    expect(model.vocabulary.includes("futuretestuniquetoken")).toBe(false);
    expect(model.priors.spam).toBeCloseTo(holdTokenTrain.filter((r) => r.label === "spam").length / holdTokenTrain.length);
    const pred = predictMultinomialNB("free prize win", model);
    expect(pred.label).toBe("spam");
    const ll = logLikelihood(model, "spam", "prize");
    expect(ll).toBeLessThan(0);
    expect(pred.probabilities.reduce((s, p) => s + p.probability, 0)).toBeCloseTo(1);
    expect(majorityBaseline(["ham", "ham", "spam"])).toBeCloseTo(2 / 3);
    const long = predictMultinomialNB("prize ".repeat(400), model);
    expect(Number.isFinite(long.probability)).toBe(true);
    expect(long.probability).toBeGreaterThan(0);
  });

  it("does not add a test-only token to the training vocabulary", () => {
    const train = [
      { text: "sports team wins game", label: "sports" },
      { text: "player scores goal", label: "sports" },
      { text: "market stocks rally", label: "finance" },
      { text: "bank interest rates", label: "finance" },
    ];
    const model = trainMultinomialNB(train, 1, { lowercase: true }, 80);
    expect(model.vocabulary.includes("futuretestuniquetoken")).toBe(false);
    const pred = predictMultinomialNB("futuretestuniquetoken sports team", model);
    expect(pred.oovIgnored).toContain("futuretestuniquetoken");
    expect(model.vocabulary.includes("futuretestuniquetoken")).toBe(false);
  });
});

describe("embeddings and sentiment", () => {
  it("computes analogy neighbors instead of hardcoding queen", () => {
    expect(getEmbedding("xyzzy")).toBeNull();
    expect(getEmbedding("king")?.length).toBe(8);
    const near = nearestWords("king", 3);
    expect(near[0].cosine).toBeGreaterThan(near.at(-1)!.cosine);
    const analog = analogy("king", "man", "woman");
    expect(analog.neighbors[0].word).toBeTruthy();
  });

  it("flips lexicon polarity after not", () => {
    expect(lexiconSentiment("I like this").score).toBeGreaterThan(lexiconSentiment("I do not like this").score);
    const sarcasm = lexiconSentiment("Great, another crash. Exactly what I needed.");
    expect(sarcasm.weights.find((item) => item.token === "great")?.weight).toBeGreaterThan(0);
    expect(sarcasm.weights.find((item) => item.token === "crash")?.weight).toBeLessThan(0);
    expect(sarcasm.label).toBe("positive");
    expect(lexiconSentiment("This is okay.").label).toBe("neutral");
    expect(lexiconSentiment("This is not bad.").score).toBeGreaterThan(lexiconSentiment("This is bad.").score);
    expect(Math.abs(lexiconSentiment("This is hardly amazing.").score)).toBeLessThan(lexiconSentiment("This is amazing.").score);
    expect(getEmbedding("KING")).toEqual(getEmbedding("king"));
    expect(embeddingCoverage(["king", "xyzzy"]).found).toBe(1);
  });
});

describe("audio stft", () => {
  it("places sine energy near the expected DFT bin", () => {
    const sr = 8000;
    const freq = 440;
    const samples = generateSine(freq, sr, 0.128, 1);
    const n = 256;
    const frame = samples.slice(0, n);
    const mag = dftMagnitude(frame);
    const bin = Math.round((freq * n) / sr);
    const peak = mag.indexOf(Math.max(...mag));
    expect(Math.abs(peak - bin)).toBeLessThanOrEqual(2);
    expect(stft(samples, 64, 32)[0].length).toBe(32);
    expect(softmax([1, 2, 3]).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(isSilent(Array(100).fill(0))).toBe(true);
    expect(stereoToMono([[1, 1], [3, 3]])).toEqual([2, 2]);
    const resampled = resampleLinear(generateSine(440, 44100, 0.05, 1), 44100, 16000);
    expect(resampled.length).toBeGreaterThan(100);
    const scaler = featureScaler([[0, 0], [2, 4]]);
    expect(scaler.apply([0, 0])[0]).toBeCloseTo(-1);
    expect(mfccFromLogSpectrum(Array.from({ length: 40 }, (_, i) => i), 13)).toHaveLength(13);
    const profile = profileTextDataset([
      { text: "hello world", label: "Spam" },
      { text: "hello world", label: "spam" },
    ]);
    expect(profile.exactDuplicates).toBe(1);
    expect(profile.labelCaseConflicts).toBe(1);
  });
});
