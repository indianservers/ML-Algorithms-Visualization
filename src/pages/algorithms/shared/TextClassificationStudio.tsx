import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChartNoAxesColumnIncreasing, Cpu, Database, MessageSquare, Play, RotateCcw, Send, Trash2 } from 'lucide-react';
import { LabLessonPanel, useUrlTab } from '../../../components/common/LabTabs';
import { TopicQuickQuiz } from '../../../components/common/TopicQuickQuiz';
import { classifierQuestions } from '../../../data/topicQuizQuestions';
import { nlpCatalog, textsFromTable } from '../../../lib/nlp/nlpDatasets';
import { classificationMetrics, predictMultinomialNB, stratifiedSplit, tokenClassCounts, trainMultinomialNB } from '../../../lib/nlp/naiveBayesText';
import { inspectPreprocess, preprocessDocument } from '../../../lib/nlp/textPrep';
import { parseCSV, type ParsedDataset } from '../../../lib/preprocessing/datasetIO';
import { useActiveLoadedDataset } from '../../../lib/timeSeries/useActiveTimeSeries';
import { classColor, validateExamples, type TextExample } from './textClassificationWorkspace';
import './TextClassificationStudio.css';

const route = '/ml/nlp/text-classification';
const demo = nlpCatalog.find(d => d.id === 'c-news')!;
const demoRows = () => demo.documents.map(d => ({ text: d.text, label: d.label! }));
const defaults = { alpha: 1, vocab: 80, stop: false, grams: 1, ratio: .3, seed: 7 };
type Settings = typeof defaults;
const prepFor = (s: Settings) => ({ lowercase: true, stripPunctuation: true, removeStopwords: s.stop, ngramMin: 1, ngramMax: s.grams });
function fit(rows: TextExample[], settings: Settings) { const split = stratifiedSplit(rows, settings.seed, settings.ratio); return { ...split, model: trainMultinomialNB(split.train, settings.alpha, prepFor(settings), settings.vocab) }; }
type Result = ReturnType<typeof predictMultinomialNB>;

