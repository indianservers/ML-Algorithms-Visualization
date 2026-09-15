import { hasNonLatinScript, tokenizeText } from "./textPrep";

export const LEXICON: Record<string, number> = {
  good: 1,
  great: 1.2,
  amazing: 1.4,
  love: 1.3,
  happy: 1,
  excellent: 1.3,
  like: 0.8,
  fantastic: 1.4,
  okay: 0.1,
  ok: 0.1,
  bad: -1.1,
  terrible: -1.4,
  hate: -1.3,
  awful: -1.3,
  poor: -0.8,
  crash: -0.9,
  not: 0,
};

const INTENSIFIERS = new Set(["very", "extremely", "absolutely"]);
const DOWNTONERS = new Set(["hardly", "barely", "slightly"]);

export function lexiconSentiment(text: string) {
  const tokens = tokenizeText(text, { lowercase: true, stripPunctuation: true, removeStopwords: false, stem: false });
  const weights = tokens.map((token, i) => {
    const base = LEXICON[token] ?? 0;
    const prev = tokens[i - 1];
    const prev2 = tokens[i - 2];
    const negated = prev === "not" || prev2 === "not";
    let scale = negated ? -1 : 1;
    if (INTENSIFIERS.has(prev) && base !== 0) scale *= 1.5;
    if (DOWNTONERS.has(prev) && base !== 0) scale *= 0.35;
    return { token, weight: base * scale, negated, intensified: INTENSIFIERS.has(prev) };
  });
  const score = weights.reduce((s, item) => s + item.weight, 0);
  const lexiconHits = weights.filter((item) => LEXICON[item.token] !== undefined && item.token !== "not").length;
  const label = score > 0.25 ? "positive" : score < -0.25 ? "negative" : "neutral";
  return {
    score,
    label,
    weights,
    tokens,
    method: "lexicon" as const,
    lexiconHits,
    nonLatin: hasNonLatinScript(text),
    note: "Sentiment Score is a lexicon sum (not a calibrated probability). Neutral is |score| ≤ 0.25.",
  };
}
