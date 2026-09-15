import { useMemo, useState } from "react";
import { Network } from "lucide-react";
import { Scatter, ScatterChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card, InfoBox } from "../../../components/common/Card";
import {
  analogy,
  cooccurrenceWindow,
  embeddingCoverage,
  embeddingPcaPoints,
  EMBEDDING_DIM_NAMES,
  EMBEDDING_WORDS,
  getEmbedding,
  nearestWords,
} from "../../../lib/nlp/embeddings";
import { cosineSimilarity } from "../../../lib/nlp/vectorize";
import { tokenizeText } from "../../../lib/nlp/textPrep";
import { nlpCatalog } from "../../../lib/nlp/nlpDatasets";

const words = Object.keys(EMBEDDING_WORDS);

export default function WordEmbeddingConceptPage() {
  const [word, setWord] = useState("king");
  const [query, setQuery] = useState("apple");
  const [custom, setCustom] = useState("");
  const [k, setK] = useState(5);
  const vector = getEmbedding(word);
  const other = getEmbedding(query);
  const neighbors = nearestWords(word, k);
  const analog = analogy("king", "man", "woman");
  const points = useMemo(() => embeddingPcaPoints(), []);
  const corpus = nlpCatalog.find((item) => item.id === "f-relations")!.documents.map((row) => row.text).join(" ");
  const tokens = tokenizeText(corpus, { lowercase: true, stripPunctuation: true });
  const coverage = embeddingCoverage(tokens);
  const idx = tokens.indexOf(word);
  const window = idx >= 0 ? cooccurrenceWindow(tokens, idx, 2) : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader
        title="Word Embedding"
        subtitle="Fixed 8-dimensional educational embedding table (not trained on your corpus). Cosine similarity and PCA of those vectors are computed for real."
        badge="Intermediate"
        category="NLP"
        icon={<Network size={22} />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Vector inspector">
          <label className="text-xs">Word
            <select value={word} onChange={(e) => setWord(e.target.value)} className="mt-1 w-full rounded border px-2 py-1">
              {words.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          {!vector && <p>Word not in current embedding vocabulary.</p>}
          {vector && (
            <table className="mt-2 w-full text-xs">
              <tbody>
                {vector.map((value, i) => (
                  <tr key={i}><td className="font-mono">{EMBEDDING_DIM_NAMES[i]}</td><td className="font-mono text-right">{value.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-2 text-xs">These axes are author-defined educational factors, not discovered latent meanings of a neural model.</p>
        </Card>
        <Card title="Nearest by cosine">
          <label className="text-xs">Top-k
            <select value={k} onChange={(e) => setK(Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
          {neighbors.map((item) => (
            <p key={item.word} className="font-mono text-sm">{item.word} {item.cosine.toFixed(4)}</p>
          ))}
          <label className="mt-3 block text-xs">Compare to
            <select value={query} onChange={(e) => setQuery(e.target.value)} className="mt-1 w-full rounded border px-2 py-1">
              {words.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <p className="text-sm">cos({word},{query}) = {vector && other ? cosineSimilarity(vector, other).toFixed(4) : "n/a"}</p>
          <label className="mt-3 block text-xs">Lookup any string
            <input value={custom} onChange={(e) => setCustom(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 font-mono" />
          </label>
          <p className="text-xs">{getEmbedding(custom) ? `${custom} is in the table.` : "Word not in current embedding vocabulary."}</p>
        </Card>
        <Card title="Analogy king − man + woman">
          <p className="text-xs">Computed vector arithmetic on the table, then nearest remaining word. Not hardcoded to queen.</p>
          {analog.neighbors.map((item) => (
            <p key={item.word} className="font-mono text-sm">{item.word} {item.cosine.toFixed(4)}</p>
          ))}
        </Card>
        <Card title="2D visualization: PCA of 8D embeddings">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="x" type="number" name="PC1" />
              <YAxis dataKey="y" type="number" name="PC2" />
              <Tooltip />
              <Scatter data={points} fill="#2563eb">
                <LabelList dataKey="word" position="top" fontSize={10} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs">Axes are PCA scores of the 8D table, not original semantic dimensions. Coverage on dataset F: {coverage.found}/{coverage.total} tokens ({(coverage.percent * 100).toFixed(0)}%).</p>
        </Card>
        <Card title="Co-occurrence window on dataset F">
          <p className="text-xs">Window=2 around “{word}” in the relationship sentences. Empty if the word is absent.</p>
          {window.map((item) => <span key={item.token + item.distance} className="mr-2 font-mono text-xs">{item.token} (d={item.distance})</span>)}
        </Card>
        <InfoBox type="info" title="OOV">Unknown words do not get a random vector. Same spelling always returns the same table vector. Similarity reflects this educational table, not universal meaning.</InfoBox>
      </div>
    </div>
  );
}
