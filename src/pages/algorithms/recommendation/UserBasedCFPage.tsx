import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, BookOpen, Database, Download, Play, RotateCcw, Send, Users, BrainCircuit } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { TopicQuickQuiz, type QuizQuestion } from '../../../components/common/TopicQuickQuiz';

type Matrix = Array<Array<number | null>>;
type Tab = 'learn' | 'visualize' | 'dataset' | 'train' | 'inference' | 'quiz';
const tabs = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'visualize', label: 'Visualization', icon: BarChart3 },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'train', label: 'Train', icon: Play },
  { id: 'inference', label: 'Live test / inference', icon: Send },
  { id: 'quiz', label: 'Quick Quiz', icon: BrainCircuit },
] as const;
const users = ['Asha', 'Ben', 'Cara', 'Dev', 'Eli'];
const items = ['Linear Algebra', 'KNN', 'Decision Trees', 'SVM', 'Transformers', 'Recommenders'];
const initialRatings: Matrix = [
  [5, 4, null, 2, null, 4],
  [4, 5, 2, null, 1, null],
  [null, 2, 5, 4, 4, null],
  [1, null, 4, 5, 5, 2],
  [4, 4, null, 3, null, 5],
];
const questions: QuizQuestion[] = [
  { prompt: 'What makes two users comparable in this lab?', choices: ['Ratings on items both users rated', 'Their names', 'The number of unrated items'], answer: 0, explanation: 'Cosine similarity uses only co-rated items.' },
  { prompt: 'Which ratings contribute to a missing-item prediction?', choices: ['Every rating in the matrix', 'Ratings for that item from similar users', 'Only the target user\'s known ratings'], answer: 1, explanation: 'Neighbors must have rated the target item, and their ratings are weighted by similarity.' },
  { prompt: 'What happens if no other user provides a positive-similarity rating for an item?', choices: ['The prediction is 5', 'There is no supported prediction', 'The item is automatically disliked'], answer: 1, explanation: 'Without neighbor evidence, the weighted average has no denominator.' },
];

function similarity(a: Array<number | null>, b: Array<number | null>, excludedItem = -1) {
  let dot = 0, normA = 0, normB = 0, common = 0;
  for (let i = 0; i < a.length; i++) {
    if (i === excludedItem || a[i] === null || b[i] === null) continue;
    const av = a[i] as number, bv = b[i] as number;
    dot += av * bv; normA += av * av; normB += bv * bv; common++;
  }
  return { value: normA && normB ? dot / Math.sqrt(normA * normB) : 0, common };
}

function predict(matrix: Matrix, userIndex: number, itemIndex: number, k: number) {
  const neighbors = matrix
    .map((row, index) => ({ index, rating: row[itemIndex], ...similarity(matrix[userIndex], row, itemIndex) }))
    .filter(row => row.index !== userIndex && row.rating !== null && row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, k);
  const numerator = neighbors.reduce((total, row) => total + row.value * (row.rating ?? 0), 0);
  const denominator = neighbors.reduce((total, row) => total + row.value, 0);
  return { score: denominator ? numerator / denominator : null, neighbors, numerator, denominator };
}

