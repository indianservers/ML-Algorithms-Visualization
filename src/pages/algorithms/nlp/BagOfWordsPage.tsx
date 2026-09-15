import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card, InfoBox } from "../../../components/common/Card";
import { bagOfWordsMatrix, cosineParts, countVector, fitVocabulary, oovStats, sparsity } from "../../../lib/nlp/vectorize";
import { inspectPreprocess, preprocessDocument, type TextPrepOptions } from "../../../lib/nlp/textPrep";
import { nlpCatalog, textsFromTable } from "../../../lib/nlp/nlpDatasets";
import { matrixToLoadedDataset } from "../../../lib/nlp/nlpExport";
import { downloadEmbeddingCsv } from "../../../lib/dimensionality/dimensionalityExport";
import { useActiveLoadedDataset } from "../../../lib/timeSeries/useActiveTimeSeries";

const simple = nlpCatalog.find((item) => item.id === "a-simple-sentences")!;

export default function BagOfWordsPage() {
  const [docsText, setDocsText] = useState(simple.documents.map((row) => row.text).join("\n"));
  const [lowercase, setLowercase] = useState(true);
  const [stop, setStop] = useState(false);
  const [binary, setBinary] = useState(false);
  const [stem, setStem] = useState(false);
  const [ngrams, setNgrams] = useState<"1" | "12" | "13">("1");
  const [inspect, setInspect] = useState(0);
  const [termSearch, setTermSearch] = useState("");
  const [minDf, setMinDf] = useState(1);
  const [query, setQuery] = useState("futuretestuniquetoken milk");
  const [cell, setCell] = useState<{ doc: number; term: string; count: number } | null>(null);
  const handoff = useActiveLoadedDataset("/ml/nlp/bag-of-words");
  useEffect(() => {
    if (!handoff?.data?.length) return;
    const rows = textsFromTable(handoff.columns, handoff.data, handoff.target);
    if (rows.length) setDocsText(rows.map((row) => row.text).join("\n"));
  }, [handoff]);
  const options: Partial<TextPrepOptions> = {
    lowercase,
    removeStopwords: stop,
    stem,
    ngramMin: 1,
    ngramMax: ngrams === "13" ? 3 : ngrams === "12" ? 2 : 1,
    stripPunctuation: true,
  };
  const docs = docsText.split(/\n+/).map((row) => row.trim()).filter(Boolean);
  const result = useMemo(
    () => bagOfWordsMatrix(docs, { ...options, binary, minDf }),
    [docsText, lowercase, stop, binary, stem, ngrams, minDf],
  );
  const sparse = sparsity(result.matrix);
  const sim = result.matrix.length >= 2 ? cosineParts(result.matrix[0], result.matrix[1]) : null;
  const queryVec = useMemo(() => {
    const model = fitVocabulary(docs, { ...options, binary, minDf });
    const features = preprocessDocument(query, options).features;
    return { ...countVector(features, model), stats: oovStats(features, model.vocabulary) };
  }, [docsText, query, lowercase, stop, binary, stem, ngrams, minDf]);
  const previewVocab = result.vocabulary
    .filter((term) => !termSearch || term.includes(termSearch.toLowerCase()))
    .slice(0, 24);
  const preview = inspectPreprocess(docs[inspect] ?? "", options);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader
        title="Bag of Words"
        subtitle="Count vectorization: lowercase, tokenize, optional stop-words and n-grams, then a document-term matrix. Word order is ignored except through n-grams."
        badge="Beginner"
        category="NLP"
        icon={<MessageSquare size={22} />}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card title="Corpus (one document per line)">
          <select
            className="mb-2 w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
            onChange={(event) => {
              const item = nlpCatalog.find((entry) => entry.id === event.target.value);
              if (item) setDocsText(item.documents.map((row) => row.text).join("\n"));
            }}
            defaultValue="a-simple-sentences"
          >
            {nlpCatalog.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <textarea value={docsText} onChange={(e) => setDocsText(e.target.value)} rows={10} className="w-full rounded border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
          <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={lowercase} onChange={(e) => setLowercase(e.target.checked)} /> Lowercase</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> Remove English stop words</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={stem} onChange={(e) => setStem(e.target.checked)} /> Rule stemming (not lemmatization)</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={binary} onChange={(e) => setBinary(e.target.checked)} /> Binary presence/absence</label>
          <label className="mt-2 block text-xs">N-grams
            <select value={ngrams} onChange={(e) => setNgrams(e.target.value as "1" | "12" | "13")} className="mt-1 w-full rounded border px-2 py-1">
              <option value="1">Unigrams</option>
              <option value="12">Unigrams + bigrams</option>
              <option value="13">Unigrams + bigrams + trigrams</option>
            </select>
          </label>
          <label className="mt-2 block text-xs">Min document frequency {minDf}
            <input type="range" min={1} max={3} value={minDf} onChange={(e) => setMinDf(Number(e.target.value))} className="w-full" />
          </label>
          <button type="button" className="mt-2 rounded border px-3 py-1 text-xs" onClick={() => setDocsText(simple.documents.map((row) => row.text).join("\n"))}>Reset corpus</button>
          <button
            type="button"
            className="mt-3 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => {
              const dataset = matrixToLoadedDataset({
                id: "bow-matrix",
                name: "BoW features",
                history: `BoW · lowercase=${lowercase} · stop=${stop} · binary=${binary} · ngram ${ngrams}`,
                vocabulary: result.vocabulary,
                matrix: result.matrix,
                sendRoute: "/ml/supervised/logistic-regression",
              });
              downloadEmbeddingCsv("bow-matrix.csv", dataset);
            }}
          >
            Export / send numeric BoW to logistic regression
          </button>
        </Card>
        <div className="space-y-4">
          <Card title="Preprocessing inspector">
            <input type="range" min={0} max={Math.max(0, docs.length - 1)} value={inspect} onChange={(e) => setInspect(Number(e.target.value))} className="w-full" />
            <p className="text-xs">Original: {preview.original}</p>
            <p className="text-xs">Lowercase: {preview.lowercase}</p>
            <p className="text-xs">Tokens: [{preview.tokens.join(", ")}]</p>
            <p className="text-xs">After stop-words: [{preview.afterStopwords.join(", ")}]</p>
            {stem && <p className="text-xs">After stemming: [{preview.afterStem.join(", ")}]</p>}
            {preview.removedStopwords.length > 0 && <p className="text-xs">Removed: {preview.removedStopwords.join(", ")}</p>}
            {preview.features.length === 0 && <p className="text-xs text-amber-700">No usable tokens after preprocessing.</p>}
          </Card>
          <Card title={`Vocabulary (${result.vocabulary.length} terms, showing ${previewVocab.length})`}>
            <input value={termSearch} onChange={(e) => setTermSearch(e.target.value)} placeholder="Search term" className="mb-2 w-full rounded border px-2 py-1 text-xs" />
            <div className="flex flex-wrap gap-2">
              {previewVocab.map((term, i) => (
                <span key={term} className="rounded bg-blue-50 px-2 py-1 text-xs font-mono">{i}: {term} df={result.documentFrequency[term]}</span>
              ))}
            </div>
          </Card>
          <Card title="Document-term matrix (first matching 24 columns)">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead><tr><th className="p-2">doc</th>{previewVocab.map((term) => <th key={term} className="p-2 font-mono">{term}</th>)}</tr></thead>
                <tbody>
                  {result.matrix.map((row, i) => (
                    <tr key={i}>
                      <th className="border p-2">D{i + 1}</th>
                      {previewVocab.map((term) => {
                        const j = result.vocabulary.indexOf(term);
                        return (
                          <td
                            key={term}
                            className="cursor-pointer border p-2 text-center font-mono"
                            onClick={() => setCell({ doc: i, term, count: row[j] ?? 0 })}
                          >
                            {row[j]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cell && <p className="mt-2 text-xs">Document D{cell.doc + 1} · term {cell.term} · count {cell.count}</p>}
            <p className="mt-2 text-xs">Sparsity {((sparse.sparsity) * 100).toFixed(1)}% ({sparse.nnz} nonzero / {sparse.total} cells).</p>
            {sim && <p className="mt-2 text-xs">Cosine(D1,D2) = {sim.cosine.toFixed(4)} · dot {sim.dot.toFixed(3)} · ‖D1‖ {sim.normA.toFixed(3)} · ‖D2‖ {sim.normB.toFixed(3)}</p>}
            <label className="mt-2 block text-xs">Transform new text with fitted vocabulary
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 font-mono" />
            </label>
            <p className="text-xs">OOV {queryVec.stats.oov.join(", ") || "none"} · rate {(queryVec.stats.rate * 100).toFixed(0)}%. Vocabulary is not rebuilt.</p>
          </Card>
          <InfoBox type="warning" title="What BoW cannot do">Bag of words ignores order except through n-grams. It does not encode meaning. Unknown tokens in a new document are ignored (OOV).</InfoBox>
        </div>
      </div>
    </div>
  );
}
