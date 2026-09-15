export interface NlpDocument {
  text: string;
  label?: string;
}

export interface NlpCatalogItem {
  id: string;
  name: string;
  description: string;
  documents: NlpDocument[];
}

export const nlpCatalog: NlpCatalogItem[] = [
  {
    id: "a-simple-sentences",
    name: "A — Simple topic sentences",
    description: "Sports, technology, finance, food.",
    documents: [
      { text: "The team scored two goals in the final minute of the match.", label: "sports" },
      { text: "The new smartphone has a faster processor and more memory.", label: "technology" },
      { text: "Investors sold shares after the bank missed earnings.", label: "finance" },
      { text: "The chef roasted vegetables with olive oil and garlic.", label: "food" },
      { text: "A tennis player won the championship in straight sets.", label: "sports" },
      { text: "Cloud computing reduced the cost of storing large datasets.", label: "technology" },
    ],
  },
  {
    id: "b-binary",
    name: "B — Sports vs technology",
    description: "Small binary classification corpus.",
    documents: [
      { text: "The basketball team practiced free throws.", label: "sports" },
      { text: "Software engineers shipped a machine learning model.", label: "technology" },
      { text: "The coach substituted the striker.", label: "sports" },
      { text: "The laptop battery lasted twelve hours.", label: "technology" },
      { text: "Fans filled the stadium after the penalty.", label: "sports" },
      { text: "Open source libraries speed up neural network training.", label: "technology" },
      { text: "The referee added extra time.", label: "sports" },
      { text: "A compiler warning blocked the release.", label: "technology" },
    ],
  },
  {
    id: "c-news",
    name: "C — Multiclass news-like",
    description: "Technology, business, sports, health.",
    documents: [
      { text: "Chipmakers announced a smaller transistor design.", label: "technology" },
      { text: "The company reported record quarterly revenue.", label: "business" },
      { text: "The marathon winner broke the course record.", label: "sports" },
      { text: "Doctors recommended a vaccine booster this season.", label: "health" },
      { text: "A new operating system update improved security.", label: "technology" },
      { text: "Retail sales rose after holiday discounts.", label: "business" },
      { text: "The baseball pitcher threw a complete game.", label: "sports" },
      { text: "Hospitals reduced waiting times in emergency rooms.", label: "health" },
    ],
  },
  {
    id: "d-sentiment",
    name: "D — Sentiment",
    description: "Positive, negative, neutral reviews.",
    documents: [
      { text: "I love this product and the delivery was fast.", label: "positive" },
      { text: "This is terrible quality and I hate it.", label: "negative" },
      { text: "The package arrived on Tuesday.", label: "neutral" },
      { text: "Amazing battery life and excellent screen.", label: "positive" },
      { text: "Awful customer service and a bad smell.", label: "negative" },
      { text: "It costs forty dollars.", label: "neutral" },
      { text: "Great value and I like the design.", label: "positive" },
      { text: "Poor stitching and the zipper broke.", label: "negative" },
    ],
  },
  {
    id: "e-spam",
    name: "E — Spam / ham",
    description: "Short messages with prize spam vs meeting ham.",
    documents: [
      { text: "Can we meet at 4 pm?", label: "ham" },
      { text: "Congratulations! You won a free prize. Click now.", label: "spam" },
      { text: "Are you free for lunch tomorrow?", label: "ham" },
      { text: "WIN a free vacation. Claim your prize today.", label: "spam" },
      { text: "Please send the report before Friday.", label: "ham" },
      { text: "Urgent: you have won cash. Click the link now.", label: "spam" },
      { text: "See you at the office at 10.", label: "ham" },
      { text: "Limited offer: free prize waiting. Act now.", label: "spam" },
    ],
  },
  {
    id: "f-relations",
    name: "F — Word relationships",
    description: "Short sentences using embedding demo vocabulary.",
    documents: [
      { text: "The king and the queen ruled the land.", label: "royal" },
      { text: "A man and a woman walked to the market.", label: "people" },
      { text: "An apple and an orange sat in the bowl.", label: "fruit" },
      { text: "The cat and the dog slept on the sofa.", label: "pets" },
      { text: "A car and a truck waited at the light.", label: "vehicles" },
    ],
  },
  {
    id: "g-oov",
    name: "G — Out-of-vocabulary",
    description: "Contains invented tokens for leakage tests.",
    documents: [
      { text: "Regular training text about cats and dogs.", label: "trainish" },
      { text: "futuretestuniquetoken appears only here.", label: "holdout" },
    ],
  },
  {
    id: "h-negation",
    name: "H — Negation",
    description: "Polarity flips for sentiment checks.",
    documents: [
      { text: "I like this", label: "positive" },
      { text: "I do not like this", label: "negative" },
      { text: "This is good", label: "positive" },
      { text: "This is not good", label: "negative" },
      { text: "Not bad", label: "positive" },
      { text: "Not good", label: "negative" },
    ],
  },
  {
    id: "i-case",
    name: "I — Punctuation and case",
    description: "GOOD!!! vs good vs Good?",
    documents: [
      { text: "GOOD!!!", label: "shout" },
      { text: "good", label: "plain" },
      { text: "Good?", label: "question" },
    ],
  },
];

