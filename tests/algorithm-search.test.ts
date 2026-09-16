import { describe, expect, it } from "vitest";
import {
  normalizeText,
  scoreDocument,
  searchDocuments,
  tokenizeQuery,
  type SearchDocument,
} from "../src/lib/search/matchAlgorithms";
import {
  algorithmSearchIndex,
  searchAlgorithms,
  searchAlgorithmsByCategory,
} from "../src/lib/search/algorithmSearchIndex";

const routesFor = (query: string, options?: Parameters<typeof searchAlgorithms>[1]) =>
  searchAlgorithms(query, options).map((entry) => entry.route);

const labelsFor = (query: string) => searchAlgorithms(query).map((entry) => entry.label);

describe("normalizeText", () => {
  it("lowercases, strips diacritics and collapses separators", () => {
    expect(normalizeText("Naïve Bayes")).toBe("naive bayes");
    expect(normalizeText("t-SNE")).toBe("t sne");
    expect(normalizeText("  TF-IDF  ")).toBe("tf idf");
  });

  it("tokenizes queries and treats blank input as no tokens", () => {
    expect(tokenizeQuery("decision   tree!")).toEqual(["decision", "tree"]);
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("searchDocuments", () => {
  const documents: SearchDocument[] = [
    { name: "Alpha", tags: ["shared"] },
    { name: "Beta", tags: ["shared"] },
    { name: "Gamma", tags: ["shared"] },
  ];

  it("returns everything in the original order for an empty query", () => {
    expect(searchDocuments(documents, "   ", (doc) => doc).map((hit) => hit.item.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("keeps the original order when scores tie", () => {
    expect(searchDocuments(documents, "shared", (doc) => doc).map((hit) => hit.item.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("requires every token to match somewhere", () => {
    const doc: SearchDocument = { name: "Random Forest", tags: ["ensemble"] };
    expect(scoreDocument(doc, "random ensemble")).toBeGreaterThan(0);
    expect(scoreDocument(doc, "random unicorn")).toBe(0);
  });

  it("ranks a name match above a category match above a tag match", () => {
    const nameHit: SearchDocument = { name: "Boosting" };
    const categoryHit: SearchDocument = { name: "Stacking", category: "Boosting" };
    const tagHit: SearchDocument = { name: "Bagging", tags: ["boosting"] };
    const descriptionHit: SearchDocument = { name: "Voting", description: "uses boosting inside" };

    expect(scoreDocument(nameHit, "boosting")).toBeGreaterThan(scoreDocument(categoryHit, "boosting"));
    expect(scoreDocument(categoryHit, "boosting")).toBeGreaterThan(scoreDocument(tagHit, "boosting"));
    expect(scoreDocument(tagHit, "boosting")).toBeGreaterThan(scoreDocument(descriptionHit, "boosting"));
  });

  it("tolerates a single-character typo without outranking exact matches", () => {
    const exact: SearchDocument = { name: "Clustering" };
    expect(scoreDocument(exact, "clusteing")).toBeGreaterThan(0);
    expect(scoreDocument({ name: "Regression" }, "clusteing")).toBe(0);
    expect(scoreDocument(exact, "clustering")).toBeGreaterThan(scoreDocument(exact, "clusteing"));
  });

  it("does not fuzzy-match short tokens", () => {
    expect(scoreDocument({ name: "K-Medoids", aliases: ["pam"] }, "spam")).toBe(0);
    expect(scoreDocument({ name: "LDA" }, "lda")).toBeGreaterThan(0);
  });
});

describe("searchAlgorithms", () => {
  it("returns the whole catalogue in navigation order for an empty query", () => {
    expect(searchAlgorithms("")).toHaveLength(algorithmSearchIndex.length);
    expect(routesFor("  ")[0]).toBe(algorithmSearchIndex[0].route);
  });

  it("finds an exact name and puts it first", () => {
    expect(labelsFor("DBSCAN")[0]).toBe("DBSCAN");
    expect(labelsFor("hierarchical clustering")[0]).toBe("Hierarchical Clustering");
  });

  it("resolves acronyms and abbreviations", () => {
    expect(routesFor("svm")[0]).toBe("/ml/supervised/svm-classification");
    expect(routesFor("pca")[0]).toBe("/ml/dimensionality-reduction/pca");
    expect(routesFor("knn")[0]).toBe("/ml/supervised/knn-classification");
    expect(routesFor("tsne")[0]).toBe("/ml/dimensionality-reduction/tsne");
    expect(routesFor("gmm")[0]).toBe("/ml/clustering/gaussian-mixture-model");
  });

  it("resolves expanded forms back to the abbreviated label", () => {
    expect(routesFor("support vector machine")[0]).toBe("/ml/supervised/svm-classification");
    expect(routesFor("principal component analysis")[0]).toBe("/ml/dimensionality-reduction/pca");
    expect(routesFor("k nearest neighbours")[0]).toBe("/ml/supervised/knn-classification");
  });

  it("applies AND semantics across multiple tokens", () => {
    const decisionTree = routesFor("decision tree");
    expect(decisionTree).toContain("/ml/supervised/decision-tree-classification");
    expect(decisionTree).toContain("/ml/supervised/decision-tree-regression");
    expect(decisionTree).not.toContain("/ml/supervised/random-forest-classification");

    const treeRegression = routesFor("tree regression");
    expect(treeRegression[0]).toBe("/ml/supervised/decision-tree-regression");
    expect(treeRegression).not.toContain("/ml/supervised/decision-tree-classification");
  });

  it("matches topical tags that never appear in a label", () => {
    expect(routesFor("spam")).toContain("/ml/nlp/naive-bayes-spam");
    expect(routesFor("image")).toContain("/ml/computer-vision/image-classification");
    expect(routesFor("forecasting")).toContain("/ml/time-series/arima-concept");
    expect(routesFor("dimensionality")).toContain("/ml/dimensionality-reduction/pca");
    expect(routesFor("ensemble")).toContain("/ml/supervised/random-forest-classification");
    expect(routesFor("probabilistic")).toContain("/ml/supervised/naive-bayes");
  });

  it("matches difficulty words", () => {
    const beginner = searchAlgorithms("beginner");
    expect(beginner.length).toBeGreaterThan(5);
    expect(beginner.every((entry) => entry.level === "Beginner")).toBe(true);
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(searchAlgorithms("qwertyuiop")).toEqual([]);
    expect(searchAlgorithms("svm unicorn")).toEqual([]);
  });

  it("composes the text query with the level filter", () => {
    const advancedTrees = searchAlgorithms("tree", { level: "Advanced" });
    expect(advancedTrees.every((entry) => entry.level === "Advanced")).toBe(true);
    expect(advancedTrees.map((entry) => entry.route)).not.toContain(
      "/ml/supervised/decision-tree-classification",
    );

    const beginnerTrees = searchAlgorithms("tree", { level: "Beginner" });
    expect(beginnerTrees.map((entry) => entry.route)).toContain(
      "/ml/supervised/decision-tree-classification",
    );
  });

  it("honours a category restriction", () => {
    const clusteringOnly = searchAlgorithms("k", { categories: ["Clustering"] });
    expect(clusteringOnly.every((entry) => entry.category === "Clustering")).toBe(true);
  });

  it("keeps navigation order when grouping without a query", () => {
    const groups = searchAlgorithmsByCategory("");
    expect(groups.map((group) => group.category).slice(0, 3)).toEqual([
      "Supervised - Regression",
      "Supervised - Classification",
      "Clustering",
    ]);
  });

  it("leads with the strongest category when grouping a query", () => {
    expect(searchAlgorithmsByCategory("shap")[0].category).toBe("Explainability");
    expect(searchAlgorithmsByCategory("spam")[0].category).toBe("NLP");
  });

  it("gives every catalogue entry searchable metadata", () => {
    expect(algorithmSearchIndex.every((entry) => entry.description.length > 0)).toBe(true);
    expect(algorithmSearchIndex.every((entry) => entry.tags.length > 0)).toBe(true);
    const withoutSynonyms = algorithmSearchIndex.filter((entry) => entry.synonyms.length === 0);
    expect(withoutSynonyms).toEqual([]);
  });
});
