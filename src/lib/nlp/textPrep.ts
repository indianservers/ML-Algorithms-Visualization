export type TokenMode = "word" | "character" | "sentence";

export interface TextPrepOptions {
  lowercase: boolean;
  stripPunctuation: boolean;
  removeStopwords: boolean;
  stem: boolean;
  removeNumbers: boolean;
  tokenMode: TokenMode;
  ngramMin: number;
  ngramMax: number;
}

export const DEFAULT_TEXT_PREP: TextPrepOptions = {
  lowercase: true,
  stripPunctuation: true,
  removeStopwords: false,
  stem: false,
  removeNumbers: false,
  tokenMode: "word",
  ngramMin: 1,
  ngramMax: 1,
};

export const ENGLISH_STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "in", "on", "at", "to", "for", "of", "from",
  "is", "are", "was", "were", "be", "been", "being", "this", "that", "it", "as", "with",
  "by", "do", "does", "did", "we", "you", "i", "they", "he", "she",
]);

export function hasNonLatinScript(text: string) {
  return /[\u0900-\u097F\u0C00-\u0C7F\u0400-\u04FF\u4E00-\u9FFF]/.test(text);
}

export function ruleStem(token: string) {
  if (token.length <= 3) return token;
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("ly") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

export function tokenizeText(text: string, options: Partial<TextPrepOptions> = {}) {
  const opts = { ...DEFAULT_TEXT_PREP, ...options };
  let working = text.normalize("NFC");
  if (opts.lowercase) working = working.toLowerCase();
  if (opts.tokenMode === "character") {
    return [...working].filter((ch) => ch.trim().length > 0);
  }
  if (opts.tokenMode === "sentence") {
    return working
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  const protectedTokens: string[] = [];
  const protect = (pattern: RegExp) => {
    remainder = remainder.replace(pattern, (match) => {
      protectedTokens.push(match);
      return ` prot${protectedTokens.length - 1} `;
    });
  };
  let remainder = working;
  protect(/https?:\/\/\S+/gi);
  protect(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi);
  protect(/\bc\+\+/gi);
  protect(/\bc#/gi);
  protect(/\bnode\.js\b/gi);
  protect(/\d{4}-\d{2}-\d{2}/g);
  protect(/[₹$€£]\s?\d+(?:\.\d+)?/g);
  if (opts.stripPunctuation) remainder = remainder.replace(/[^\p{L}\p{M}\p{N}'\s]/gu, " ");
  const tokens = remainder
    .split(/\s+/)
    .map((token) => token.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .map((token) => {
      const restored = token.match(/^prot(\d+)$/);
      return restored ? protectedTokens[Number(restored[1])] : token;
    })
    .filter((token) => (opts.removeNumbers ? !/^\d+$/.test(token) : true))
    .filter((token) => (opts.removeStopwords ? !ENGLISH_STOPWORDS.has(token.toLowerCase()) : true))
    .map((token) => (opts.stem ? ruleStem(token) : token));
  return tokens;
}

export function ngrams(tokens: string[], min: number, max: number) {
  const out: string[] = [];
  for (let n = min; n <= max; n += 1) {
    if (n === 1) {
      out.push(...tokens);
      continue;
    }
    for (let i = 0; i <= tokens.length - n; i += 1) out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

export function preprocessDocument(text: string, options: Partial<TextPrepOptions> = {}) {
  const opts = { ...DEFAULT_TEXT_PREP, ...options };
  const tokens = tokenizeText(text, opts);
  const features = ngrams(tokens, opts.ngramMin, opts.ngramMax);
  return { tokens, features };
}

export function inspectPreprocess(text: string, options: Partial<TextPrepOptions> = {}) {
  const opts = { ...DEFAULT_TEXT_PREP, ...options };
  const lower = opts.lowercase ? text.normalize("NFC").toLowerCase() : text.normalize("NFC");
  const tokens = tokenizeText(text, { ...opts, removeStopwords: false, stem: false, ngramMin: 1, ngramMax: 1 });
  const stopped = tokenizeText(text, { ...opts, stem: false, ngramMin: 1, ngramMax: 1 });
  const stemmed = tokenizeText(text, { ...opts, ngramMin: 1, ngramMax: 1 });
  const removed = tokens.filter((token) => !stopped.includes(token) && ENGLISH_STOPWORDS.has(token.toLowerCase()));
  return {
    original: text,
    lowercase: lower,
    tokens,
    afterStopwords: stopped,
    afterStem: stemmed,
    removedStopwords: removed,
    features: preprocessDocument(text, opts).features,
  };
}

export function emptyTokensMessage(features: string[]) {
  return features.length ? null : "No usable tokens after preprocessing.";
}
