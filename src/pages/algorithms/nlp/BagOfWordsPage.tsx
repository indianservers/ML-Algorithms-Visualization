import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, BookOpen, BrainCircuit, MessageSquare, Play, Send } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card, InfoBox } from "../../../components/common/Card";
import { bagOfWordsMatrix, cosineParts, cosineSimilarity, countVector, fitVocabulary, oovStats, sparsity } from "../../../lib/nlp/vectorize";
import { inspectPreprocess, preprocessDocument, type TextPrepOptions } from "../../../lib/nlp/textPrep";
import { nlpCatalog, textsFromTable } from "../../../lib/nlp/nlpDatasets";
import { matrixToLoadedDataset } from "../../../lib/nlp/nlpExport";
import { downloadEmbeddingCsv } from "../../../lib/dimensionality/dimensionalityExport";
import { readLoadedDataset } from "../../../lib/timeSeries/useActiveTimeSeries";
import { LabLessonPanel } from "../../../components/common/LabTabs";
import { TopicQuickQuiz } from "../../../components/common/TopicQuickQuiz";
import { nlpConceptQuestions } from "../../../data/topicQuizQuestions";

const simple = nlpCatalog.find((item) => item.id === "a-simple-sentences")!;
const route = "/ml/nlp/bag-of-words";
const loadedDocuments = () => {
  const loaded = readLoadedDataset(route);
  if (!loaded?.data?.length) return null;
  const rows = textsFromTable(loaded.columns, loaded.data, loaded.target);
  return rows.length ? rows.map((row) => row.text).join("\n") : null;
};
const tabs = ["Learn", "Visualize", "Train", "Inference", "Quick Quiz", "Preprocess", "Vocabulary", "Similarity"] as const;
type Tab = typeof tabs[number];
const tabIcons = { Learn: BookOpen, Visualize: BarChart3, Train: Play, Inference: Send, "Quick Quiz": BrainCircuit };
const inputClass = "w-full rounded border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function BagOfWordsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = tabs.find((item) => (item === "Quick Quiz" ? "quiz" : item.toLowerCase().replace(/\s+/g, "-")) === params.get("tab")) ?? "Learn";
  const setTab = (next: Tab) => {
    const updated = new URLSearchParams(params);
    updated.set("tab", next === "Quick Quiz" ? "quiz" : next.toLowerCase().replace(/\s+/g, "-"));
    setParams(updated, { replace: true });
  };
  const [docsText, setDocsText] = useState(() => loadedDocuments() ?? simple.documents.map((row) => row.text).join("\n"));
  const [datasetId, setDatasetId] = useState(() => loadedDocuments() ? "" : simple.id);
  const [lowercase, setLowercase] = useState(true);
  const [stop, setStop] = useState(false);
  const [binary, setBinary] = useState(false);
  const [stem, setStem] = useState(false);
  const [ngrams, setNgrams] = useState<"1" | "12" | "13">("1");
  const [inspect, setInspect] = useState(0);
  const [termSearch, setTermSearch] = useState("");
  const [minDf, setMinDf] = useState(1);
  const [maxDf, setMaxDf] = useState(0);
  const [maxFeatures, setMaxFeatures] = useState(0);
  const [query, setQuery] = useState("futuretestuniquetoken milk");
  const [cell, setCell] = useState<{ doc: number; term: string; count: number } | null>(null);
  useEffect(() => {
    const onDatasetLoaded = () => {
      const next = loadedDocuments();
      if (next) { setDocsText(next); setDatasetId(""); }
    };
    window.addEventListener("ml:algorithm-dataset-loaded", onDatasetLoaded);
    return () => window.removeEventListener("ml:algorithm-dataset-loaded", onDatasetLoaded);
  }, []);

  const docs = useMemo(() => docsText.split(/\n+/).map((row) => row.trim()).filter(Boolean), [docsText]);
  const options: Partial<TextPrepOptions> = useMemo(() => ({
    lowercase, removeStopwords: stop, stem, ngramMin: 1,
    ngramMax: ngrams === "13" ? 3 : ngrams === "12" ? 2 : 1,
    stripPunctuation: true,
  }), [lowercase, stop, stem, ngrams]);
  const vectorOptions = useMemo(() => ({ ...options, binary, minDf, maxDf: maxDf || undefined, maxFeatures: maxFeatures || undefined }), [options, binary, minDf, maxDf, maxFeatures]);
  const result = useMemo(
    () => bagOfWordsMatrix(docs, vectorOptions),
    [docs, vectorOptions],
  );
  const sparse = sparsity(result.matrix);
  const preview = inspectPreprocess(docs[Math.min(inspect, Math.max(0, docs.length - 1))] ?? "", options);
  const shownTerms = result.vocabulary.filter((term) => term.includes(termSearch.toLowerCase())).slice(0, 40);
  const termTotals = result.vocabulary.map((term, index) => ({
    term, count: result.matrix.reduce((total, row) => total + (row[index] ?? 0), 0),
    df: result.documentFrequency[term], index,
  })).sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
  const queryVec = useMemo(() => {
    const model = fitVocabulary(docs, vectorOptions);
    const features = preprocessDocument(query, options).features;
    return { ...countVector(features, model), stats: oovStats(features, model.vocabulary), features };
  }, [docs, query, options, vectorOptions]);
  const nearest = result.matrix.map((row, index) => ({ index, score: cosineSimilarity(row, queryVec.row) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const exportMatrix = () => {
    const dataset = matrixToLoadedDataset({
      id: "bow-matrix", name: "BoW features",
      history: `BoW · lowercase=${lowercase} · stop=${stop} · binary=${binary} · ngram ${ngrams}`,
      vocabulary: result.vocabulary, matrix: result.matrix,
      sendRoute: "/ml/supervised/logistic-regression",
    });
    downloadEmbeddingCsv("bow-matrix.csv", dataset);
  };

  return <div className="mx-auto max-w-7xl space-y-5 p-4">
    <PageHeader title="Bag of Words" subtitle="Build a vocabulary, inspect count vectors, compare documents, and test unseen text." badge="Beginner" category="NLP" icon={<MessageSquare size={22} />} showAlgorithmIntro={false} showAlgorithmTools={false} />

    <div role="tablist" aria-label="Bag of Words sections" className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 dark:border-gray-700">
      {tabs.map((item) => {
        const Icon = tabIcons[item as keyof typeof tabIcons];
        return <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === item ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-blue-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"}`}>
          {Icon && <Icon size={16} aria-hidden="true" />}{item}
        </button>;
      })}
    </div>

    {tab === "Learn" && <LabLessonPanel tab="Learn" route={route} />}
    {tab === "Quick Quiz" && <TopicQuickQuiz title="Bag of Words" questions={nlpConceptQuestions[route]} />}
    {tab === "Train" && <div role="tabpanel" className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <Card title="Corpus · one document per line">
        <label className="block text-sm">Example dataset
          <select className={`mt-1 ${inputClass}`} value={datasetId} onChange={(event) => {
            const item = nlpCatalog.find((entry) => entry.id === event.target.value);
            if (item) { setDatasetId(item.id); setDocsText(item.documents.map((row) => row.text).join("\n")); setInspect(0); }
          }}>
            <option value="">Custom or imported corpus</option>
            {nlpCatalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <textarea aria-label="Corpus documents" value={docsText} onChange={(event) => { setDocsText(event.target.value); setDatasetId(""); }} rows={12} className={`mt-3 ${inputClass}`} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded border px-3 py-2 text-xs" onClick={() => { setDocsText(simple.documents.map((row) => row.text).join("\n")); setDatasetId(simple.id); }}>Reset corpus</button>
          <button type="button" className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={exportMatrix} disabled={!result.vocabulary.length}>Export numeric matrix CSV</button>
        </div>
      </Card>
      <div className="space-y-4">
        <Card title="Corpus summary"><p className="text-sm">{docs.length} documents · {result.vocabulary.length} vocabulary terms · {sparse.nnz} nonzero cells</p><p className="mt-2 text-xs text-gray-500">Edits update every tab immediately.</p></Card>
        <InfoBox type="warning" title="What BoW cannot do">Bag of Words loses word order except for chosen n-grams. It does not represent meaning, and new terms outside the fitted vocabulary are ignored.</InfoBox>
      </div>
    </div>}

    {tab === "Preprocess" && <div role="tabpanel" className="grid gap-4 lg:grid-cols-2">
      <Card title="Preprocessing controls">
        <div className="space-y-3 text-sm">
          <label className="flex gap-2"><input type="checkbox" checked={lowercase} onChange={(event) => setLowercase(event.target.checked)} /> Lowercase</label>
          <label className="flex gap-2"><input type="checkbox" checked={stop} onChange={(event) => setStop(event.target.checked)} /> Remove English stop words</label>
          <label className="flex gap-2"><input type="checkbox" checked={stem} onChange={(event) => setStem(event.target.checked)} /> Rule stemming (not lemmatization)</label>
          <label className="flex gap-2"><input type="checkbox" checked={binary} onChange={(event) => setBinary(event.target.checked)} /> Binary presence instead of counts</label>
          <label className="block">N-grams<select value={ngrams} onChange={(event) => setNgrams(event.target.value as "1" | "12" | "13")} className={`mt-1 ${inputClass}`}><option value="1">Unigrams</option><option value="12">Unigrams + bigrams</option><option value="13">Unigrams + bigrams + trigrams</option></select></label>
        </div>
      </Card>
      <Card title="Inspect transformation">
        <label className="text-sm">Document
          <select value={Math.min(inspect, Math.max(0, docs.length - 1))} onChange={(event) => setInspect(Number(event.target.value))} className={`mt-1 ${inputClass}`}>
            {docs.map((doc, index) => <option key={index} value={index}>D{index + 1}: {doc.slice(0, 60)}</option>)}
          </select>
        </label>
        <div className="mt-3 space-y-2 break-words text-xs"><p><b>Original:</b> {preview.original}</p><p><b>Lowercase:</b> {preview.lowercase}</p><p><b>Tokens:</b> {preview.tokens.join(", ") || "none"}</p><p><b>After stop words:</b> {preview.afterStopwords.join(", ") || "none"}</p>{stem && <p><b>After stemming:</b> {preview.afterStem.join(", ") || "none"}</p>}<p><b>Final features:</b> {preview.features.join(", ") || "none"}</p>{preview.removedStopwords.length > 0 && <p><b>Removed:</b> {preview.removedStopwords.join(", ")}</p>}</div>
      </Card>
    </div>}

    {tab === "Vocabulary" && <div role="tabpanel" className="grid gap-4 lg:grid-cols-2">
      <Card title="Vocabulary filters">
        <div className="space-y-3 text-sm">
          <label className="block">Minimum document frequency<input type="number" min={1} max={Math.max(1, docs.length)} value={minDf} onChange={(event) => setMinDf(Math.max(1, Number(event.target.value) || 1))} className={`mt-1 ${inputClass}`} /></label>
          <label className="block">Maximum document frequency · 0 means no limit<input type="number" min={0} max={Math.max(0, docs.length)} value={maxDf} onChange={(event) => setMaxDf(Math.max(0, Number(event.target.value) || 0))} className={`mt-1 ${inputClass}`} /></label>
          <label className="block">Maximum vocabulary size · 0 means no limit<input type="number" min={0} value={maxFeatures} onChange={(event) => setMaxFeatures(Math.max(0, Number(event.target.value) || 0))} className={`mt-1 ${inputClass}`} /></label>
          {maxDf > 0 && maxDf < minDf && <p className="text-amber-600">Maximum frequency is below minimum; no terms can pass.</p>}
          <p className="text-xs text-gray-500">Feature limits retain the most frequent terms before sorting the vocabulary alphabetically.</p>
        </div>
      </Card>
      <Card title={`Vocabulary · ${result.vocabulary.length} terms`}>
        <input aria-label="Search vocabulary" value={termSearch} onChange={(event) => setTermSearch(event.target.value)} placeholder="Search terms" className={inputClass} />
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto text-xs">{shownTerms.map((term) => <div key={term} className="flex justify-between rounded bg-blue-50 px-2 py-1 font-mono dark:bg-gray-900"><span>{result.vocabulary.indexOf(term)}: {term}</span><span>df={result.documentFrequency[term]}</span></div>)}{shownTerms.length === 0 && <p>No terms match the current filters.</p>}</div>
      </Card>
      <Card title="Top terms by corpus frequency" className="lg:col-span-2">
        <div className="grid gap-2 sm:grid-cols-2">{termTotals.slice(0, 12).map(({ term, count, df }) => <div key={term} className="text-xs"><div className="flex justify-between"><span className="font-mono">{term}</span><span>count {count} · df {df}</span></div><div className="mt-1 h-2 rounded bg-gray-100 dark:bg-gray-700"><div className="h-2 rounded bg-blue-500" style={{ width: `${termTotals[0]?.count ? (count / termTotals[0].count) * 100 : 0}%` }} /></div></div>)}</div>
      </Card>
    </div>}

    {tab === "Visualize" && <div role="tabpanel" className="space-y-4">
      <Card title="Document-term matrix">
        <p className="mb-2 text-xs text-gray-500">Showing the first 40 vocabulary columns. Search in Vocabulary to inspect other terms.</p>
        <div className="max-h-[60vh] overflow-auto"><table className="min-w-full text-xs"><thead><tr><th className="sticky left-0 bg-white p-2 dark:bg-gray-800">doc</th>{result.vocabulary.slice(0, 40).map((term) => <th key={term} className="p-2 font-mono">{term}</th>)}</tr></thead><tbody>{result.matrix.map((row, index) => <tr key={index}><th className="sticky left-0 border bg-white p-2 dark:bg-gray-800">D{index + 1}</th>{result.vocabulary.slice(0, 40).map((term, termIndex) => <td key={term} className="cursor-pointer border p-2 text-center font-mono hover:bg-blue-100 dark:hover:bg-gray-700" onClick={() => setCell({ doc: index, term, count: row[termIndex] ?? 0 })}>{row[termIndex]}</td>)}</tr>)}</tbody></table></div>
        {cell && <p className="mt-3 text-xs">D{cell.doc + 1} · “{cell.term}” · {binary ? "presence" : "count"} {cell.count}</p>}
      </Card>
      <Card title="Matrix diagnostics"><p className="text-sm">{result.matrix.length} × {result.vocabulary.length} cells · {sparse.nnz} nonzero · {(sparse.sparsity * 100).toFixed(1)}% sparse</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{result.matrix.map((row, index) => <p key={index} className="rounded bg-gray-50 p-2 text-xs dark:bg-gray-900">D{index + 1}: {row.reduce((sum, value) => sum + value, 0)} total counts; {row.filter(Boolean).length} active features</p>)}</div></Card>
    </div>}

    {tab === "Similarity" && <div role="tabpanel" className="space-y-4">
      <Card title="Pairwise cosine similarity">
        <p className="mb-2 text-xs text-gray-500">Cosine 1 means identical count direction; 0 means no shared active terms. Showing up to 20 documents.</p>
        <div className="overflow-auto"><table className="text-xs"><thead><tr><th className="p-2">doc</th>{result.matrix.slice(0, 20).map((_, index) => <th key={index} className="p-2">D{index + 1}</th>)}</tr></thead><tbody>{result.matrix.slice(0, 20).map((row, i) => <tr key={i}><th className="p-2">D{i + 1}</th>{result.matrix.slice(0, 20).map((other, j) => { const value = cosineSimilarity(row, other); return <td key={j} title={`D${i + 1} vs D${j + 1}`} className="border p-2 text-center font-mono" style={{ backgroundColor: `rgba(37,99,235,${value * 0.35})` }}>{value.toFixed(2)}</td>; })}</tr>)}</tbody></table></div>
      </Card>
      {result.matrix.length >= 2 && <Card title="How cosine is calculated for D1 and D2">{(() => { const parts = cosineParts(result.matrix[0], result.matrix[1]); return <p className="text-sm">dot = {parts.dot.toFixed(3)} · ‖D1‖ = {parts.normA.toFixed(3)} · ‖D2‖ = {parts.normB.toFixed(3)} · cosine = {parts.cosine.toFixed(4)}</p>; })()}</Card>}
    </div>}

    {tab === "Inference" && <div role="tabpanel" className="grid gap-4 lg:grid-cols-2">
      <Card title="Transform unseen text"><label className="text-sm">New document<textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={5} className={`mt-1 ${inputClass}`} /></label><p className="mt-3 text-xs">Processed features: {queryVec.features.join(", ") || "none"}</p><p className="mt-2 text-xs">Out-of-vocabulary: {queryVec.stats.oov.join(", ") || "none"} · {(queryVec.stats.rate * 100).toFixed(0)}% of features. The fitted vocabulary is unchanged.</p><p className="mt-2 break-all font-mono text-xs">Vector: [{queryVec.row.join(", ")}]</p></Card>
      <Card title="Nearest corpus documents"><p className="mb-3 text-xs text-gray-500">Ranked by cosine similarity to the new text.</p><div className="space-y-2">{nearest.slice(0, 8).map(({ index, score }) => <div key={index} className="rounded border p-2 text-xs dark:border-gray-700"><div className="flex justify-between font-semibold"><span>D{index + 1}</span><span>{score.toFixed(3)}</span></div><p className="mt-1 text-gray-500">{docs[index]}</p></div>)}{!nearest.length && <p className="text-xs">Add corpus documents first.</p>}</div></Card>
    </div>}
  </div>;
}
