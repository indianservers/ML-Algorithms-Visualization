import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Play, RotateCcw, Send } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card, InfoBox } from "../../../components/common/Card";
import { MetricsPanel } from "../../../components/ml/MetricsPanel";
import { nlpCatalog, textsFromTable } from "../../../lib/nlp/nlpDatasets";
import {
  classificationMetrics,
  logLikelihoodRatio,
  majorityBaseline,
  predictMultinomialNB,
  stratifiedSplit,
  tokenClassCounts,
  trainMultinomialNB,
} from "../../../lib/nlp/naiveBayesText";
import { lexiconSentiment } from "../../../lib/nlp/lexiconSentiment";
import { bagOfWordsMatrix, cosineSimilarity, oovStats, tfidfMatrix } from "../../../lib/nlp/vectorize";
import { inspectPreprocess, preprocessDocument, type TextPrepOptions } from "../../../lib/nlp/textPrep";
import { useActiveLoadedDataset } from "../../../lib/timeSeries/useActiveTimeSeries";

type Mode = "sentiment" | "text" | "spam";
type Row = { text: string; label: string };

const copy = {
  sentiment: {
    title: "Sentiment Analysis",
    subtitle: "Two methods: a transparent lexicon Sentiment Score (not a probability), plus multinomial Naive Bayes trained on labels. Vocabulary is fitted on training documents only.",
    catalogId: "d-sentiment",
    sample: "I like this product.",
  },
  text: {
    title: "Text Classification",
    subtitle: "Multinomial Naive Bayes on news-like classes. Train vocabulary never sees the test fold.",
    catalogId: "c-news",
    sample: "Chipmakers announced a smaller transistor.",
  },
  spam: {
    title: "Naive Bayes Spam Classifier",
    subtitle: "Multinomial Naive Bayes with Laplace smoothing and log-space posteriors. Threshold changes the decision, not the model.",
    catalogId: "e-spam",
    sample: "Congratulations! You won a free prize. Click now.",
  },
} satisfies Record<Mode, { title: string; subtitle: string; catalogId: string; sample: string }>;

function starter(mode: Mode): Row[] {
  return nlpCatalog.find((item) => item.id === copy[mode].catalogId)!.documents.map((row) => ({
    text: row.text,
    label: row.label ?? "unknown",
  }));
}

