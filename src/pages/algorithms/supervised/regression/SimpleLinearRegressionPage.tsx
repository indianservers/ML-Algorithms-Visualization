import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Check, ChevronDown, ChevronLeft, Circle, Database, FileText,
  Hand, Lightbulb, Play, RotateCcw, Sigma, Star, Trophy,
} from 'lucide-react';
import { simpleLinearRegression } from '../../../../lib/algorithms/regression/linearRegression';
import { mae, rmse, rSquared } from '../../../../lib/math/metrics';
import './SimpleLinearRegressionPage.css';

type Point = { id: number; x: number; y: number };
type DatasetKey = 'a' | 'b' | 'c';

const DATASETS: Record<DatasetKey, { name: string; points: Point[] }> = {
  a: {
    name: 'Sample Dataset A',
    points: [
      [-1.5, -.81], [-.1, 1.33], [.5, 2.77], [1.4, 1.54], [2, 3.78], [2.5, 2.15],
      [3.1, 4.29], [3.7, 3.44], [4.4, 5.36], [5.1, 3.57], [5.6, 5.94], [6.4, 5.14],
      [6.9, 7.21], [7.8, 6.27], [8.5, 8.59], [9.2, 7.51], [9.9, 9.33], [10.5, 8.57],
    ].map(([x, y], id) => ({ id, x, y })),
  },
  b: {
    name: 'Sample Dataset B',
    points: [
      [-1.3, 10.8], [-.5, 9.4], [.2, 10], [.9, 7.6], [1.6, 8.4], [2.1, 6.1], [2.9, 7.1],
      [3.5, 5], [4.2, 5.8], [4.8, 3.4], [5.6, 4.6], [6.2, 2.1], [7, 3.2], [7.7, 1.1],
      [8.5, 1.9], [9.1, -.2], [9.8, .7], [10.4, -1.2],
    ].map(([x, y], id) => ({ id, x, y })),
  },
  c: {
    name: 'Low-noise Dataset',
    points: Array.from({ length: 18 }, (_, id) => {
      const x = -1.3 + id * .68;
      return { id, x, y: .82 * x + 1.4 + Math.sin(id * 1.7) * .28 };
    }),
  },
};