export default function UserBasedCFPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab')?.toLowerCase();
  const tab: Tab = tabs.find(item => item.id === requested || (requested === 'visualization' && item.id === 'visualize') || (requested === 'quick-quiz' && item.id === 'quiz'))?.id ?? 'learn';
  const setTab = (next: Tab) => setParams(previous => { const copy = new URLSearchParams(previous); copy.set('tab', next); return copy; });
  const [ratings, setRatings] = useState<Matrix>(initialRatings);
  const [model, setModel] = useState<Matrix | null>(null);
  const [modelVersion, setModelVersion] = useState(0);
  const [activeUser, setActiveUser] = useState(0);
  const [topN, setTopN] = useState(3);
  const [neighborsToUse, setNeighborsToUse] = useState(4);
  const [selectedItem, setSelectedItem] = useState(2);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);
  const dataChanged = model !== null && JSON.stringify(ratings) !== JSON.stringify(model);
  const similarityMatrix = useMemo(() => ratings.map((row, i) => ratings.map((other, j) => i === j ? { value: 1, common: row.filter(x => x !== null).length } : similarity(row, other))), [ratings]);
  const filled = ratings.flat().filter(value => value !== null).length;
  const total = users.length * items.length;
  const currentNeighbors = similarityMatrix[activeUser].map((entry, index) => ({ ...entry, index })).filter(entry => entry.index !== activeUser).sort((a, b) => b.value - a.value);
  const inferenceItems = model?.[activeUser].map((rating, index) => ({ index, rating })).filter(item => item.rating === null) ?? [];
  const testItem = inferenceItems.some(item => item.index === selectedItem) ? selectedItem : inferenceItems[0]?.index;
  const candidates = model ? inferenceItems.map(item => ({ index: item.index, ...predict(model, activeUser, item.index, neighborsToUse) }))
    .filter(item => item.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) : [];
  const inspected = model && testItem !== undefined ? predict(model, activeUser, testItem, neighborsToUse) : null;

  const updateRating = (row: number, col: number, raw: string) => {
    const parsed = raw === '' ? null : Number(raw);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1 || parsed > 5)) return;
    setRatings(current => current.map((line, i) => line.map((value, j) => i === row && j === col ? parsed : value)));
  };
  const resetDataset = () => {
    setRatings(initialRatings.map(row => [...row]));
  };
  const buildModel = () => {
    const snapshot = ratings.map(row => [...row]);
    const pairCount = users.length * (users.length - 1) / 2;
    setTrainingLog([
      `1. Snapshot saved: ${filled} observed ratings across ${users.length} users and ${items.length} items.`,
      `2. Computed cosine similarity for ${pairCount} user pairs using co-rated items.`,
      '3. Neighbor ratings are ready for weighted prediction. No gradient epochs are needed for this memory-based method.',
      'Training completed. Open Live test / inference to rank unrated items.',
    ]);
    setModel(snapshot);
    setModelVersion(version => version + 1);
  };
  const exportModel = () => {
    if (!model) return;
    const payload = { algorithm: 'user-based-collaborative-filtering', method: 'co-rated cosine similarity', version: modelVersion, users, items, ratings: model };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'user-based-cf-model.json'; link.click(); URL.revokeObjectURL(url);
  };
  const userSelector = <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">Target user
    <select aria-label="Target user" value={activeUser} onChange={event => setActiveUser(Number(event.target.value))} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
      {users.map((user, index) => <option key={user} value={index}>{user}</option>)}
    </select>
  </label>;

  return <main className="w-full min-w-0 space-y-5 p-3 pb-20 text-gray-900 dark:text-gray-100 sm:p-5 sm:pb-20">
    <PageHeader title="User Based Collaborative Filtering" subtitle="Find similar learners from co-rated courses, then use their ratings to recommend an unrated course." badge="Intermediate" category="Recommendation" icon={<Users size={22} />} showAlgorithmIntro={false} showAlgorithmTools={false} showDatasetSuggestions={false} />
    <nav role="tablist" aria-label="User based collaborative filtering sections" className="flex w-full gap-2 overflow-x-auto pb-2">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`user-cf-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="user-cf-panel" onClick={() => setTab(id)} className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors sm:flex-1 sm:justify-center ${tab === id ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}><Icon size={17} aria-hidden="true" />{label}</button>)}
    </nav>
    <section id="user-cf-panel" role="tabpanel" aria-labelledby={`user-cf-tab-${tab}`} className="min-w-0">
      {tab === 'learn' && <div className="grid gap-4 lg:grid-cols-2">
        <Card title="The idea, in plain words"><p className="text-sm leading-7">Asha has not rated Decision Trees. Find learners whose ratings agree with hers on courses they both know. Let those learners' Decision Trees ratings vote, with closer neighbors carrying more weight.</p><InfoBox type="info" title="Learning goal">Explain how shared ratings become a similarity score, then use neighbor evidence to justify a recommendation.</InfoBox></Card>
        <Card title="Three steps"><ol className="list-decimal space-y-3 pl-5 text-sm leading-6"><li>Find courses rated by both the target learner and another learner.</li><li>Calculate cosine similarity on those shared ratings.</li><li>For an unrated course, average neighbors' ratings with similarity as the weight.</li></ol></Card>
        <Card title="Prediction formula"><p className="rounded-lg bg-blue-50 p-4 font-mono text-sm text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">predicted rating = Σ(similarity × neighbor rating) / Σ(similarity)</p><p className="mt-3 text-sm leading-6">Only neighbors who rated the target course contribute. Similarity for that prediction excludes the target course, so its rating cannot leak into the comparison.</p></Card>
        <Card title="When to be careful"><ul className="list-disc space-y-2 pl-5 text-sm leading-6"><li>Few shared ratings make similarity less trustworthy.</li><li>A new user or course may have too little evidence to recommend.</li><li>Plain cosine on positive 1–5 ratings can make users with different tastes look similar. Inspect shared counts and neighbor ratings.</li></ul><button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white" onClick={() => setTab('dataset')}>Explore the ratings →</button></Card>
      </div>}
      {tab === 'dataset' && <div className="space-y-4">
        <Card title="Editable user–item ratings" subtitle="A blank cell means the learner has not rated that course. Enter an integer from 1 to 5 or clear a cell.">
          <div className="mb-3 flex flex-wrap items-center gap-3"><span className="text-sm">{filled} of {total} ratings filled · {(filled / total * 100).toFixed(1)}% coverage</span><button type="button" onClick={resetDataset} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-600"><RotateCcw size={15} /> Reset sample</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] border-separate border-spacing-1 text-sm"><thead><tr><th className="p-2 text-left">Learner</th>{items.map(item => <th key={item} className="rounded bg-gray-100 p-2 dark:bg-gray-700">{item}</th>)}</tr></thead><tbody>{users.map((user, row) => <tr key={user}><th className="rounded bg-blue-50 p-2 text-left dark:bg-blue-950/30">{user}</th>{items.map((item, col) => <td key={item} className="rounded border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900"><input aria-label={`${user} rating for ${item}`} type="number" min="1" max="5" step="1" value={ratings[row][col] ?? ''} placeholder="—" onChange={event => updateRating(row, col, event.target.value)} className="h-10 w-full min-w-16 rounded bg-transparent text-center font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></td>)}</tr>)}</tbody></table></div>
        </Card>
        {dataChanged && model && <InfoBox type="warning" title="Dataset changed">Visualization uses these edits now. Rebuild the model in Train to use them for inference.</InfoBox>}
        <Card title="What this dataset represents"><p className="text-sm leading-6">This is a small teaching example with five fictional learners and six course topics. Blank ratings are unknown, not zero or negative feedback. The matrix is kept in this browser session.</p></Card>
      </div>}
      {tab === 'visualize' && <div className="space-y-4">
        <div className="max-w-sm">{userSelector}</div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <Card title="User similarity heatmap" subtitle="Cosine similarity calculated from the current editable ratings. Select a learner above.">
            <div className="overflow-x-auto"><div className="grid min-w-[480px] gap-1" style={{ gridTemplateColumns: `110px repeat(${users.length}, minmax(58px, 1fr))` }}><div />{users.map(name => <span key={name} className="p-2 text-center text-xs font-bold">{name}</span>)}{users.map((name, row) => <div key={name} className="contents"><span className="rounded bg-gray-100 p-3 text-xs font-bold dark:bg-gray-700">{name}</span>{users.map((other, col) => { const cell = similarityMatrix[row][col]; return <div key={other} title={`${name} and ${other}: ${cell.common} shared ratings`} className={`rounded p-2 text-center text-xs font-bold ${row === activeUser || col === activeUser ? 'ring-2 ring-blue-500' : ''}`} style={{ backgroundColor: `rgba(37, 99, 235, ${0.12 + cell.value * .78})`, color: cell.value > .55 ? 'white' : '#1f2937' }}>{cell.value.toFixed(2)}<small className="block font-normal">{cell.common} shared</small></div>; })}</div>)}</div></div>
          </Card>
          <Card title={`Neighbors of ${users[activeUser]}`}><div className="space-y-4">{currentNeighbors.map(entry => <div key={entry.index}><div className="flex justify-between gap-2 text-sm"><strong>{users[entry.index]}</strong><span>{(entry.value * 100).toFixed(1)}% · {entry.common} shared</span></div><div className="mt-1 h-3 rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-3 rounded-full bg-blue-600" style={{ width: `${entry.value * 100}%` }} /></div></div>)}</div><p className="mt-5 text-xs text-gray-600 dark:text-gray-300">A high bar with only one shared rating is weaker evidence than one supported by several shared ratings.</p></Card>
        </div>
      </div>}
      {tab === 'train' && <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Build neighbor model"><p className="text-sm leading-6">This is a memory-based recommender: training saves the current rating matrix and makes user similarities available for predictions. It does not optimize weights over epochs.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={buildModel} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"><Play size={16} />{model ? 'Rebuild model' : 'Build model'}</button><button onClick={exportModel} disabled={!model} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold disabled:opacity-50 dark:border-gray-600"><Download size={16} />Export model JSON</button></div><p className="mt-3 text-sm">{model ? `Model version ${modelVersion} ready` : 'No model built yet'}{dataChanged && model ? ' · Dataset edits are not in this model yet.' : ''}</p></Card>
        <Card title="Training log"><ol aria-live="polite" className="space-y-2 text-sm leading-6">{trainingLog.length ? trainingLog.map(line => <li key={line} className="rounded bg-gray-50 p-2 dark:bg-gray-900">{line}</li>) : <li className="text-gray-500">Build the model to see each preparation step.</li>}</ol></Card>
        <Card title="Data readiness"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30"><strong className="block text-2xl">{filled}</strong>Known ratings</div><div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30"><strong className="block text-2xl">{(filled / total * 100).toFixed(1)}%</strong>Matrix coverage</div></div><p className="mt-3 text-sm">Sparse data can leave some items without usable neighbors.</p></Card>
        <Card title="Next step"><p className="text-sm">After building, open inference to inspect ranked items, contributing neighbors, and the weighted-average calculation.</p><button onClick={() => setTab('inference')} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Open inference →</button></Card>
      </div>}
      {tab === 'inference' && <div className="space-y-4">
        {!model ? <Card title="Build the model first"><p className="text-sm">The inference tab uses a saved rating snapshot. Build the model from the Dataset tab's current matrix to get recommendations.</p><button onClick={() => setTab('train')} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Go to Train →</button></Card> : <>
          {dataChanged && <InfoBox type="warning" title="Model uses an earlier snapshot">Dataset edits are visible in Dataset and Visualization. Rebuild in Train to include them in inference.</InfoBox>}
          <div className="grid gap-3 sm:grid-cols-3">{userSelector}<label className="flex flex-col gap-1 text-sm font-semibold">Neighbors per prediction: {neighborsToUse}<input aria-label="Neighbors per prediction" type="range" min="1" max="4" value={neighborsToUse} onChange={event => setNeighborsToUse(Number(event.target.value))} className="mt-3 accent-blue-600" /></label><label className="flex flex-col gap-1 text-sm font-semibold">Top recommendations: {topN}<input aria-label="Top recommendations" type="range" min="1" max="5" value={topN} onChange={event => setTopN(Number(event.target.value))} className="mt-3 accent-blue-600" /></label></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={`Recommendations for ${users[activeUser]}`}><div className="space-y-2">{candidates.slice(0, topN).map((entry, rank) => <button type="button" onClick={() => setSelectedItem(entry.index)} key={entry.index} className="flex w-full justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left text-sm dark:border-emerald-900 dark:bg-emerald-950/30"><span>{rank + 1}. {items[entry.index]}<small className="block">{entry.neighbors.length} contributing neighbors</small></span><strong>{entry.score?.toFixed(2)} / 5</strong></button>)}{!candidates.length && <p className="text-sm text-gray-600 dark:text-gray-300">No unrated item has neighbor evidence. Add ratings in Dataset and rebuild.</p>}</div></Card>
            <Card title="Test an unrated item"><label className="block text-sm font-semibold">Item<select aria-label="Unrated item" disabled={!inferenceItems.length} value={testItem ?? ''} onChange={event => setSelectedItem(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-900">{inferenceItems.map(entry => <option key={entry.index} value={entry.index}>{items[entry.index]}</option>)}</select></label>{inspected ? <><p className="mt-4 text-sm">Predicted rating: <strong>{inspected.score === null ? 'No supported prediction' : `${inspected.score.toFixed(2)} / 5`}</strong></p><p className="mt-2 text-sm">Weighted sum {inspected.numerator.toFixed(2)} ÷ similarity sum {inspected.denominator.toFixed(2)}{inspected.denominator ? ` = ${inspected.score?.toFixed(2)}` : ' (undefined without neighbors)'}</p><div className="mt-4 space-y-2">{inspected.neighbors.map(entry => <div key={entry.index} className="rounded bg-gray-50 p-2 text-sm dark:bg-gray-900">{users[entry.index]} rated {entry.rating}/5 · similarity {(entry.value * 100).toFixed(1)}% · {entry.common} shared courses</div>)}</div></> : <p className="mt-3 text-sm">This learner has rated every item.</p>}</Card>
          </div>
        </>}
      </div>}
      {tab === 'quiz' && <TopicQuickQuiz title="User Based Collaborative Filtering" questions={questions} />}
    </section>
  </main>;
}