export default function NLPClassificationLab({ mode }: { mode: Mode }) {
  const meta = copy[mode];
  const route = mode === "spam" ? "/ml/nlp/naive-bayes-spam" : mode === "sentiment" ? "/ml/nlp/sentiment-analysis" : "/ml/nlp/text-classification";
  const starterRows = useMemo(() => starter(mode), [mode]);
  const [rows, setRows] = useState<Row[]>(starterRows);
  const [fittedRows, setFittedRows] = useState<Row[]>(starterRows);
  const [alpha, setAlpha] = useState(1);
  const [fittedAlpha, setFittedAlpha] = useState(1);
  const [maxVocab, setMaxVocab] = useState(80);
  const [fittedMaxVocab, setFittedMaxVocab] = useState(80);
  const [input, setInput] = useState(meta.sample);
  const [threshold, setThreshold] = useState(0.5);
  const [stop, setStop] = useState(false);
  const [ngramMax, setNgramMax] = useState(1);
  const [fittedPrep, setFittedPrep] = useState<Partial<TextPrepOptions>>({ lowercase: true, stripPunctuation: true, removeStopwords: false, ngramMin: 1, ngramMax: 1 });
  const [inspectToken, setInspectToken] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(true);
  const [status, setStatus] = useState<"NOT BUILT" | "TRAINED" | "STALE">("TRAINED");
  const [seed] = useState(7);
  const handoff = useActiveLoadedDataset(route);
  useEffect(() => {
    setRows(starterRows);
    setFittedRows(starterRows);
    setInput(meta.sample);
    setStatus("TRAINED");
  }, [mode, starterRows, meta.sample]);
  useEffect(() => {
    if (!handoff?.data?.length) return;
    const docs = textsFromTable(handoff.columns, handoff.data, handoff.target)
      .filter((row) => row.label)
      .map((row) => ({ text: row.text, label: row.label! }));
    if (!docs.length) return;
    setRows(docs);
    setFittedRows(docs);
    setStatus("TRAINED");
  }, [handoff]);
  const { train, test } = useMemo(() => stratifiedSplit(fittedRows, seed, 0.3), [fittedRows, seed]);
  const model = useMemo(() => trainMultinomialNB(train, fittedAlpha, fittedPrep, fittedMaxVocab), [train, fittedAlpha, fittedMaxVocab, fittedPrep]);
  const predictions = test.map((row) => predictMultinomialNB(row.text, model));
  const predictedLabels = predictions.map((item, i) => {
    if (mode !== "spam") return item.label;
    const spamProb = item.probabilities.find((p) => p.label === "spam")?.probability ?? 0;
    return spamProb >= threshold ? "spam" : "ham";
  });
  const report = classificationMetrics(test.map((row) => row.label), predictedLabels);
  const custom = predictMultinomialNB(input, model);
  const lex = mode === "sentiment" ? lexiconSentiment(input) : null;
  const inspect = inspectPreprocess(input, fittedPrep);
  const inferFeatures = preprocessDocument(input, fittedPrep).features;
  const oov = oovStats(inferFeatures, model.vocabulary);
  const leakage = model.vocabulary.includes("futuretestuniquetoken");
  const baseline = majorityBaseline(test.map((row) => row.label));
  const tokenInfo = inspectToken ? tokenClassCounts(model, inspectToken.toLowerCase()) : null;
  const spamHam = mode === "spam" && model.labels.includes("spam") && model.labels.includes("ham");
  const llrRanked = spamHam
    ? inferFeatures
        .filter((token, i, arr) => arr.indexOf(token) === i && model.vocabulary.includes(token))
        .map((token) => ({ token, llr: logLikelihoodRatio(model, token, "spam", "ham") }))
        .sort((a, b) => Math.abs(b.llr) - Math.abs(a.llr))
    : [];
  const compare = useMemo(() => {
    const texts = train.map((row) => row.text);
    const bow = bagOfWordsMatrix(texts, fittedPrep);
    const tfidf = tfidfMatrix(texts, fittedPrep);
    return {
      bowDims: bow.vocabulary.length,
      tfidfDims: tfidf.model.vocabulary.length,
      sameDocSim: bow.matrix.length > 1 ? cosineSimilarity(bow.matrix[0], bow.matrix[1]) : 0,
    };
  }, [train, fittedPrep]);
  const explorer = test.map((row, i) => ({
    ...row,
    predicted: predictedLabels[i],
    probability: predictions[i]?.probability ?? 0,
  }));
  const shownRows = errorsOnly ? explorer.filter((row) => row.predicted !== row.label) : explorer;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title={meta.title} subtitle={meta.subtitle} badge="Intermediate" category="NLP" icon={<MessageSquare size={22} />} />
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <div className="space-y-4">
          <Card title="Labeled corpus">
            <select
              className="mb-2 w-full rounded border px-2 py-1 text-sm"
              onChange={(event) => {
                const item = nlpCatalog.find((entry) => entry.id === event.target.value);
                if (!item) return;
                const next = item.documents.filter((row) => row.label).map((row) => ({ text: row.text, label: row.label! }));
                setRows(next);
                setFittedRows(next);
                setStatus("TRAINED");
              }}
              defaultValue={meta.catalogId}
            >
              {nlpCatalog.filter((item) => item.documents.some((row) => row.label)).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <textarea
              value={rows.map((row) => `${row.label}\t${row.text}`).join("\n")}
              onChange={(event) => {
                const next = event.target.value.split(/\n/).map((line) => {
                  const [label, ...rest] = line.split("\t");
                  return { label: label?.trim() ?? "", text: rest.join("\t").trim() };
                }).filter((row) => row.label && row.text);
                setRows(next);
                setStatus("STALE");
              }}
              rows={8}
              className="w-full rounded border p-2 font-mono text-xs"
            />
            <p className="text-xs text-gray-500">State: {status}. Train {train.length} / test {test.length}. Vocab fitted on train only (token futuretestuniquetoken in vocab? {leakage ? "yes — leakage" : "no"}). Majority-class baseline on test: {(baseline * 100).toFixed(0)}%. Ham/spam counts: {fittedRows.filter((r) => r.label === "ham").length}/{fittedRows.filter((r) => r.label === "spam").length}.</p>
            <button type="button" className="mt-2 inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs text-white" onClick={() => { setFittedRows(rows); setFittedAlpha(alpha); setFittedMaxVocab(maxVocab); setFittedPrep({ lowercase: true, stripPunctuation: true, removeStopwords: stop, ngramMin: 1, ngramMax }); setStatus("TRAINED"); }}><Play size={12} /> Train</button>
            <button type="button" className="ml-2 inline-flex items-center gap-1 rounded border px-3 py-2 text-xs" onClick={() => { setRows(starterRows); setFittedRows(starterRows); setAlpha(1); setFittedAlpha(1); setMaxVocab(80); setFittedMaxVocab(80); setStop(false); setNgramMax(1); setFittedPrep({ lowercase: true, stripPunctuation: true, removeStopwords: false, ngramMin: 1, ngramMax: 1 }); setInput(meta.sample); setStatus("TRAINED"); }}><RotateCcw size={12} /> Reset</button>
          </Card>
          <Card title="Model">
            <label className="block text-xs">Laplace α {alpha.toFixed(1)}<input type="range" min={0.1} max={3} step={0.1} value={alpha} onChange={(e) => { setAlpha(Number(e.target.value)); setStatus("STALE"); }} className="w-full" /></label>
            <label className="block text-xs">Max vocab {maxVocab}<input type="range" min={10} max={200} step={10} value={maxVocab} onChange={(e) => { setMaxVocab(Number(e.target.value)); setStatus("STALE"); }} className="w-full" /></label>
            <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={stop} onChange={(e) => { setStop(e.target.checked); setStatus("STALE"); }} /> Remove English stop words (retrain to apply)</label>
            <label className="block text-xs">N-grams
              <select value={ngramMax} onChange={(e) => { setNgramMax(Number(e.target.value)); setStatus("STALE"); }} className="mt-1 w-full rounded border px-2 py-1">
                <option value={1}>Unigrams</option>
                <option value={2}>Unigrams + bigrams</option>
                <option value={3}>Unigrams + bigrams + trigrams</option>
              </select>
            </label>
            {mode === "spam" && (
              <label className="block text-xs">Spam threshold {threshold.toFixed(2)} (does not retrain)<input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full" /></label>
            )}
          </Card>
          <MetricsPanel title="Held-out metrics" metrics={[
            { label: "Accuracy", value: report.accuracy, format: "percent", color: "green" },
            { label: "Macro F1", value: report.macroF1, format: "percent", color: "blue" },
            { label: "Weighted F1", value: report.weightedF1, format: "percent" },
            { label: "Vocab", value: model.vocabulary.length, format: "number" },
          ]} />
          <Card title="Try text">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} className="w-full rounded border p-2 text-sm" />
            <div className="mt-2 flex items-center gap-2 text-sm"><Send size={14} /> NB: <b>{custom.label}</b> ({(custom.probability * 100).toFixed(1)}% posterior over known classes)</div>
            {lex && (
              <div className="text-xs">
                <p>Lexicon Sentiment Score {lex.score.toFixed(2)} → {lex.label} (neutral if |score| ≤ 0.25). Not a probability. {lex.nonLatin ? "Non-Latin script detected; English lexicon coverage will be poor." : ""}</p>
                <p>{lex.note}</p>
              </div>
            )}
            <p className="text-xs">Inference uses the fitted tokenizer. OOV {oov.oovCount}/{oov.total} tokens ({(oov.rate * 100).toFixed(0)}%). Tokens: {inspect.tokens.join(", ") || "No usable tokens after preprocessing."}</p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Class probabilities (Naive Bayes)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={custom.probabilities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="probability">{custom.probabilities.map((_, i) => <Cell key={i} fill={["#2563eb", "#059669", "#dc2626"][i % 3]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs">log prior {custom.probabilities.map((p) => `${p.label}=${p.logPrior.toFixed(2)}`).join(" · ")}</p>
          </Card>
          <Card title="Confusion matrix (test)">
            <table className="text-xs">
              <thead><tr><th />{report.labels.map((label) => <th key={label} className="p-1">{label}</th>)}</tr></thead>
              <tbody>
                {report.matrix.map((row, i) => (
                  <tr key={report.labels[i]}><th className="p-1 text-left">{report.labels[i]}</th>{row.map((v, j) => <td key={j} className="border p-1 text-center font-mono">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Token log-likelihood contributions (not raw counts)">
            {custom.contributions.length === 0 ? <p className="text-sm">No in-vocabulary tokens. OOV ignored: {custom.oovIgnored.join(", ") || "none"}</p> : (
              <table className="w-full text-xs">
                <thead><tr><th className="p-1 text-left">token</th>{model.labels.map((label) => <th key={label}>{label}</th>)}</tr></thead>
                <tbody>
                  {custom.contributions.map((row) => (
                    <tr key={row.token}><td className="font-mono p-1">{row.token}</td>{model.labels.map((label) => <td key={label} className="font-mono p-1">{row.values[label].toFixed(2)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            )}
            {llrRanked.length > 0 && (
              <p className="mt-2 text-xs">Log-likelihood ratio spam−ham: {llrRanked.slice(0, 8).map((item) => `${item.token} ${item.llr.toFixed(2)}`).join(" · ")}</p>
            )}
            <label className="mt-2 block text-xs">Inspect token counts
              <input value={inspectToken} onChange={(e) => setInspectToken(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 font-mono" />
            </label>
            {tokenInfo && inspectToken && (
              <p className="text-xs">{Object.entries(tokenInfo).map(([label, info]) => `${label}: count ${info.count}, smoothed P=${info.smoothed.toExponential(2)}`).join(" · ")}</p>
            )}
          </Card>
          <Card title="Test explorer">
            <label className="text-xs"><input type="checkbox" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} /> Errors only</label>
            {shownRows.map((row) => (
              <p key={row.text} className="mb-2 rounded border border-red-200 p-2 text-xs">{row.text}<br />actual {row.label} → {row.predicted} ({(row.probability * 100).toFixed(0)}%)</p>
            ))}
            {shownRows.length === 0 && <p className="text-xs">No rows match this filter on the current split.</p>}
          </Card>
          <Card title="Same-train BoW vs TF-IDF sizes">
            <p className="text-xs">Same tokenizer/n-grams as the fitted NB model. BoW dims {compare.bowDims} · TF-IDF dims {compare.tfidfDims} · cosine(D1,D2) on BoW {compare.sameDocSim.toFixed(3)}. Feature-count comparison, not a ranking of all NLP methods.</p>
          </Card>
          <InfoBox type="warning" title="Limitations">Naive Bayes assumes token independence given the class. Softmax/posterior mass over known classes is not certainty that the text belongs to those classes. Lexicon sentiment fails on sarcasm. English tokenizer/lexicon only.</InfoBox>
        </div>
      </div>
    </div>
  );
}
