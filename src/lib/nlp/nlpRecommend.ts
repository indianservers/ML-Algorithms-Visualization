export const NLP_ALGORITHMS = [
  { route: "/ml/nlp/bag-of-words", label: "Bag of Words", needsLabels: false, spam: false, audio: false },
  { route: "/ml/nlp/tf-idf", label: "TF-IDF", needsLabels: false, spam: false, audio: false },
  { route: "/ml/nlp/text-classification", label: "Text Classification", needsLabels: true, spam: false, audio: false },
  { route: "/ml/nlp/word-embedding-concept", label: "Word Embedding", needsLabels: false, spam: false, audio: false },
  { route: "/ml/nlp/sentiment-analysis", label: "Sentiment Analysis", needsLabels: true, spam: false, audio: false },
  { route: "/ml/nlp/naive-bayes-spam", label: "Naive Bayes Spam", needsLabels: true, spam: true, audio: false },
  { route: "/ml/nlp/audio-classification", label: "Audio Classification", needsLabels: false, spam: false, audio: true },
] as const;

export function recommendNlpAlgorithms(profile: { hasText: boolean; hasLabels: boolean; labels: string[]; audio?: boolean }) {
  return NLP_ALGORITHMS.filter((item) => (profile.audio ? item.audio : !item.audio)).map((item) => {
    let rank: "Highly recommended" | "Recommended" | "Limited" = "Recommended";
    const why: string[] = [];
    if (profile.audio) {
      rank = item.audio ? "Highly recommended" : "Limited";
      why.push(item.audio ? "Audio clips should go to the audio classifier, not text vectorizers." : "Text algorithm; skip for clip metadata.");
    } else if (!profile.hasText && !item.audio) {
      rank = "Limited";
      why.push("Needs a text column.");
    } else if (item.needsLabels && !profile.hasLabels) {
      rank = "Limited";
      why.push("Needs class labels.");
    } else if (item.spam && !profile.labels.some((label) => /spam|ham/i.test(label))) {
      rank = "Recommended";
      why.push("Works on any binary/multiclass text; spam/ham labels are the intended demo.");
    } else {
      rank = "Highly recommended";
      why.push("Compatible with the current text schema.");
    }
    return { ...item, rank, why };
  });
}
