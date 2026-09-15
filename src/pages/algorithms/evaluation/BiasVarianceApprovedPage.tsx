import { useEffect, useMemo, useRef, useState } from 'react';
import { useLabNavigate } from '../../../lib/labNavigation';
import { ridgeRegression } from '../../../lib/algorithms/regression/linearRegression';
import { mse, rSquared } from '../../../lib/math/metrics';
import './BiasVarianceApprovedPage.css';

type Point = { x: number; y: number };
type DatasetKey = 'California Housing' | 'Ames Housing' | 'Energy Efficiency';
type ModelKind = 'Polynomial Regression' | 'Ridge Polynomial' | 'Spline Approximation';

const DATASETS: Record<DatasetKey, { rows: number; features: number; about: string; phase: number }> = {
  'California Housing': { rows: 20640, features: 8, phase: 0.15, about: 'Predict median house value based on features like income, age, rooms, and location.' },
  'Ames Housing': { rows: 2930, features: 24, phase: 0.72, about: 'Estimate home sale price from structural, quality, and neighborhood attributes.' },
  'Energy Efficiency': { rows: 768, features: 8, phase: 1.18, about: 'Predict heating load from building geometry and glazing characteristics.' },
};

function seeded(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function trueValue(x: number, phase = 0) {
  return 0.5 + 0.26 * Math.sin((x + phase) * 3.2) + 0.13 * x ** 3 + 0.06 * Math.cos(x * 7 + phase);
}

function makeDataset(key: DatasetKey, noise: number, seed: number): Point[] {
  const random = seeded(seed + Math.round(DATASETS[key].phase * 1000));
  return Array.from({ length: 48 }, (_, index) => {
    const x = -1 + (index / 47) * 2;
    const gaussian = (random() + random() + random() + random() - 2) * (noise / 100) * 2.2;
    return { x, y: trueValue(x, DATASETS[key].phase) + gaussian };
  });
}

function basis(x: number, degree: number, scaling: boolean, kind: ModelKind) {
  const value = scaling ? x : x * 1.8;
  const terms = Array.from({ length: degree }, (_, index) => value ** (index + 1));
  if (kind === 'Spline Approximation') {
    for (const knot of [-0.55, 0, 0.55]) terms.push(Math.max(0, value - knot) ** 3);
  }
  return terms;
}

function fit(points: Point[], degree: number, scaling: boolean, kind: ModelKind) {
  const alpha = kind === 'Ridge Polynomial' ? 0.08 : kind === 'Spline Approximation' ? 0.025 : 1e-9;
  const model = ridgeRegression(points.map(point => basis(point.x, degree, scaling, kind)), points.map(point => point.y), alpha);
  return (x: number) => model.predict(basis(x, degree, scaling, kind));
}

function split(points: Point[], testSize: number, seed: number) {
  const random = seeded(seed * 17 + 9);
  const shuffled = points.map((point, index) => ({ point, key: random() + index * 1e-8 })).sort((a, b) => a.key - b.key).map(item => item.point);
  const testCount = Math.max(2, Math.round(points.length * testSize / 100));
  return { train: shuffled.slice(testCount), test: shuffled.slice(0, testCount) };
}

function computeBiasVariance(points: Point[], complexity: number, testSize: number, seed: number, scaling: boolean, kind: ModelKind) {
  const partition = split(points, testSize, seed);
  const predictor = fit(partition.train, complexity, scaling, kind);
  const trainPrediction = partition.train.map(point => predictor(point.x));
  const validationPrediction = partition.test.map(point => predictor(point.x));
  const trainError = mse(partition.train.map(point => point.y), trainPrediction);
  const validationError = mse(partition.test.map(point => point.y), validationPrediction);
  const grid = Array.from({ length: 81 }, (_, index) => -1 + index / 40);
  const fitted = grid.map(x => ({ x, y: predictor(x), truth: trueValue(x) }));
  return { ...partition, predictor, fitted, trainError, validationError, r2: rSquared(partition.test.map(point => point.y), validationPrediction) };
}

function linePath(values: { x: number; y: number }[], xMap: (v: number) => number, yMap: (v: number) => number) {
  return values.map((point, index) => `${index ? 'L' : 'M'}${xMap(point.x).toFixed(1)},${yMap(point.y).toFixed(1)}`).join(' ');
}

function MiniSpark({ values, color }: { values: number[]; color: string }) {
  const low = Math.min(...values), high = Math.max(...values);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 68},${22 - ((value - low) / (high - low || 1)) * 18}`).join(' ');
  return <svg viewBox="0 0 68 24" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
}

const TABS = ['Learn', 'Visualize', 'Dataset', 'Transform', 'Train', 'Metrics', 'Compare', 'Explain'];

export default function BiasVarianceApprovedPage() {
  const [dataset, setDataset] = useState<DatasetKey>('California Housing');
  const [modelKind, setModelKind] = useState<ModelKind>('Polynomial Regression');
  const [complexity, setComplexity] = useState(5);
  const [noise, setNoise] = useState(10);
  const [testSize, setTestSize] = useState(20);
  const [seed, setSeed] = useState(42);
  const [scaling, setScaling] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('Visualize');
  const [complete, setComplete] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [uploaded, setUploaded] = useState<{ name: string; points: Point[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const go = useLabNavigate();
  const points = useMemo(() => uploaded?.points ?? makeDataset(dataset, noise, seed), [dataset, noise, seed, uploaded]);

  const analysis = useMemo(() => computeBiasVariance(points, complexity, testSize, seed, scaling, modelKind), [points, complexity, testSize, seed, scaling, modelKind]);
  const curves = useMemo(() => Array.from({ length: 15 }, (_, index) => {
    const degree = index + 1;
    const item = computeBiasVariance(points, degree, testSize, seed, scaling, modelKind);
    return { degree, train: item.trainError, validation: item.validationError };
  }), [points, testSize, seed, scaling, modelKind]);
  const optimum = curves.reduce((best, item) => item.validation < best.validation ? item : best, curves[0]).degree;
  const bootstraps = useMemo(() => Array.from({ length: 13 }, (_, iteration) => {
    const random = seeded(seed + iteration * 97);
    const sample = Array.from({ length: analysis.train.length }, () => analysis.train[Math.floor(random() * analysis.train.length)]);
    return fit(sample, complexity, scaling, modelKind);
  }), [analysis.train, complexity, scaling, modelKind, seed]);
  const spread = useMemo(() => Array.from({ length: 81 }, (_, index) => {
    const x = -1 + index / 40;
    const values = bootstraps.map(predict => predict(x));
    const center = values.reduce((sum, value) => sum + value, 0) / values.length;
    const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / values.length);
    return { x, center, sd };
  }), [bootstraps]);
  const avgSpread = spread.reduce((sum, point) => sum + point.sd, 0) / spread.length;
  const minError = Math.min(...curves.flatMap(item => [item.train, item.validation]));
  const maxError = Math.max(...curves.flatMap(item => [item.train, item.validation]));
  const logMin = Math.log10(Math.max(1e-5, minError * 0.7));
  const logMax = Math.log10(Math.max(maxError * 1.15, minError * 2));
  const xComplex = (value: number) => 44 + ((value - 1) / 14) * 258;
  const yError = (value: number) => 181 - ((Math.log10(Math.max(1e-5, value)) - logMin) / (logMax - logMin || 1)) * 145;
  const xFit = (value: number) => 26 + ((value + 1) / 2) * 300;
  const yFit = (value: number) => 186 - ((value + 0.05) / 1.1) * 150;

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => setComplexity(value => value >= 15 ? 1 : value + 1), 850);
    return () => window.clearInterval(timer);
  }, [animating]);

  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/);
    const parsed = lines.slice(1).map(line => line.split(',').map(Number)).filter(row => row.length >= 2 && row.slice(0, 2).every(Number.isFinite)).map(row => ({ x: row[0], y: row[1] }));
    if (parsed.length < 8) { setStatus('CSV needs x,y columns and at least 8 numeric rows'); return; }
    const xs = parsed.map(point => point.x); const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const normalized = parsed.map(point => ({ x: ((point.x - minX) / (maxX - minX || 1)) * 2 - 1, y: point.y }));
    setUploaded({ name: file.name, points: normalized }); setStatus(`${file.name} · ${parsed.length} rows`);
  };
  const reset = () => { setDataset('California Housing'); setUploaded(null); setModelKind('Polynomial Regression'); setComplexity(5); setNoise(10); setTestSize(20); setSeed(42); setScaling(true); setAnimating(false); setStatus('Experiment reset'); };
  const complexityLabel = complexity <= 2 ? 'Underfit' : complexity >= 9 ? 'Overfit' : 'Balanced';
  const conceptualPosition = Math.min(100, ((complexity - 1) / 8) * 100);
  const rangeStart = Math.max(1, Math.min(3, optimum));
  const rangeEnd = Math.min(15, Math.max(8, optimum + 1));
  const degreeRange = `${rangeStart} – ${rangeEnd}`;
  const generalizationGap = Math.abs(analysis.validationError - analysis.trainError);

  return <div className={`bv-page ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className="bv-side">
      <a className="bv-brand" href="/"><span>✺</span><b>Mega ML<small>AI OBSERVATORY</small></b></a>
      <nav>
        <small>MAIN</small>
        {['⌂  Home', '◉  AI Observatory', '◇  Models', '▤  Datasets', '⌘  Experiments'].map(label => <button key={label} onClick={() => go(label)}>{label}</button>)}
        <hr/><small>LEARN</small>
        {['▣  Core Concepts', '▤  Lessons', '▦  Playgrounds', '▥  Cheat Sheets'].map((label, index) => <button className={index === 0 ? 'active' : ''} key={label} onClick={() => go(label)}>{label}</button>)}
        <hr/><small>TOOLS</small>
        {['▧  Notebooks', '⬡  AutoML', '◈  Deployments', '▤  Reports'].map(label => <button key={label} onClick={() => go(label)}>{label}</button>)}
      </nav>
      <button className="bv-collapse" onClick={() => setCollapsed(value => !value)}>{collapsed ? '»' : '‹  Collapse'}</button>
    </aside>

    <header className="bv-head">
      <div className="bv-top"><span>Learn › Core Concepts › <b>▧ Bias–Variance Tradeoff</b></span><span>PROGRESS <strong>{complete ? '100%' : '75%'}</strong><button onClick={() => { setComplete(value => !value); setStatus(complete ? 'Lesson reopened' : 'Lesson completed'); }}>✓ {complete ? 'Completed' : 'Mark Complete'}</button> ⓘ <span className="avatar">MM</span>⌄</span></div>
      <div className="bv-title"><span>〽</span><h1>Bias-Variance Tradeoff<small>Explore how model complexity impacts underfitting and overfitting.</small></h1></div>
      <nav className="bv-tabs">{TABS.map(tab => <button className={activeTab === tab ? 'active' : ''} onClick={() => { setActiveTab(tab); setStatus(`${tab} view selected`); }} key={tab}>{tab}</button>)}</nav>
    </header>

    <main className="bv-main">
      <section className="bv-explorer panel">
        <div className="bv-section-title"><h2>Interactive Bias-Variance Explorer<small>Adjust model complexity to see how it affects training/validation error and prediction spread.</small></h2><button onClick={() => setAnimating(value => !value)}>▷ Animation <span className={`switch ${animating ? 'on' : ''}`}/></button></div>
        <div className="bv-complexity"><b>Model Complexity ⓘ</b><div className="bv-complexity-label" style={{ left: `${6 + conceptualPosition * .88}%` }}><span>{complexityLabel}</span><small>{complexityLabel === 'Balanced' ? 'Good Fit' : complexityLabel === 'Underfit' ? 'High Bias' : 'High Variance'}</small></div><div className="complexity-track"><span className="under">Underfit<br/><b>High Bias</b></span><i style={{ left: `${conceptualPosition}%` }}/><span className="over">Overfit<br/><b>High Variance</b></span></div></div>
        <div className="bv-charts">
          <article className="chart-card"><h3>Train & Validation Error ⓘ</h3><p className="legend"><span className="cyan">— Training Error</span><span className="violet">– – Validation Error</span></p><svg viewBox="0 0 330 220" role="img" aria-label="Training and validation error curves"><g className="grid">{[36,72,108,144,181].map(y => <line key={y} x1="44" x2="302" y1={y} y2={y}/>)}</g><path className="train-line" d={linePath(curves.map(item => ({ x: item.degree, y: item.train })), xComplex, yError)}/><path className="valid-line" d={linePath(curves.map(item => ({ x: item.degree, y: item.validation })), xComplex, yError)}/><line className="marker" x1={xComplex(complexity)} x2={xComplex(complexity)} y1="30" y2="184"/><circle className="focus" cx={xComplex(complexity)} cy={yError(analysis.validationError)} r="5"/><text x="170" y="214">Model Complexity</text></svg><div className="chart-note"><b>● Sweet Spot</b><p>The model balances bias and variance for the best generalization performance.</p></div></article>
          <article className="chart-card"><h3>Model Fit on Data ⓘ</h3><p className="legend"><span className="cyan">● Training Data</span><span className="violet">— Model Prediction</span><span>– – True Function</span></p><svg viewBox="0 0 350 220" role="img" aria-label="Model fit on training data"><path className="truth-line" d={linePath(analysis.fitted.map(p => ({ x: p.x, y: trueValue(p.x, DATASETS[dataset].phase) })), xFit, yFit)}/><path className="model-line" d={linePath(analysis.fitted.map(p => ({ x: p.x, y: p.y })), xFit, yFit)}/>{analysis.train.map((point, index) => <circle key={index} cx={xFit(point.x)} cy={yFit(point.y)} r="2" className="data-point"/>)}</svg><div className="chart-note"><b>Current Complexity</b><p>{complexityLabel} complexity {complexityLabel === 'Balanced' ? 'captures the underlying pattern without overfitting noise.' : complexityLabel === 'Underfit' ? 'misses important curvature in the data.' : 'tracks sample noise and becomes unstable.'}</p></div></article>
          <article className="chart-card"><h3>Prediction Spread (Uncertainty) ⓘ</h3><p className="legend"><span className="violet">— Prediction</span><span>■ ± 2 Std. Dev.</span></p><svg viewBox="0 0 330 220" role="img" aria-label="Bootstrap prediction spread"><path className="spread-band" d={`${spread.map((p,i)=>`${i?'L':'M'}${xFit(p.x)},${yFit(p.center+2*p.sd)}`).join(' ')} ${spread.slice().reverse().map(p=>`L${xFit(p.x)},${yFit(p.center-2*p.sd)}`).join(' ')} Z`}/><path className="spread-line" d={linePath(spread.map(p=>({x:p.x,y:p.center})),xFit,yFit)}/></svg><div className="chart-note"><b>Spread Insight</b><p>Uncertainty is higher in regions with sparse data and at the boundaries.</p></div></article>
        </div>
        <div className="bv-takeaway"><span>ϟ</span><p><b>Key Takeaway</b><br/>As complexity increases, training error usually decreases, but validation error eventually increases.<br/>The optimal model is at the minimum of the validation error curve.</p></div>
      </section>
      <section className="bv-live panel"><h2>Live Metrics <small>(at current complexity) ⓘ</small></h2><div className="metric-row">
        <article><small>Training Error (MSE)</small><b>{analysis.trainError.toFixed(4)}</b><MiniSpark values={curves.map(v=>v.train)} color="#23d1b6"/><em>Low</em></article>
        <article><small>Validation Error (MSE)</small><b>{analysis.validationError.toFixed(4)}</b><MiniSpark values={curves.map(v=>v.validation)} color="#9464ff"/><em>Optimal</em></article>
        <article><small>Generalization Gap</small><b>{generalizationGap.toFixed(4)}</b><MiniSpark values={curves.map(v=>Math.abs(v.validation-v.train))} color="#ff8b21"/><em>Small</em></article>
        <article><small>R² (Validation)</small><b>{analysis.r2.toFixed(3)}</b><MiniSpark values={curves.map((_,i)=>Math.max(-1,1-curves[i].validation/(analysis.validationError+0.03)))} color="#22d4d1"/><em>Good</em></article>
        <article><small>Prediction Spread (Avg. Std.)</small><b>{avgSpread.toFixed(3)}</b><MiniSpark values={spread.map(v=>v.sd)} color="#9b61ff"/><em>Moderate</em></article>
        <aside><b>Recommended Complexity Range ⓘ</b><p>Degrees {degreeRange} offer the best bias-variance balance.</p><div><i style={{left:`${((rangeStart-1)/14)*100}%`,width:`${((rangeEnd-rangeStart)/14)*100}%`}}/></div><small>1 · {rangeStart} · {rangeEnd} · 15</small></aside>
      </div></section>
    </main>

    <aside className="bv-controls">
      <section className="panel"><h2>Dataset ⓘ</h2><label className="dataset-select">⌂<select aria-label="Dataset" value={dataset} onChange={event => { setDataset(event.target.value as DatasetKey); setUploaded(null); setStatus(`${event.target.value} loaded`); }}>{Object.keys(DATASETS).map(name=><option key={name}>{name}</option>)}</select></label><h3>About</h3><p>{uploaded ? `Imported numeric regression dataset ${uploaded.name}.` : DATASETS[dataset].about}</p><div className="dataset-stats"><span>Samples<b>{uploaded?.points.length.toLocaleString() ?? DATASETS[dataset].rows.toLocaleString()}</b></span><span>Features<b>{uploaded ? 1 : DATASETS[dataset].features}</b></span></div><div className="dataset-actions"><button onClick={() => { const names=Object.keys(DATASETS) as DatasetKey[]; const next=names[(names.indexOf(dataset)+1)%names.length]; setDataset(next); setUploaded(null); setStatus(`${next} loaded`); }}>Switch Dataset</button><button onClick={() => fileRef.current?.click()}>⇧ Upload CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={event => void upload(event.target.files?.[0])}/></div></section>
      <section className="panel control-panel"><h2>Controls</h2><label>Model Type<select value={modelKind} onChange={event=>setModelKind(event.target.value as ModelKind)}><option>Polynomial Regression</option><option>Ridge Polynomial</option><option>Spline Approximation</option></select></label><label className="toggle-line">Feature Scaling <input type="checkbox" checked={scaling} onChange={event=>setScaling(event.target.checked)}/><i/></label><label>Noise Level ⓘ <b>{noise}%</b><input type="range" min="0" max="50" value={noise} onChange={event=>{setNoise(Number(event.target.value));setUploaded(null)}}/><small>0% — 50%</small></label><label>Test Size ⓘ <b>{testSize}%</b><input type="range" min="10" max="50" value={testSize} onChange={event=>setTestSize(Number(event.target.value))}/><small>10% — 50%</small></label><label>Random Seed <input type="number" min="1" max="9999" value={seed} onChange={event=>setSeed(Math.max(1,Number(event.target.value)||1))}/></label></section>
      <section className="panel current"><h2>Current Complexity</h2><p>Degree (Polynomial)<b>{complexity}</b></p><p>Effective Parameters<b>{basis(0,complexity,scaling,modelKind).length+1}</b></p><input aria-label="Model complexity" type="range" min="1" max="15" value={complexity} onChange={event=>setComplexity(Number(event.target.value))}/><small>Simple — Complex</small><button onClick={reset}>Reset Experiment</button><a href="?advanced=1">Open original polynomial lab →</a></section>
    </aside>
    <div className="bv-status">{status}</div>
  </div>;
}