const X_MIN = -2;
const X_MAX = 11.6;
const Y_MIN = -2;
const Y_MAX = 14.5;
const PLOT = { left: 60, top: 18, width: 900, height: 405 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const sx = (x: number) => PLOT.left + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT.width;
const sy = (y: number) => PLOT.top + PLOT.height - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT.height;

const lessonSteps = [
  ['What is Simple Linear Regression?', ''], ['Explore the Data', ''], ['Place Points', 'Drag to add or move points'],
  ['Fit the Line', ''], ['Inspect Errors', ''], ['Make Predictions', ''], ['Challenge', ''],
];

export default function SimpleLinearRegressionPage() {
  const [datasetKey, setDatasetKey] = React.useState<DatasetKey>('a');
  const [points, setPoints] = React.useState<Point[]>(() => DATASETS.a.points.map(point => ({ ...point })));
  const [slope, setSlope] = React.useState(.74);
  const [intercept, setIntercept] = React.useState(1.2);
  const [noise, setNoise] = React.useState(1);
  const [showResiduals, setShowResiduals] = React.useState(true);
  const [showBand, setShowBand] = React.useState(true);
  const [showEquation, setShowEquation] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(2);
  const [dragging, setDragging] = React.useState<number | null>(null);
  const [training, setTraining] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const predictions = React.useMemo(() => points.map(point => slope * point.x + intercept), [points, slope, intercept]);
  const actual = React.useMemo(() => points.map(point => point.y), [points]);
  const score = rSquared(actual, predictions);
  const metricMae = mae(actual, predictions);
  const metricRmse = rmse(actual, predictions);

  const reset = React.useCallback((key: DatasetKey = datasetKey) => {
    setPoints(DATASETS[key].points.map(point => ({ ...point })));
    setSlope(key === 'b' ? -.7 : .74);
    setIntercept(key === 'b' ? 9.8 : 1.2);
    setNoise(1);
    setShowResiduals(true);
    setShowBand(true);
    setShowEquation(false);
    setActiveStep(2);
    setTraining(false);
  }, [datasetKey]);

  const train = React.useCallback(() => {
    if (points.length < 2) return;
    setTraining(true);
    const model = simpleLinearRegression(points.map(point => point.x), points.map(point => point.y));
    window.setTimeout(() => {
      setSlope(model.slope);
      setIntercept(model.intercept);
      setTraining(false);
      setActiveStep(3);
    }, 420);
  }, [points]);

  React.useEffect(() => {
    const onTrain = () => train();
    const onReset = () => reset();
    window.addEventListener('ml:train', onTrain);
    window.addEventListener('ml:reset', onReset);
    return () => { window.removeEventListener('ml:train', onTrain); window.removeEventListener('ml:reset', onReset); };
  }, [train, reset]);

  const toData = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 1000;
    const py = ((clientY - rect.top) / rect.height) * 455;
    return {
      x: clamp(X_MIN + ((px - PLOT.left) / PLOT.width) * (X_MAX - X_MIN), X_MIN, X_MAX),
      y: clamp(Y_MAX - ((py - PLOT.top) / PLOT.height) * (Y_MAX - Y_MIN), Y_MIN, Y_MAX),
    };
  }, []);

  const movePoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const next = toData(event.clientX, event.clientY);
    setPoints(current => current.map(point => point.id === dragging ? { ...point, ...next } : point));
  };

  const addPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const next = toData(event.clientX, event.clientY);
    setPoints(current => [...current, { id: Math.max(-1, ...current.map(point => point.id)) + 1, ...next }]);
  };

  const applyNoise = (value: number) => {
    setNoise(value);
    setPoints(DATASETS[datasetKey].points.map((point, index) => ({ ...point, y: clamp(point.y + Math.sin((index + 1) * 12.9898) * value * .55, Y_MIN, Y_MAX) })));
  };

  const animateFit = () => {
    if (points.length < 2) return;
    const model = simpleLinearRegression(points.map(point => point.x), points.map(point => point.y));
    setTraining(true);
    const fromSlope = slope;
    const fromIntercept = intercept;
    const started = performance.now();
    const frame = (now: number) => {
      const t = clamp((now - started) / 650, 0, 1);
      const eased = 1 - (1 - t) ** 3;
      setSlope(fromSlope + (model.slope - fromSlope) * eased);
      setIntercept(fromIntercept + (model.intercept - fromIntercept) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else { setTraining(false); setActiveStep(3); }
    };
    requestAnimationFrame(frame);
  };

  const lineY1 = slope * X_MIN + intercept;
  const lineY2 = slope * X_MAX + intercept;
  const bandSize = metricRmse * 1.45;
  const xTicks = [-2, 0, 2, 4, 6, 8, 10];
  const yTicks = [-2, 0, 2, 4, 6, 8, 10, 12];

  return (
    <div className="slr-shell">
      <aside className="slr-sidebar">
        <Link to="/" className="slr-brand" aria-label="Go to Home"><span className="slr-logo">N</span><strong>AlgoViz</strong></Link>
        <div className="slr-outline-head"><span>LESSON OUTLINE</span><button aria-label="Collapse lesson outline"><ChevronLeft size={19} /><ChevronLeft size={19} /></button></div>
        <nav aria-label="Lesson outline" className="slr-lessons">
          {lessonSteps.map(([label, sublabel], index) => (
            <button key={label} className={activeStep === index ? 'active' : ''} onClick={() => setActiveStep(index)}>
              <span className="slr-step-copy"><span>{index + 1}. {label}{index === 6 && <Star size={14} fill="#facc15" color="#facc15" />}</span>{sublabel && <small>{sublabel}</small>}</span>
              {index < activeStep ? <Check className="complete" size={16} /> : activeStep === index ? <span className="current-dot" /> : <Circle size={15} />}
            </button>
          ))}
        </nav>
        <div className="slr-tip"><div><Lightbulb size={20} /><strong>Learning Tip</strong></div><p>Drag points to see how the best-fit line changes. The line updates automatically using Ordinary Least Squares.</p><button onClick={() => setActiveStep(0)}>View Formula <Sigma size={18} /></button></div>
        <div className="slr-sidebar-footer"><Link to="/documentation"><FileText size={18} />Docs</Link><Link to="/documentation"><BookOpen size={18} />Glossary</Link></div>
      </aside>

      <main className="slr-main">
        <header className="slr-header">
          <div><div className="slr-title-row"><h1>Simple Linear Regression</h1><span>Beginner</span></div><p>Understand how a straight line can model the relationship between two variables.</p></div>
          <div className="slr-progress"><span>Progress</span><div><i style={{ width: `${((activeStep + 1) / 7) * 100}%` }} /></div><b>{activeStep + 1} / 7</b><button onClick={() => setActiveStep(6)}><Trophy size={18} />Challenge</button></div>
        </header>

        <section className="slr-workspace">
          <div className="slr-center">
            <div className="slr-chart-card">
              <div className="slr-chart-toolbar">
                <label><input type="checkbox" checked={showResiduals} onChange={event => setShowResiduals(event.target.checked)} /><span />Show Residuals</label>
                <label><input type="checkbox" checked={showBand} onChange={event => setShowBand(event.target.checked)} /><span />Confidence Band</label>
                <button onClick={animateFit} disabled={training}><Play size={17} />{training ? 'Fitting…' : 'Animate Fit'}</button>
                <em><Hand size={18} />Drag points to move them</em>
              </div>
              <svg ref={svgRef} className="slr-chart" viewBox="0 0 1000 455" role="img" aria-label="Interactive regression chart. Click to add, drag to move, and double click a point to remove it." onPointerMove={movePoint} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} onPointerDown={addPoint}>
                <rect x={PLOT.left} y={PLOT.top} width={PLOT.width} height={PLOT.height} fill="transparent" />
                {xTicks.map(tick => <g key={`x-${tick}`}><line x1={sx(tick)} x2={sx(tick)} y1={PLOT.top} y2={PLOT.top + PLOT.height} className="grid-line" /><text x={sx(tick)} y={447} textAnchor="middle">{tick}</text></g>)}
                {yTicks.map(tick => <g key={`y-${tick}`}><line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={sy(tick)} y2={sy(tick)} className="grid-line" /><text x={45} y={sy(tick) + 4} textAnchor="end">{tick}</text></g>)}
                <line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={PLOT.top + PLOT.height} y2={PLOT.top + PLOT.height} className="axis-line" />
                <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.top + PLOT.height} className="axis-line" />
                <text x="970" y="447" className="axis-name">x</text><text x="29" y="30" className="axis-name">y</text>
                {showBand && <polygon points={`${sx(X_MIN)},${sy(lineY1 + bandSize)} ${sx(X_MAX)},${sy(lineY2 + bandSize)} ${sx(X_MAX)},${sy(lineY2 - bandSize)} ${sx(X_MIN)},${sy(lineY1 - bandSize)}`} className="confidence-band" />}
                <line x1={sx(X_MIN)} y1={sy(lineY1)} x2={sx(X_MAX)} y2={sy(lineY2)} className="best-line" />
                {showResiduals && points.map(point => <line key={`r-${point.id}`} x1={sx(point.x)} x2={sx(point.x)} y1={sy(point.y)} y2={sy(slope * point.x + intercept)} className="residual-line" />)}
                {points.map(point => <circle key={point.id} cx={sx(point.x)} cy={sy(point.y)} r="8" className="data-point" onPointerDown={event => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(point.id); }} onDoubleClick={event => { event.stopPropagation(); setPoints(current => current.filter(candidate => candidate.id !== point.id)); }} />)}
                {showEquation && <text x="690" y="54" className="chart-equation">ŷ = {slope.toFixed(2)}x + {intercept.toFixed(2)}</text>}
              </svg>
              <div className="slr-legend"><span><i className="line-key" />Best Fit Line</span><span><i className="point-key" />Data Point</span><span><i className="residual-key" />Residual</span></div>
            </div>

            <div className="slr-metrics">
              <article><h3>Model Equation</h3><strong className="equation">ŷ = {slope.toFixed(2)}x + {intercept.toFixed(2)}</strong><p>(Click coefficients to edit)</p></article>
              <article><h3>R² Score <small>i</small></h3><strong className="green">{score.toFixed(3)}</strong><p>Explained variance</p></article>
              <article><h3>MAE <small>i</small></h3><strong className="yellow">{metricMae.toFixed(3)}</strong><p>Mean Absolute Error</p></article>
              <article><h3>RMSE <small>i</small></h3><strong className="orange">{metricRmse.toFixed(3)}</strong><p>Root Mean Squared Error</p></article>
            </div>
          </div>

          <aside className="slr-controls">
            <h3>Dataset</h3>
            <label className="slr-select"><Database size={18} /><select value={datasetKey} onChange={event => { const key = event.target.value as DatasetKey; setDatasetKey(key); reset(key); }}><option value="a">Sample Dataset A</option><option value="b">Sample Dataset B</option><option value="c">Low-noise Dataset</option></select><ChevronDown size={17} /></label>
            <p className="point-count" title="Click the chart to add; double-click a point to remove"><RotateCcw size={13} />{points.length} points</p>
            <hr />
            <h3>Model Controls</h3><p>Adjust to see changes in real time</p>
            <Range label="Slope (m)" value={slope} min={-2} max={2} step={.01} onChange={setSlope} />
            <Range label="Intercept (b)" value={intercept} min={-5} max={5} step={.01} onChange={setIntercept} />
            <Range label="Noise (σ)" value={noise} min={0} max={3} step={.1} onChange={applyNoise} />
            <hr />
            <h3>Visualization</h3>
            <CheckRow label="Show Residuals" checked={showResiduals} onChange={setShowResiduals} />
            <CheckRow label="Show Confidence Band" checked={showBand} onChange={setShowBand} />
            <CheckRow label="Show Equation on Chart" checked={showEquation} onChange={setShowEquation} />
            <hr />
            <h3>Actions</h3>
            <button className="train-button" onClick={train} disabled={training}>{training ? 'Training…' : 'Train Model'}<Play size={17} /></button>
            <button className="reset-button" onClick={() => reset()}>Reset All<RotateCcw size={17} /></button>
          </aside>
        </section>

        <section className="slr-flow">
          {[
            ['Place Points', 'Create or adjust your data'], ['Fit Line', 'The model finds the best fit'], ['Inspect Errors', 'Analyze residuals & metrics'],
          ].map(([title, detail], index) => <React.Fragment key={title}><button className={activeStep === index + 2 ? 'active' : ''} onClick={() => setActiveStep(index + 2)}><b>{index + 1}</b><span><strong>{title}</strong><small>{detail}</small></span></button>{index < 2 && <span className="flow-dots">••••••••</span>}</React.Fragment>)}
        </section>
      </main>
    </div>
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className="slr-range"><span><b>{label}</b><output>{value.toFixed(2)}</output></span><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} /><small><span>{min}</span><span>{max}</span></small></label>;
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="slr-check"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{checked && <Check size={13} />}</span>{label}</label>;
}