export default function TextClassificationStudio() {
  const [tab, setTab] = useUrlTab<'learn' | 'visualize' | 'train' | 'inference' | 'quiz'>('learn');
  const [rows, setRows] = useState<TextExample[]>(demoRows);
  const [settings, setSettings] = useState(defaults);
  const [snapshot, setSnapshot] = useState(() => ({ rows: demoRows(), settings: defaults, ...fit(demoRows(), defaults) }));
  const [trained, setTrained] = useState(false);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [message, setMessage] = useState('Demo model loaded. Train your own model when ready.');
  const [input, setInput] = useState('Chipmakers announced a smaller transistor.');
  const [testedText, setTestedText] = useState(input);
  const [previous, setPrevious] = useState<{ text: string; result: Result } | null>(null);
  const [token, setToken] = useState('');
  const [newText, setNewText] = useState('');
  const [newLabel, setNewLabel] = useState('technology');
  const [classDraft, setClassDraft] = useState('');
  const [extraClasses, setExtraClasses] = useState<string[]>([]);
  const [rename, setRename] = useState('');
  const [selectedClass, setSelectedClass] = useState('technology');
  const [datasetId, setDatasetId] = useState(demo.id);
  const [csv, setCsv] = useState<ParsedDataset | null>(null);
  const [textColumn, setTextColumn] = useState('');
  const [labelColumn, setLabelColumn] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [cell, setCell] = useState<{ actual: string; predicted: string } | null>(null);
  const handoff = useActiveLoadedDataset(route);
  useEffect(() => { if (tab === 'inference') setTab('train'); }, [tab, setTab]);
  useEffect(() => { if (handoff?.data?.length) { setRows(textsFromTable(handoff.columns, handoff.data, handoff.target).map(d => ({ text: d.text, label: d.label ?? '' }))); setMessage('Imported examples. Review and train to apply them.'); } }, [handoff]);
  const prep = prepFor(settings);
  const validation = validateExamples(rows, prep);
  const labels = [...new Set([...rows.map(r => r.label).filter(Boolean), ...extraClasses])].sort();
  const dirty = JSON.stringify(rows) !== JSON.stringify(snapshot.rows) || JSON.stringify(settings) !== JSON.stringify(snapshot.settings);
  const result = useMemo(() => predictMultinomialNB(testedText, snapshot.model), [testedText, snapshot.model]);
  const ranked = [...result.probabilities].sort((a, b) => b.probability - a.probability);
  const known = result.tokens.length > 0;
  const runner = ranked[1];
  const inspection = inspectPreprocess(input, prep);
  const fittedTokens = preprocessDocument(testedText, snapshot.model.options);
  const testResults = snapshot.test.map(r => ({ ...r, result: predictMultinomialNB(r.text, snapshot.model) }));
  const report = classificationMetrics(testResults.map(r => r.label), testResults.map(r => r.result.label));
  const majority = [...snapshot.model.labels].sort((a, b) => snapshot.model.priors[b] - snapshot.model.priors[a])[0];
  const baseline = snapshot.test.filter(r => r.label === majority).length / Math.max(1, snapshot.test.length);
  const shown = testResults.filter(r => (!errorsOnly || r.label !== r.result.label) && (!cell || r.label === cell.actual && r.result.label === cell.predicted));
  const evidence = [...new Set(result.tokens)].map(word => ({ word, value: result.contributions.filter(c => c.token === word).reduce((n, c) => n + c.values[result.label] - (runner ? c.values[runner.label] : c.values[result.label]), 0) })).sort((a,b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 12);
  const maxEvidence = Math.max(1, ...evidence.map(e => Math.abs(e.value)));
  const tokenInfo = token && snapshot.model.vocabulary.includes(token) ? tokenClassCounts(snapshot.model, token) : null;
  const updateSettings = (patch: Partial<Settings>) => setSettings(s => ({ ...s, ...patch }));
  const reset = () => { setRows(demoRows()); setSettings(defaults); setSnapshot({ rows: demoRows(), settings: defaults, ...fit(demoRows(), defaults) }); setTrained(false); setExtraClasses([]); setDatasetId(demo.id); setPrevious(null); setCell(null); setSteps([]); setMessage('Demo restored.'); };
  async function train() {
    if (validation.errors.length || busy) return;
    setBusy(true); setSteps([]);
    const trainingRows = rows.map(r => ({ text: r.text.trim(), label: r.label.trim() }));
    const pause = () => new Promise<void>(resolve => setTimeout(resolve, 0));
    try {
      trainingRows.forEach(r => preprocessDocument(r.text, prep)); setSteps(['Tokenized examples']); await pause();
      const fitted = fit(trainingRows, settings); setSteps(s => [...s, `Built vocabulary: ${fitted.model.vocabulary.length} words`, `Counted words in ${fitted.train.length} training examples`]); await pause();
      const predictions = fitted.test.map(r => predictMultinomialNB(r.text, fitted.model));
      const accuracy = classificationMetrics(fitted.test.map(r => r.label), predictions.map(r => r.label)).accuracy;
      setSteps(s => [...s, `Evaluated ${fitted.test.length} held-out examples`]);
      setSnapshot({ rows: trainingRows, settings: { ...settings }, ...fitted }); setRows(trainingRows); setTrained(true); setPrevious(null); setCell(null); setToken('');
      setMessage(`Trained on ${fitted.train.length} examples • ${fitted.model.vocabulary.length} learned words • ${(accuracy * 100).toFixed(0)}% test accuracy on ${fitted.test.length} examples.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Training failed. Check your examples.'); } finally { setBusy(false); }
  }
  function classify(text = input) { setPrevious({ text: testedText, result }); setInput(text); setTestedText(text); setToken(''); }
  const candidate = nlpCatalog.find(d => d.id === datasetId)!;
  const previewRows = csv ? csv.data.slice(0, 3).map(r => ({ text: String(r[textColumn] ?? ''), label: String(r[labelColumn] ?? '') })) : [];
  return <div className="text-studio" data-training-feedback="inline">
    <header className="text-heading"><MessageSquare size={22}/><h1>Text Classification</h1><span>NLP Studio</span></header>
    <nav className="text-tabs" aria-label="Text classification sections">{[{ id:'learn', label:'Learn', icon:BookOpen },{ id:'visualize', label:'Visualize', icon:ChartNoAxesColumnIncreasing },{ id:'train', label:'Train and Test', icon:Cpu },{ id:'quiz', label:'Quiz', icon:BookOpen }].map(t => <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id as typeof tab)}><t.icon size={18}/>{t.label}</button>)}</nav>
    {tab === 'learn' ? <LabLessonPanel tab="Learn" route={route}/> : tab === 'quiz' ? <TopicQuickQuiz title="Text Classification" questions={classifierQuestions.text}/> : <>
      <ol className="text-flow"><li><Database size={16}/> 1. Prepare examples</li><li><Cpu size={16}/> 2. Train model</li><li><Send size={16}/> 3. Test text</li></ol>
      <div className="text-toolbar"><span className={`text-status ${dirty ? 'pending' : ''}`}>{busy ? 'Training' : dirty ? 'Changes pending' : trained ? 'Trained by you' : 'Demo model loaded'}</span><button onClick={() => { reset(); setTab('train'); }}>Quick Start</button><button onClick={reset}><RotateCcw size={15}/> Restore demo</button></div>
      <p role="status" className="text-notice">{message}{dirty && ' Tests still use the previous model. Train to apply changes.'}</p>
      <div className="text-workbench">
        <div className="text-preparation">
          <details className="text-card" id="text-examples"><summary>Prepare examples <span>{rows.length} sentences · {labels.length} classes</span></summary>
            <label>Example dataset<select value={datasetId} onChange={e => setDatasetId(e.target.value)}>{nlpCatalog.filter(d => d.documents.some(r => r.label)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><p>{candidate.description}</p><blockquote>{candidate.documents[0].text} — {candidate.documents[0].label}</blockquote><button onClick={() => { setRows(candidate.documents.filter(d => d.label).map(d => ({text:d.text,label:d.label!}))); setExtraClasses([]); }}>Use this dataset</button>
            <div className="text-distribution" aria-label="Class distribution">{Object.entries(validation.counts).map(([label,count]) => <div key={label}><span style={{color:classColor(label)}}>{label} · {count}</span><div className="text-bar-track"><span style={{width:`${count / Math.max(1,rows.length) * 100}%`,background:classColor(label)}}/></div></div>)}</div>
            <div className="text-add"><label>New sentence<textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Write an example sentence"/></label><label>Class<select value={newLabel} onChange={e => setNewLabel(e.target.value)}><option value="">Choose class</option>{labels.map(l => <option key={l}>{l}</option>)}</select></label><button disabled={!newText.trim() || !labels.includes(newLabel)} onClick={() => { setRows([...rows,{text:newText.trim(),label:newLabel}]); setNewText(''); }}>Add example</button></div>
            <details><summary>Manage classes</summary><label>New class<input value={classDraft} onChange={e => setClassDraft(e.target.value)}/></label><button disabled={!classDraft.trim()} onClick={() => { const name=classDraft.trim(); setExtraClasses([...extraClasses,name]); setNewLabel(name); setClassDraft(''); }}>Create class</button><label>Choose class<select aria-label="Choose class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}><option value="">Choose class</option>{labels.map(l => <option key={l}>{l}</option>)}</select></label><label>Rename to<input value={rename} onChange={e => setRename(e.target.value)}/></label><button disabled={!labels.includes(selectedClass) || !rename.trim() || labels.includes(rename.trim())} onClick={() => { const next=rename.trim(); setRows(rows.map(r => r.label===selectedClass?{...r,label:next}:r)); setExtraClasses(extraClasses.map(l => l===selectedClass?next:l)); setNewLabel(next); setSelectedClass(next); setRename(''); }}>Rename class</button><button disabled={!labels.includes(selectedClass)} onClick={() => { setRows(rows.filter(r => r.label!==selectedClass)); setExtraClasses(extraClasses.filter(l => l!==selectedClass)); }}>Remove class and its examples</button></details>
            <details><summary>Edit {rows.length} examples</summary><div className="text-example-list">{rows.map((r,i) => <div className="text-example" key={i}><textarea aria-label={`Example ${i+1} text`} value={r.text} onChange={e => setRows(rows.map((v,j) => j===i?{...v,text:e.target.value}:v))}/><select aria-label={`Example ${i+1} class`} value={r.label} onChange={e => setRows(rows.map((v,j) => j===i?{...v,label:e.target.value}:v))}><option value="">Choose class</option>{labels.map(l => <option key={l}>{l}</option>)}</select><button aria-label={`Delete example ${i+1}`} onClick={() => setRows(rows.filter((_,j) => j!==i))}><Trash2 size={16}/></button></div>)}</div></details>
            <details><summary>Import CSV</summary><label>Upload CSV<input type="file" accept=".csv,text/csv" onChange={async e => { const file=e.target.files?.[0]; if(!file)return; try {const parsed=parseCSV(await file.text()); if(!parsed.data.length)throw Error('CSV needs a header and at least one example.'); setCsv(parsed);setTextColumn(parsed.columns[0]);setLabelColumn(parsed.columns[1]??parsed.columns[0]);} catch(err){setMessage(err instanceof Error?err.message:'Could not read CSV.');} }}/></label>{csv && <><label>Text column<select value={textColumn} onChange={e=>setTextColumn(e.target.value)}>{csv.columns.map(c=><option key={c}>{c}</option>)}</select></label><label>Class column<select value={labelColumn} onChange={e=>setLabelColumn(e.target.value)}>{csv.columns.map(c=><option key={c}>{c}</option>)}</select></label><p>{csv.data.length} examples · preview</p>{previewRows.map((r,i)=><blockquote key={i}>{r.text || '(empty)'} — {r.label || '(missing class)'}</blockquote>)}<button disabled={textColumn===labelColumn} onClick={()=>{setRows(csv.data.map(r=>({text:String(r[textColumn]??''),label:String(r[labelColumn]??'')})));setExtraClasses([]);setCsv(null);}}>Use imported examples</button></>}</details>
            <button onClick={() => {setRows([]);setExtraClasses([]);}}>Clear my examples</button>
          </details>
          <details className="text-card"><summary>Model settings <span>Advanced</span></summary>
            <label>Smoothing · {settings.alpha.toFixed(1)}<input type="range" min="0.1" max="3" step="0.1" value={settings.alpha} onChange={e=>updateSettings({alpha:+e.target.value})}/></label><p>Gives unseen words a small count so they do not rule out a class.</p>
            <label>Maximum learned words<input type="number" min="10" max="5000" value={settings.vocab} onChange={e=>updateSettings({vocab:Math.max(10,Math.min(5000,+e.target.value||10))})}/></label>
            <label className="text-check"><input type="checkbox" checked={settings.stop} onChange={e=>updateSettings({stop:e.target.checked})}/> Remove common English words such as “the”</label>
            <label>Word groups<select value={settings.grams} onChange={e=>updateSettings({grams:+e.target.value})}><option value="1">Single words: “machine”</option><option value="2">Words + pairs: “machine learning”</option><option value="3">Words + pairs + three-word phrases</option></select></label>
            <label>Test split · {Math.round(settings.ratio*100)}%<input type="range" min="0.1" max="0.5" step="0.05" value={settings.ratio} onChange={e=>updateSettings({ratio:+e.target.value})}/></label><label>Reproducible split seed<input type="number" min="0" max="100000" value={settings.seed} onChange={e=>updateSettings({seed:Math.max(0,Math.min(100000,Math.floor(+e.target.value||0)))})}/></label>
          </details>
          <section className="text-card text-training"><h2>Train model</h2><p>{dirty ? 'Ready to train with your pending changes.' : 'Ready to train using the current examples and settings.'}</p>{validation.errors.length>0 && <div role="alert" className="text-errors">{validation.errors.map((s,i)=><p key={i}>{s}</p>)}</div>}{validation.warnings.map((w,i)=><p className="text-warning" key={i}>{w}</p>)}<button className="text-primary" disabled={busy || validation.errors.length>0} onClick={train}><Play size={16}/> {busy?'Training…':'Train model'}</button><ol className="text-training-steps" aria-live="polite">{steps.map(s=><li key={s}>{s}</li>)}</ol><div className="text-split" aria-label="Fitted dataset split"><span style={{flex:snapshot.train.length}}>Train {snapshot.train.length}</span><span style={{flex:snapshot.test.length}}>Test {snapshot.test.length}</span></div><p>Vocabulary is learned from training examples only. Test examples stay separate.</p></section>
        </div>
        <div className="text-results">
          <section className="text-card"><h2>Test a sentence</h2><label>Your text<textarea className="text-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();classify();}}}/></label><button className="text-primary" disabled={busy} onClick={()=>classify()}><Send size={16}/> Classify text</button><small>Ctrl / ⌘ + Enter</small>{input!==testedText && <p className="text-warning">Text changed. Classify to update the result.</p>}
            <div className="text-presets">{snapshot.model.labels.map(l=><button key={l} onClick={()=>classify(snapshot.rows.find(r=>r.label===l)!.text)} style={{borderColor:classColor(l)}}>{l} example</button>)}<button onClick={()=>classify('The team uses new technology to improve health and business.')}>Ambiguous</button><button onClick={()=>classify('quasar zephyr xylophone')}>Unfamiliar</button></div>
            <div className="text-prediction" aria-live="polite" style={{borderColor:known?classColor(result.label):undefined}}><small>Prediction for: {testedText || '(empty text)'}</small><h2>{known?result.label:'Insufficient learned evidence'}</h2><p>{known?`${(result.probability*100).toFixed(1)}% of probability across known classes`:'Add a sentence containing words the model has learned.'}</p>{known&&runner&&<p>Top-two gap: {((result.probability-runner.probability)*100).toFixed(1)} percentage points {result.probability-runner.probability<.15?'· Close decision':''}</p>}</div>
            {known && <div aria-label="Class probabilities">{ranked.map(r=><div className="text-probability" key={r.label}><span style={{color:classColor(r.label)}}>{r.label}</span><b>{(r.probability*100).toFixed(1)}%</b><div className="text-bar-track"><span style={{width:`${r.probability*100}%`,background:classColor(r.label)}}/></div></div>)}</div>}
            <p>Probabilities compare known classes. They are not proof that this sentence belongs to any of them.</p>
            {previous && <details><summary>Before / after comparison</summary><p>Before: “{previous.text}” → {previous.result.tokens.length?`${previous.result.label} (${(previous.result.probability*100).toFixed(1)}%)`:'Insufficient evidence'}</p><p>After: “{testedText}” → {known?`${result.label} (${(result.probability*100).toFixed(1)}%)`:'Insufficient evidence'}</p></details>}
          </section>
          <section className="text-card"><h2>Words the model recognizes</h2><p>Tap a word to inspect it. Gray words were not learned.</p><div className="text-tokens">{[...new Set(fittedTokens.features)].map(w=><button key={w} className={snapshot.model.vocabulary.includes(w)?'known':'unknown'} aria-pressed={token===w} onClick={()=>setToken(w)} style={snapshot.model.vocabulary.includes(w)?{borderColor:classColor(result.label)}:undefined}>{w}</button>)}</div><p>{result.tokens.length} recognized word occurrences · {result.oovIgnored.length} unfamiliar word occurrences</p>{token&&<div className="text-token-detail"><h3>“{token}”</h3>{tokenInfo?Object.entries(tokenInfo).map(([l,v])=><p key={l} style={{color:classColor(l)}}>{l}: {v.count} training occurrences · smoothed word probability {(v.smoothed*100).toFixed(2)}%</p>):<p>This word is outside the learned vocabulary and contributes no class evidence.</p>}</div>}
          </section>
          <section className="text-card"><h2>Which words favored this class?</h2><p>{known&&runner?`Compared with ${runner.label}. Positive values favor ${result.label}; negative values favor ${runner.label}. Values are log-likelihood differences, not percentages.`:'Classify recognizable text to see word evidence.'}</p>{evidence.map(e=><button className="text-evidence" key={e.word} onClick={()=>setToken(e.word)}><span>{e.word}</span><span className="text-evidence-track"><i style={{width:`${Math.abs(e.value)/maxEvidence*50}%`,left:e.value>=0?'50%':`${50-Math.abs(e.value)/maxEvidence*50}%`,background:classColor(e.value>=0?result.label:runner?.label??result.label)}}/></span><b>{e.value>=0?'+':''}{e.value.toFixed(2)}</b></button>)}</section>
          <details className="text-card" open={tab==='visualize'}><summary>Preprocessing preview</summary><p>Preview uses pending settings; predictions use the last trained settings.</p><blockquote>{inspection.original || '(empty input)'}</blockquote><p>Cleaned words: {inspection.afterStopwords.join(' · ') || 'none'}</p><p>Word groups: {inspection.features.join(' · ') || 'none'}</p></details>
        </div>
      </div>
      <section className="text-card text-evaluation"><h2>Evaluate on unseen examples</h2><div className="text-metrics"><article><b>{(report.accuracy*100).toFixed(0)}%</b><span>Accuracy · {snapshot.test.length} test examples</span></article><article><b>{(baseline*100).toFixed(0)}%</b><span>Always predict {majority} · same {snapshot.test.length} tests</span></article><article><b>{(report.macroF1*100).toFixed(0)}%</b><span>Macro F1 · equal weight per class</span></article></div><p>This is a small educational dataset. A few correct guesses can change accuracy substantially.</p><div className="text-eval-grid"><div className="text-matrix"><h3>Actual class ↓ · Predicted class →</h3><table><thead><tr><th>Actual / Predicted</th>{report.labels.map(l=><th key={l} style={{color:classColor(l)}}>{l}</th>)}</tr></thead><tbody>{report.matrix.map((r,i)=><tr key={report.labels[i]}><th style={{color:classColor(report.labels[i])}}>{report.labels[i]}</th>{r.map((n,j)=><td key={j}><button className={i===j?'correct':'incorrect'} aria-label={`Actual ${report.labels[i]}, predicted ${report.labels[j]}: ${n}`} onClick={()=>{setCell({actual:report.labels[i],predicted:report.labels[j]});setErrorsOnly(false);}}>{n}</button></td>)}</tr>)}</tbody></table></div><div><h3>Test examples</h3><label className="text-check"><input type="checkbox" checked={errorsOnly} onChange={e=>{setErrorsOnly(e.target.checked);setCell(null);}}/> Errors only</label>{cell&&<button onClick={()=>setCell(null)}>Clear filter: {cell.actual} → {cell.predicted}</button>}{shown.map((r,i)=><button className={`text-test-row ${r.label===r.result.label?'correct':'incorrect'}`} key={i} onClick={()=>classify(r.text)}><span>{r.text}</span><small>Actual: {r.label} → Predicted: {r.result.label} · {(r.result.probability*100).toFixed(0)}%</small></button>)}{!shown.length&&<p>No test examples match this filter.</p>}</div></div></section>
      <p className="text-limitations">English word-based Naive Bayes treats words as independent evidence. It does not understand meaning, sarcasm, or unfamiliar topics.</p>
      <div className="text-mobile-dock"><button onClick={() => { const editor=document.getElementById('text-examples') as HTMLDetailsElement; editor.open=true; editor.scrollIntoView({behavior:'smooth',block:'start'}); }}><Database size={16}/> Examples</button><button className="text-primary" disabled={busy||validation.errors.length>0} onClick={train}><Play size={16}/> Train model</button></div>
    </>}
  </div>;
}