export function nlpCatalogTables() {
  return nlpCatalog.map((item) => ({
    id: `nlp-${item.id}`,
    name: item.name,
    description: item.description,
    type: "nlp" as const,
    columns: item.documents.some((row) => row.label) ? ["text", "label"] : ["text"],
    data: item.documents.map((row) => ({ text: row.text, label: row.label })),
  }));
}

export function audioCatalogTables() {
  return [
    {
      id: "j-audio-tones",
      name: "J — Synthetic labelled tones",
      description: "Browser-safe generated PCM: 440 Hz, 880 Hz, and noise. Not recorded speech or music files.",
      type: "nlp" as const,
      columns: ["clip_id", "class", "sample_rate", "seconds"],
      data: [
        { clip_id: "tone_a", class: "440Hz", sample_rate: 8000, seconds: 0.25 },
        { clip_id: "tone_b", class: "880Hz", sample_rate: 8000, seconds: 0.25 },
        { clip_id: "noise", class: "noise", sample_rate: 8000, seconds: 0.25 },
      ],
    },
  ];
}

export function textsFromTable(columns: string[], data: Record<string, unknown>[], target?: string) {
  const textCol =
    columns.find((column) => /^(text|review|message|document|content|body)$/i.test(column)) ??
    columns.find((column) =>
      data.some((row) => typeof row[column] === "string" && String(row[column]).split(/\s+/).length >= 3),
    );
  const labelCol =
    target ??
    columns.find((column) => /^(label|sentiment|class|spam|ham|topic)$/i.test(column));
  if (!textCol) return [];
  return data
    .map((row) => ({
      text: String(row[textCol] ?? ""),
      label: labelCol ? String(row[labelCol] ?? "") : undefined,
    }))
    .filter((row) => row.text.trim());
}

export function profileTextDataset(documents: NlpDocument[]) {
  const lengths = documents.map((row) => row.text.trim().split(/\s+/).filter(Boolean).length);
  const empty = documents.filter((row) => !row.text.trim()).length;
  const labels = documents.map((row) => row.label).filter(Boolean) as string[];
  const classCounts: Record<string, number> = {};
  labels.forEach((label) => {
    classCounts[label] = (classCounts[label] ?? 0) + 1;
  });
  const tokens = documents.flatMap((row) => row.text.toLowerCase().split(/\s+/).filter(Boolean));
  const unique = new Set(tokens);
  const freq = new Map<string, number>();
  tokens.forEach((token) => freq.set(token, (freq.get(token) ?? 0) + 1));
  const hapax = [...freq.values()].filter((n) => n === 1).length;
  const exactDuplicates = documents.length - new Set(documents.map((row) => row.text.trim())).size;
  const labelKeys = [...new Set(labels)];
  const caseCollapsed = new Set(labelKeys.map((label) => label.toLowerCase()));
  const labelCaseConflicts = labelKeys.length - caseCollapsed.size;
  const histogram = [0, 0, 0, 0, 0];
  lengths.forEach((n) => {
    if (n <= 5) histogram[0] += 1;
    else if (n <= 15) histogram[1] += 1;
    else if (n <= 40) histogram[2] += 1;
    else if (n <= 100) histogram[3] += 1;
    else histogram[4] += 1;
  });
  const sorted = [...lengths].sort((a, b) => a - b);
  return {
    documents: documents.length,
    empty,
    averageTokens: lengths.reduce((s, n) => s + n, 0) / Math.max(lengths.length, 1),
    medianTokens: sorted[Math.floor(sorted.length / 2)] ?? 0,
    minTokens: sorted[0] ?? 0,
    maxTokens: sorted.at(-1) ?? 0,
    uniqueTokens: unique.size,
    hapax,
    exactDuplicates,
    labelCaseConflicts,
    lengthHistogram: histogram,
    classCounts,
    topTokens: [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    warnings: [
      empty ? `${empty} empty documents.` : "",
      labels.length && Math.min(...Object.values(classCounts)) / labels.length < 0.1
        ? `One class contains only ${(100 * Math.min(...Object.values(classCounts)) / labels.length).toFixed(0)}% of samples.`
        : "",
      unique.size > documents.length * 8
        ? "Vocabulary is very large relative to document count."
        : "",
      hapax ? `Dataset contains ${hapax} unique tokens appearing only once.` : "",
      exactDuplicates ? `${exactDuplicates} exact duplicate documents.` : "",
      labelCaseConflicts ? `${labelCaseConflicts} label(s) differ only by case (Spam vs spam). Not merged.` : "",
    ].filter(Boolean),
  };
}
