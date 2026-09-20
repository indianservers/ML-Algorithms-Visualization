import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Database, FileText,
  Hand, Lightbulb, Play, RotateCcw, Sigma, Star, Target, Trophy,
} from 'lucide-react';
import { mae, mse, rmse } from '../../../../lib/math/metrics';
import { mean } from '../../../../lib/math/statistics';
import { energyDemandDataset, studentMarksDataset } from '../../../../data/sampleDatasets';
import type { LoadedAlgorithmDataset } from '../../../../data/algorithmDatasets';
import { loadActiveDatasetMap } from '../../../../lib/experimentWorkspace';
import { formatR2, parseFiniteNumber, regressionMetrics, simpleLinearIntervals } from '../../../../lib/regression/regressionEval';
import { RegressionDiagnosticsPanel } from '../../../../components/ml/RegressionDiagnosticsPanel';
import {
  datasetAPerfectPositive,
  datasetBPerfectNegative,
  datasetCNoisyLinear,
  datasetDWeakRelationship,
  datasetEOutliers,
  datasetFQuadratic,
  datasetKPiecewise,
  datasetLSvrNonlinear,
  datasetMConstantTarget,
  labPoints,
} from '../../../../lib/regression/regressionDatasets';
import './SimpleLinearRegressionPage.css';

type Point = { id: number; x: number; y: number };
type DatasetKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'k' | 'l' | 'm' | 'students' | 'energy' | 'loaded';

function rowsToPoints(rows: Array<Record<string, unknown>>, xKey?: string, yKey?: string): Point[] {
  if (!rows.length) return [];
  const numericKeys = Object.keys(rows[0] ?? {}).filter((key) => {
    if (/_id$|^id$/i.test(key)) return false;
    return rows.some((row) => Number.isFinite(Number(row[key])));
  });
  const xCol = xKey && numericKeys.includes(xKey) ? xKey : numericKeys[0];
  const yCol = yKey && numericKeys.includes(yKey) ? yKey : numericKeys.find((key) => key !== xCol);
  if (!xCol || !yCol) return [];
  return rows
    .map((row, id) => ({ id, x: Number(row[xCol]), y: Number(row[yCol]) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function ordinaryLeastSquares(pts: Point[]) {
  if (pts.length < 2) return null;
  const n = pts.length;
  const mx = pts.reduce((sum, point) => sum + point.x, 0) / n;
  const my = pts.reduce((sum, point) => sum + point.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (const point of pts) {
    const dx = point.x - mx;
    sxx += dx * dx;
    sxy += dx * (point.y - my);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

function plotDomain(pts: Point[]) {
  if (!pts.length) return { xMin: -2, xMax: 11.6, yMin: -2, yMax: 14.5 };
  const xs = pts.map((point) => point.x);
  const ys = pts.map((point) => point.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.12 || 1;
  const yPad = (yMax - yMin) * 0.2 || 1;
  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad,
  };
}

const DATASETS: Record<Exclude<DatasetKey, 'loaded'>, { name: string; story: string; points: Point[] }> = {
  a: {
    name: datasetAPerfectPositive.name,
    story: datasetAPerfectPositive.description,
    points: labPoints(datasetAPerfectPositive),
  },
  b: {
    name: datasetBPerfectNegative.name,
    story: datasetBPerfectNegative.description,
    points: labPoints(datasetBPerfectNegative),
  },
  c: {
    name: 'Noisy linear (seed 42)',
    story: datasetCNoisyLinear().description,
    points: labPoints(datasetCNoisyLinear()),
  },
  d: {
    name: datasetDWeakRelationship().name,
    story: datasetDWeakRelationship().description,
    points: labPoints(datasetDWeakRelationship()),
  },
  e: {
    name: datasetEOutliers.name,
    story: datasetEOutliers.description,
    points: labPoints(datasetEOutliers),
  },
  f: {
    name: datasetFQuadratic().name,
    story: datasetFQuadratic().description,
    points: labPoints(datasetFQuadratic()),
  },
  k: {
    name: datasetKPiecewise().name,
    story: datasetKPiecewise().description,
    points: labPoints(datasetKPiecewise()),
  },
  l: {
    name: datasetLSvrNonlinear().name,
    story: datasetLSvrNonlinear().description,
    points: labPoints(datasetLSvrNonlinear()),
  },
  m: {
    name: datasetMConstantTarget().name,
    story: datasetMConstantTarget().description,
    points: labPoints(datasetMConstantTarget()),
  },
  students: {
    name: 'Student Marks',
    story: 'Study hours versus exam marks — a real numeric table the line should read and fit.',
    points: rowsToPoints(studentMarksDataset.data as Array<Record<string, unknown>>, 'study_hours', 'marks'),
  },
  energy: {
    name: 'Energy Demand',
    story: 'Temperature versus electricity demand — another table the OLS fit should read.',
    points: rowsToPoints(energyDemandDataset.data as Array<Record<string, unknown>>, 'temperature_c', 'demand_mw'),
  },
};

const PLOT = { left: 60, top: 18, width: 900, height: 405 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const fitPoints = ordinaryLeastSquares;
const initialFit = fitPoints(DATASETS.a.points) ?? { slope: 0, intercept: 0 };
const formatLine = (nextSlope: number, nextIntercept: number) => {
  const slopePart = nextSlope >= 0 ? `+ ${nextSlope.toFixed(2)}x` : `− ${Math.abs(nextSlope).toFixed(2)}x`;
  return `ŷ = ${nextIntercept.toFixed(2)} ${slopePart}`;
};

const lessonSteps = [
  { title: 'What is Simple Linear Regression?', hint: 'The idea of a best-fit line' },
  { title: 'Explore the Data', hint: 'Inspect x and y together' },
  { title: 'Place Points', hint: 'Drag to add or move points' },
  { title: 'Fit the Line', hint: 'Ordinary least squares' },
  { title: 'Inspect Errors', hint: 'Residuals, MAE, RMSE, R²' },
  { title: 'Make Predictions', hint: 'Enter x to get ŷ' },
] as const;

const challengeQuestion = {
  prompt: 'If a fitted line is ŷ = 0.80x + 1.40, what is the prediction at x = 5?',
  answer: 5.4,
  choices: ['4.20', '5.40', '6.80'],
};

export default function SimpleLinearRegressionPage() {
  const location = useLocation();
  const [datasetKey, setDatasetKey] = React.useState<DatasetKey>('a');
  const [loadedDataset, setLoadedDataset] = React.useState<LoadedAlgorithmDataset | null>(null);
  const [points, setPoints] = React.useState<Point[]>(() => DATASETS.a.points.map(point => ({ ...point })));
  const [slope, setSlope] = React.useState(initialFit.slope);
  const [intercept, setIntercept] = React.useState(initialFit.intercept);
  const [noise, setNoise] = React.useState(1);
  const [showResiduals, setShowResiduals] = React.useState(true);
  const [showBand, setShowBand] = React.useState(true);
  const [showEquation, setShowEquation] = React.useState(true);
  const [activeStep, setActiveStep] = React.useState(0);
  const [dragging, setDragging] = React.useState<number | null>(null);
  const [training, setTraining] = React.useState(false);
  const [fitted, setFitted] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(false);
  const [predictInput, setPredictInput] = React.useState('5');
  const [predictX, setPredictX] = React.useState<number | null>(5);
  const [predictError, setPredictError] = React.useState<string | null>(null);
  const [challengeChoice, setChallengeChoice] = React.useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const canEditPoints = activeStep === 2;
  const showLine = activeStep !== 1;
  const forceResiduals = activeStep === 4;
  const showPredictionMark = predictX !== null && Number.isFinite(predictX) && showLine;
  const residualsOn = forceResiduals || showResiduals;
  const { xMin, xMax, yMin, yMax } = plotDomain(points);
  const sx = (x: number) => PLOT.left + ((x - xMin) / (xMax - xMin)) * PLOT.width;
  const sy = (y: number) => PLOT.top + PLOT.height - ((y - yMin) / (yMax - yMin)) * PLOT.height;
  const currentDatasetName = datasetKey === 'loaded'
    ? (loadedDataset?.name ?? 'Loaded dataset')
    : DATASETS[datasetKey].name;
  const currentDatasetStory = datasetKey === 'loaded'
    ? (loadedDataset?.description ?? 'Points read from the dataset attached to this lesson.')
    : DATASETS[datasetKey].story;
  const seedPoints = datasetKey === 'loaded'
    ? (loadedDataset ? rowsToPoints(loadedDataset.data, undefined, loadedDataset.target) : [])
    : DATASETS[datasetKey].points;

  const predictions = React.useMemo(() => points.map(point => slope * point.x + intercept), [points, slope, intercept]);
  const actual = React.useMemo(() => points.map(point => point.y), [points]);
  const residuals = React.useMemo(() => actual.map((value, index) => value - (predictions[index] ?? 0)), [actual, predictions]);
  const inSample = actual.length ? regressionMetrics(actual, predictions, 1) : null;
  const metricMae = actual.length ? mae(actual, predictions) : 0;
  const metricRmse = actual.length ? rmse(actual, predictions) : 0;
  const metricMse = actual.length ? mse(actual, predictions) : 0;
  const residualScale = residuals.length
    ? Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length)
    : 0;
  const largeResidualIds = new Set(
    points.filter((_, index) => residualScale > 0 && Math.abs(residuals[index]) > 2 * residualScale).map((point) => point.id),
  );
  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? null;
  const meanX = points.length ? mean(points.map(point => point.x)) : 0;
  const meanY = points.length ? mean(points.map(point => point.y)) : 0;
  const predictedY = predictX === null ? null : slope * predictX + intercept;
  const ols = React.useMemo(() => fitPoints(points), [points]);
  const lineIsStale = !fitted || Boolean(ols && (Math.abs(ols.slope - slope) > 0.02 || Math.abs(ols.intercept - intercept) > 0.02));
  const slopeMin = Math.min(-4, Math.floor((ols?.slope ?? slope) - 2));
  const slopeMax = Math.max(8, Math.ceil((ols?.slope ?? slope) + 2));
  const interceptMin = Math.min(-20, Math.floor((ols?.intercept ?? intercept) - 8));
  const interceptMax = Math.max(40, Math.ceil((ols?.intercept ?? intercept) + 8));

  const applyFit = React.useCallback((nextSlope: number, nextIntercept: number) => {
    setSlope(nextSlope);
    setIntercept(nextIntercept);
    setFitted(true);
  }, []);

  const applyPoints = React.useCallback((nextPoints: Point[], snapLine = true) => {
    setPoints(nextPoints);
    const model = fitPoints(nextPoints);
    if (snapLine && model) applyFit(model.slope, model.intercept);
    else setFitted(false);
    if (nextPoints.length) {
      const mid = nextPoints[Math.floor(nextPoints.length / 2)];
      if (mid) {
        setPredictInput(String(Number(mid.x.toFixed(2))));
        setPredictX(mid.x);
      }
    }
  }, [applyFit]);

  const reset = React.useCallback((key: DatasetKey = datasetKey) => {
    const nextPoints = key === 'loaded'
      ? (loadedDataset ? rowsToPoints(loadedDataset.data, undefined, loadedDataset.target) : []).map((point) => ({ ...point }))
      : DATASETS[key].points.map(point => ({ ...point }));
    applyPoints(nextPoints, true);
    setDatasetKey(key);
    setNoise(1);
    setShowResiduals(true);
    setShowBand(true);
    setShowEquation(true);
    setTraining(false);
    setChallengeChoice(null);
    setSelectedPointId(null);
  }, [applyPoints, datasetKey, loadedDataset]);

  const train = React.useCallback(() => {
    const model = fitPoints(points);
    if (!model) return;
    applyFit(model.slope, model.intercept);
    setTraining(false);
    if (activeStep < 3) setActiveStep(3);
  }, [activeStep, applyFit, points]);

  React.useEffect(() => {
    const onTrain = () => train();
    const onReset = () => reset();
    const onLoaded = (event: Event) => {
      const detail = (event as CustomEvent<{ route?: string; dataset?: LoadedAlgorithmDataset }>).detail;
      if (!detail?.dataset || (detail.route && detail.route !== location.pathname)) return;
      const nextPoints = rowsToPoints(detail.dataset.data, undefined, detail.dataset.target);
      if (!nextPoints.length) return;
      setLoadedDataset(detail.dataset);
      setDatasetKey('loaded');
      applyPoints(nextPoints, true);
    };
    window.addEventListener('ml:train', onTrain);
    window.addEventListener('ml:reset', onReset);
    window.addEventListener('ml:algorithm-dataset-loaded', onLoaded);
    return () => {
      window.removeEventListener('ml:train', onTrain);
      window.removeEventListener('ml:reset', onReset);
      window.removeEventListener('ml:algorithm-dataset-loaded', onLoaded);
    };
  }, [applyPoints, location.pathname, reset, train]);

  React.useEffect(() => {
    const attached = loadActiveDatasetMap()[location.pathname];
    if (!attached) return;
    const nextPoints = rowsToPoints(attached.data, undefined, attached.target);
    if (!nextPoints.length) return;
    setLoadedDataset(attached);
    setDatasetKey('loaded');
    setPoints(nextPoints);
    const model = fitPoints(nextPoints);
    if (model) {
      setSlope(model.slope);
      setIntercept(model.intercept);
      setFitted(true);
    }
  }, [location.pathname]);

  const toData = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 1000;
    const py = ((clientY - rect.top) / rect.height) * 455;
    return {
      x: clamp(xMin + ((px - PLOT.left) / PLOT.width) * (xMax - xMin), xMin, xMax),
      y: clamp(yMax - ((py - PLOT.top) / PLOT.height) * (yMax - yMin), yMin, yMax),
    };
  }, [xMax, xMin, yMax, yMin]);

  const movePoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging === null || !canEditPoints) return;
    const next = toData(event.clientX, event.clientY);
    setPoints(current => current.map(point => point.id === dragging ? { ...point, ...next } : point));
    setFitted(false);
  };

  const addPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!canEditPoints || dragging !== null) return;
    const next = toData(event.clientX, event.clientY);
    const id = Math.max(-1, ...points.map(point => point.id)) + 1;
    setPoints(current => [...current, { id, ...next }]);
    setDragging(id);
    setFitted(false);
  };

  const applyNoise = (value: number) => {
    setNoise(value);
    const source = seedPoints.length ? seedPoints : points;
    const nextPoints = source.map((point, index) => ({
      ...point,
      y: point.y + Math.sin((index + 1) * 12.9898) * value * 0.55,
    }));
    applyPoints(nextPoints, true);
  };

  const animateFit = () => {
    const model = fitPoints(points);
    if (!model) return;
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
      else {
        applyFit(model.slope, model.intercept);
        setTraining(false);
        if (activeStep < 3) setActiveStep(3);
      }
    };
    requestAnimationFrame(frame);
  };

  const goToStep = (index: number) => {
    const next = clamp(index, 0, lessonSteps.length - 1);
    if (next >= 3 && points.length >= 2) {
      const model = fitPoints(points);
      if (model) applyFit(model.slope, model.intercept);
    }
    if (next === 4) setShowResiduals(true);
    if (next === 5) {
      setShowEquation(true);
      if (predictX === null) {
        const mid = points[Math.floor(points.length / 2)];
        const fallback = mid?.x ?? meanX;
        setPredictInput(String(Number(fallback.toFixed(2))));
        setPredictX(fallback);
      }
    }
    setActiveStep(next);
  };

  const runPrediction = () => {
    const parsed = parseFiniteNumber(predictInput, 'x');
    if (typeof parsed !== 'number') {
      setPredictX(null);
      setPredictError(parsed.error);
      return;
    }
    setPredictError(null);
    setPredictX(parsed);
    setShowEquation(true);
    if (points.length >= 2 && ols) applyFit(ols.slope, ols.intercept);
  };

  const lineY1 = slope * xMin + intercept;
  const lineY2 = slope * xMax + intercept;
  const band = React.useMemo(() => {
    if (points.length < 3) return null;
    const grid = Array.from({ length: 24 }, (_, i) => xMin + (i * (xMax - xMin)) / 23);
    return simpleLinearIntervals(
      points.map((p) => p.x),
      points.map((p) => p.y),
      slope,
      intercept,
      grid,
    );
  }, [points, slope, intercept, xMin, xMax]);
  const bandPolygon = band
    ? `${band.map((p) => `${sx(p.x)},${sy(p.meanHi)}`).join(' ')} ${[...band].reverse().map((p) => `${sx(p.x)},${sy(p.meanLo)}`).join(' ')}`
    : '';
  const tickCount = 7;
  const xTicks = Array.from({ length: tickCount }, (_, index) => xMin + (index * (xMax - xMin)) / (tickCount - 1));
  const yTicks = Array.from({ length: tickCount }, (_, index) => yMin + (index * (yMax - yMin)) / (tickCount - 1));
  const current = lessonSteps[activeStep] ?? lessonSteps[0];

  return (
    <div className={`slr-shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="slr-sidebar">
        <Link to="/" className="slr-brand" aria-label="Go to Home"><span className="slr-logo">N</span><strong>AlgoViz</strong></Link>
        <div className="slr-outline-head">
          <span>LESSON OUTLINE</span>
          <button type="button" aria-label={collapsed ? 'Expand lesson outline' : 'Collapse lesson outline'} onClick={() => setCollapsed(value => !value)}>
            <ChevronLeft size={19} /><ChevronLeft size={19} />
          </button>
        </div>
        <nav aria-label="Lesson outline" className="slr-lessons">
          {lessonSteps.map((step, index) => (
            <button key={step.title} type="button" className={activeStep === index ? 'active' : ''} onClick={() => goToStep(index)}>
              <span className="slr-step-copy">
                <span>{index + 1}. {step.title}</span>
                {step.hint && <small>{step.hint}</small>}
              </span>
              {index < activeStep ? <Check className="complete" size={16} /> : activeStep === index ? <span className="current-dot" /> : <Circle size={15} />}
            </button>
          ))}
        </nav>
        <div className="slr-tip">
          <div><Lightbulb size={20} /><strong>Learning Tip</strong></div>
          <p>{tipForStep(activeStep)}</p>
          <button type="button" onClick={() => goToStep(0)}>View Formula <Sigma size={18} /></button>
        </div>
        <div className="slr-sidebar-footer">
          <Link to="/documentation"><FileText size={18} />Docs</Link>
          <Link to="/documentation"><BookOpen size={18} />Glossary</Link>
        </div>
      </aside>

      <main className="slr-main">
        <section className="slr-flow" aria-label="Lesson steps">
          {lessonSteps.map((step, index) => (
            <React.Fragment key={step.title}>
              <button type="button" className={activeStep === index ? 'active' : ''} onClick={() => goToStep(index)}>
                <b>{index + 1}</b>
                <span><strong>{step.title}</strong><small>{step.hint}</small></span>
              </button>
              {index < lessonSteps.length - 1 && <span className="flow-dots">•••</span>}
            </React.Fragment>
          ))}
        </section>
        <header className="slr-header">
          <div>
            <div className="slr-title-row"><h1>Simple Linear Regression</h1><span>Beginner</span></div>
            <p>Understand how a straight line can model the relationship between two variables.</p>
          </div>
          <div className="slr-progress">
            <span>Progress</span>
            <div><i style={{ width: `${((activeStep + 1) / lessonSteps.length) * 100}%` }} /></div>
            <b>{activeStep + 1} / {lessonSteps.length}</b>
            <button type="button" onClick={() => goToStep(5)}><Trophy size={18} />Try Predict</button>
          </div>
        </header>

        <nav className="slr-mobile-steps" aria-label="Lesson steps">
          {lessonSteps.map((step, index) => (
            <button key={step.title} type="button" className={activeStep === index ? 'active' : ''} onClick={() => goToStep(index)}>
              {index + 1}. {step.title}
            </button>
          ))}
        </nav>

        <section className="slr-lesson" aria-live="polite">
          <div>
            <small>Step {activeStep + 1} of {lessonSteps.length}</small>
            <h2>{current.title}</h2>
            <p>{current.hint}</p>
          </div>
          <div className="slr-lesson-nav">
            <button type="button" disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)}><ChevronLeft size={16} />Back</button>
            <button type="button" disabled={activeStep === lessonSteps.length - 1} onClick={() => goToStep(activeStep + 1)}>Next<ChevronRight size={16} /></button>
          </div>
        </section>

        {activeStep === 0 && (
          <section className="slr-intro">
            <article>
              <h3>One input, one number to predict</h3>
              <p>Simple linear regression finds the fairest straight line through pairs of <em>x</em> (the clue) and <em>y</em> (the answer). The line is</p>
              <p className="slr-formula">ŷ = b<sub>0</sub> + b<sub>1</sub>x</p>
              <ul>
                <li><strong>b<sub>1</sub> (slope)</strong> — how much ŷ changes when x increases by 1.</li>
                <li><strong>b<sub>0</sub> (intercept)</strong> — the predicted y when x is 0.</li>
                <li><strong>ŷ</strong> — the model’s guess, not the real y.</li>
              </ul>
            </article>
            <article>
              <h3>How the line is chosen</h3>
              <p>Ordinary Least Squares picks the slope and intercept that minimize the sum of squared residuals — the vertical gaps between each point and the line.</p>
              <p>Use it for a numeric target when a roughly straight relationship is plausible: temperature → sales, hours studied → score, size → price.</p>
              <button type="button" className="train-button" onClick={() => goToStep(1)}>Explore the data <ChevronRight size={17} /></button>
            </article>
          </section>
        )}

        <section className={`slr-workspace${activeStep === 0 ? ' preview' : ''}`}>
          <div className="slr-center">
            <div className="slr-chart-card">
              <div className="slr-chart-toolbar">
                <label>
                  <input type="checkbox" checked={residualsOn} onChange={event => setShowResiduals(event.target.checked)} />
                  <span />Show Residuals
                </label>
                <label>
                  <input type="checkbox" checked={showBand} onChange={event => setShowBand(event.target.checked)} />
                  <span />95% mean-response band
                </label>
                {(activeStep === 3 || activeStep === 4) && (
                  <button type="button" onClick={animateFit} disabled={training || points.length < 2}>
                    <Play size={17} />{training ? 'Fitting…' : 'Animate Fit'}
                  </button>
                )}
                <em>
                  {canEditPoints ? <><Hand size={18} />Click empty space to add · drag to move · double-click to remove</>
                    : activeStep === 5 ? <><Target size={18} />Enter x on the right, then Predict to mark ŷ on the chart</>
                    : activeStep === 1 ? <><Database size={18} />This scatter is the selected dataset</>
                    : <><Play size={18} />Train or animate to snap the line to ordinary least squares</>}
                </em>
              </div>
              <svg
                ref={svgRef}
                className={`slr-chart${canEditPoints ? ' editable' : ''}`}
                viewBox="0 0 1000 455"
                role="img"
                aria-label={canEditPoints
                  ? 'Interactive regression chart. Click to add, drag to move, and double click a point to remove it.'
                  : 'Regression chart for the current lesson step.'}
                onPointerMove={movePoint}
                onPointerUp={() => setDragging(null)}
                onPointerLeave={() => setDragging(null)}
                onPointerDown={addPoint}
              >
                <rect x={PLOT.left} y={PLOT.top} width={PLOT.width} height={PLOT.height} fill="transparent" />
                {xTicks.map(tick => <g key={`x-${tick}`}><line x1={sx(tick)} x2={sx(tick)} y1={PLOT.top} y2={PLOT.top + PLOT.height} className="grid-line" /><text x={sx(tick)} y={447} textAnchor="middle">{tick.toFixed(1)}</text></g>)}
                {yTicks.map(tick => <g key={`y-${tick}`}><line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={sy(tick)} y2={sy(tick)} className="grid-line" /><text x={45} y={sy(tick) + 4} textAnchor="end">{tick.toFixed(1)}</text></g>)}
                <line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={PLOT.top + PLOT.height} y2={PLOT.top + PLOT.height} className="axis-line" />
                <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.top + PLOT.height} className="axis-line" />
                <text x="970" y="447" className="axis-name">x</text><text x="29" y="30" className="axis-name">y</text>
                {showBand && showLine && bandPolygon && <polygon points={bandPolygon} className="confidence-band" />}
                {showLine && <line x1={sx(xMin)} y1={sy(lineY1)} x2={sx(xMax)} y2={sy(lineY2)} className="best-line" />}
                {residualsOn && showLine && points.map(point => <line key={`r-${point.id}`} x1={sx(point.x)} x2={sx(point.x)} y1={sy(point.y)} y2={sy(slope * point.x + intercept)} className="residual-line" />)}
                {points.map((point, index) => (
                  <circle
                    key={point.id}
                    cx={sx(point.x)}
                    cy={sy(point.y)}
                    r={selectedPointId === point.id ? 10 : 8}
                    className={`data-point${canEditPoints ? '' : ' locked'}${selectedPointId === point.id ? ' selected' : ''}${largeResidualIds.has(point.id) ? ' outlier' : ''}`}
                    onPointerDown={event => {
                      event.stopPropagation();
                      setSelectedPointId(point.id);
                      if (!canEditPoints) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDragging(point.id);
                    }}
                    onDoubleClick={event => {
                      if (!canEditPoints) return;
                      event.stopPropagation();
                      setPoints(current => current.filter(candidate => candidate.id !== point.id));
                      setFitted(false);
                    }}
                  />
                ))}
                {showPredictionMark && predictedY !== null && (
                  <g className="prediction-mark">
                    <line x1={sx(predictX)} x2={sx(predictX)} y1={PLOT.top} y2={PLOT.top + PLOT.height} />
                    <line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={sy(predictedY)} y2={sy(predictedY)} />
                    <circle cx={sx(predictX)} cy={sy(predictedY)} r="9" />
                    <text x={sx(predictX) + 12} y={sy(predictedY) - 12}>ŷ = {predictedY.toFixed(2)}</text>
                  </g>
                )}
                {showEquation && showLine && <text x="690" y="54" className="chart-equation">{formatLine(slope, intercept)}</text>}
              </svg>
              {points.length === 0 && (
                <p className="slr-empty">No points yet. Open <strong>Place Points</strong> and click the chart to add some.</p>
              )}
              <div className="slr-legend">
                <span><i className="line-key" />Best Fit Line</span>
                <span><i className="point-key" />Data Point</span>
                <span><i className="residual-key" />Residual</span>
                {showPredictionMark && <span><i className="predict-key" />Prediction</span>}
              </div>
            </div>

            {activeStep === 1 && (
              <div className="slr-table-wrap">
                <div className="slr-table-head">
                  <h3>{currentDatasetName}</h3>
                  <p>{currentDatasetStory} · {points.length} pairs</p>
                </div>
                <div className="slr-table-scroll">
                  <table>
                    <thead><tr><th>#</th><th>x</th><th>y</th></tr></thead>
                    <tbody>
                      {points.map((point, index) => (
                        <tr key={point.id}><td>{index + 1}</td><td>{point.x.toFixed(2)}</td><td>{point.y.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="slr-table-wrap">
                <div className="slr-table-head">
                  <h3>Residual table</h3>
                  <p>Residual = y − ŷ. Positive means the point sits above the line.</p>
                </div>
                <div className="slr-table-scroll">
                  <table>
                    <thead><tr><th>x</th><th>y</th><th>ŷ</th><th>error</th></tr></thead>
                    <tbody>
                      {points.map((point, index) => (
                        <tr key={point.id}>
                          <td>{point.x.toFixed(2)}</td>
                          <td>{point.y.toFixed(2)}</td>
                          <td>{predictions[index].toFixed(2)}</td>
                          <td className={residuals[index] >= 0 ? 'pos' : 'neg'}>{residuals[index].toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStep !== 0 && (
              <div className="slr-metrics">
                <article>
                  <h3>Model Equation</h3>
                  <strong className="equation">{formatLine(slope, intercept)}</strong>
                  <p>{lineIsStale ? 'Line is stale — fit again after edits' : 'Ordinary least squares line'}</p>
                </article>
                <article><h3 title="Fraction of target variance explained relative to a mean-baseline prediction. Not accuracy.">R²</h3><strong className="green">{formatR2(inSample?.r2, inSample?.targetVarianceZero)}</strong><p>Explained variance vs mean baseline</p></article>
                <article><h3 title="Average absolute prediction error.">MAE</h3><strong className="yellow">{metricMae.toFixed(3)}</strong><p>Mean Absolute Error</p></article>
                <article><h3>MSE</h3><strong className="yellow">{metricMse.toFixed(3)}</strong><p>Mean Squared Error</p></article>
                <article><h3 title="Square root of average squared error; penalizes larger errors more strongly.">RMSE</h3><strong className="orange">{metricRmse.toFixed(3)}</strong><p>Root Mean Squared Error</p></article>
              </div>
            )}
            {inSample && (
              <RegressionDiagnosticsPanel
                algorithm="Simple Linear Regression"
                dataset={currentDatasetName}
                samples={points.length}
                features={1}
                state={training ? 'TRAINING' : lineIsStale ? 'MODEL STALE' : fitted ? 'TRAINED' : 'NOT TRAINED'}
                hyperparameters={[['slope', slope.toFixed(3)], ['intercept', intercept.toFixed(3)]]}
                train={inSample}
                testActual={actual}
                testPredicted={predictions}
                suitability="Works well for approximately linear relationships between one x and one y."
                complexity="2 coefficients (intercept and slope)"
                extra={selectedPoint ? (
                  <p className="rdp-note">
                    Selected point: x={selectedPoint.x.toFixed(3)}, actual y={selectedPoint.y.toFixed(3)}, predicted ŷ={(slope * selectedPoint.x + intercept).toFixed(3)}, residual={(selectedPoint.y - (slope * selectedPoint.x + intercept)).toFixed(3)}
                    {largeResidualIds.has(selectedPoint.id) ? '. Large residual (not a statistical influence diagnostic).' : '.'}
                  </p>
                ) : <p className="rdp-note">Click a point to inspect x, actual y, predicted y, and residual. Gold marker is the current inference x.</p>}
              />
            )}
          </div>

          <aside className="slr-controls">
            {activeStep === 0 && (
              <>
                <h3>In this lesson</h3>
                <ol className="slr-roadmap">
                  {lessonSteps.map((step, index) => (
                    <li key={step.title}><button type="button" onClick={() => goToStep(index)}>{index + 1}. {step.title}</button></li>
                  ))}
                </ol>
              </>
            )}

            {activeStep === 1 && (
              <>
                <h3>Dataset</h3>
                <DatasetSelect datasetKey={datasetKey} hasLoaded={Boolean(loadedDataset)} loadedName={loadedDataset?.name} onChange={key => { setDatasetKey(key); reset(key); }} />
                <p className="point-count">{points.length} observed pairs</p>
                <hr />
                <h3>Summary</h3>
                <dl className="slr-stats">
                  <div><dt>Mean x</dt><dd>{meanX.toFixed(2)}</dd></div>
                  <div><dt>Mean y</dt><dd>{meanY.toFixed(2)}</dd></div>
                  <div><dt>x range</dt><dd>{points.length ? `${Math.min(...points.map(p => p.x)).toFixed(1)} to ${Math.max(...points.map(p => p.x)).toFixed(1)}` : '—'}</dd></div>
                  <div><dt>y range</dt><dd>{points.length ? `${Math.min(...points.map(p => p.y)).toFixed(1)} to ${Math.max(...points.map(p => p.y)).toFixed(1)}` : '—'}</dd></div>
                </dl>
                <p className="slr-help">The scatter on the left is this table. Switch samples to see a rising trend, a falling trend, or a low-noise line.</p>
                <button type="button" className="train-button" onClick={() => goToStep(2)}>Place your own points <ChevronRight size={17} /></button>
              </>
            )}

            {activeStep === 2 && (
              <>
                <h3>Place points</h3>
                <p>Click empty chart space to add a point, drag a point to move it, or double-click a point to remove it.</p>
                <p className="point-count" title="Click the chart to add; double-click a point to remove"><RotateCcw size={13} />{points.length} points</p>
                <DatasetSelect datasetKey={datasetKey} hasLoaded={Boolean(loadedDataset)} loadedName={loadedDataset?.name} onChange={key => { setDatasetKey(key); reset(key); }} />
                <button type="button" className="reset-button" onClick={() => reset()}>Reset points<RotateCcw size={17} /></button>
                {points.length < 2 && <p className="slr-help">Add at least two points before fitting a line.</p>}
                <button type="button" className="train-button" disabled={points.length < 2} onClick={() => goToStep(3)}>Fit the line <ChevronRight size={17} /></button>
              </>
            )}

            {activeStep === 3 && (
              <>
                <h3>Fit the line</h3>
                <p>Adjust by hand, then train to snap to the OLS solution.</p>
                <Range label="Slope (b₁)" value={slope} min={slopeMin} max={slopeMax} step={.01} onChange={value => { setSlope(value); setFitted(false); }} />
                <Range label="Intercept (b₀)" value={intercept} min={interceptMin} max={interceptMax} step={.01} onChange={value => { setIntercept(value); setFitted(false); }} />
                {ols && <p className="slr-help">OLS target: b₁ = {ols.slope.toFixed(2)}, b₀ = {ols.intercept.toFixed(2)}</p>}
                {points.length < 2 && <p className="slr-help">Need two or more points to fit.</p>}
                <button type="button" className="train-button" onClick={train} disabled={training || points.length < 2}>{training ? 'Training…' : 'Train Model'}<Play size={17} /></button>
                <button type="button" className="reset-button" onClick={animateFit} disabled={training || points.length < 2}>Animate Fit<Play size={17} /></button>
                <button type="button" className="reset-button" onClick={() => reset()}>Reset All<RotateCcw size={17} /></button>
              </>
            )}

            {activeStep === 4 && (
              <>
                <h3>Inspect errors</h3>
                <p>Each dashed stem is a residual. We summarize them with MAE, RMSE, and R².</p>
                <CheckRow label="Show Residuals" checked={residualsOn} onChange={setShowResiduals} />
                <CheckRow label="Show 95% mean-response band" checked={showBand} onChange={setShowBand} />
                {!band && <p className="slr-help">Need at least 3 points with variation in x for a t-based mean-response interval.</p>}
                <hr />
                <dl className="slr-stats">
                  <div><dt>Largest |error|</dt><dd>{residuals.length ? Math.max(...residuals.map(Math.abs)).toFixed(2) : '—'}</dd></div>
                  <div><dt>Above the line</dt><dd>{residuals.filter(value => value > 0).length}</dd></div>
                  <div><dt>Below the line</dt><dd>{residuals.filter(value => value < 0).length}</dd></div>
                </dl>
                <button type="button" className="train-button" onClick={animateFit} disabled={training || points.length < 2}>Refit line<Play size={17} /></button>
                <button type="button" className="reset-button" onClick={() => goToStep(5)}>Make a prediction <ChevronRight size={17} /></button>
              </>
            )}

            {activeStep === 5 && (
              <>
                <h3>Make a prediction</h3>
                <p>Enter an x value. The model returns ŷ = b<sub>0</sub> + b<sub>1</sub>x and marks it on the chart.</p>
                <label className="slr-predict-field">
                  <span>Input x</span>
                  <input
                    aria-label="Prediction input x"
                    type="number"
                    inputMode="decimal"
                    min={xMin}
                    max={xMax}
                    step="0.1"
                    value={predictInput}
                    onChange={event => { setPredictInput(event.target.value); setPredictError(null); }}
                    onKeyDown={event => { if (event.key === 'Enter') runPrediction(); }}
                  />
                </label>
                <button type="button" className="train-button" onClick={runPrediction} disabled={points.length < 2}>
                  Predict ŷ <Target size={17} />
                </button>
                {predictError && <p className="slr-help">{predictError}</p>}
                {predictedY !== null && Number.isFinite(predictedY) ? (
                  <div className="slr-predict-result">
                    <p className="slr-formula compact">ŷ = {intercept.toFixed(2)} {slope >= 0 ? '+' : '−'} {Math.abs(slope).toFixed(2)} × {predictX?.toFixed(2)}</p>
                    <strong>{predictedY.toFixed(2)}</strong>
                    <small>Gold marker on the chart is this prediction.</small>
                  </div>
                ) : (
                  <p className="slr-help">Type a number for x, then Predict.</p>
                )}
                <Range label="Try another x" value={predictX ?? meanX} min={xMin} max={xMax} step={.1} onChange={value => { setPredictX(value); setPredictInput(String(Number(value.toFixed(2)))); }} />
                <CheckRow label="Show Equation on Chart" checked={showEquation} onChange={setShowEquation} />
              </>
            )}

            {(activeStep === 1 || activeStep === 3) && (
              <>
                <hr />
                <h3>Noise (σ)</h3>
                <Range label="Jitter the sample" value={noise} min={0} max={3} step={.1} onChange={applyNoise} />
              </>
            )}
          </aside>
        </section>

        {activeStep === 5 && (
          <section className="slr-challenge">
            <div>
              <h3><Star size={16} fill="#facc15" color="#facc15" /> Quick check</h3>
              <p>{challengeQuestion.prompt}</p>
            </div>
            <div className="slr-choices">
              {challengeQuestion.choices.map(choice => (
                <button
                  key={choice}
                  type="button"
                  className={challengeChoice === choice ? (Number(choice) === challengeQuestion.answer ? 'good' : 'bad') : ''}
                  onClick={() => setChallengeChoice(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
            {challengeChoice && (
              <p>{Number(challengeChoice) === challengeQuestion.answer
                ? 'Correct: 0.80 × 5 + 1.40 = 5.40. That is the same workflow as the Predict control.'
                : 'Not quite. Multiply slope by x, then add the intercept: 0.80 × 5 + 1.40 = 5.40.'}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function tipForStep(step: number) {
  if (step === 0) return 'ŷ is a guess from a line. The real y is the data. The gap between them is the residual.';
  if (step === 1) return 'Look at the cloud first. A rising cloud wants a positive slope; a falling cloud wants a negative one.';
  if (step === 2) return 'Drag points far off the trend to see later how residuals and R² react.';
  if (step === 3) return 'Ordinary Least Squares chooses the line that minimizes the sum of squared vertical errors.';
  if (step === 4) return 'MAE is typical absolute miss. RMSE punishes big misses more. R² is the fraction of variance the line explains.';
  return 'To predict: plug x into ŷ = b0 + b1x. The gold marker is that point on the line.';
}

function DatasetSelect({ datasetKey, hasLoaded, loadedName, onChange }: { datasetKey: DatasetKey; hasLoaded?: boolean; loadedName?: string; onChange: (key: DatasetKey) => void }) {
  return (
    <label className="slr-select">
      <Database size={18} />
      <select value={datasetKey} onChange={event => onChange(event.target.value as DatasetKey)}>
        <option value="a">Perfect positive (y = 1 + 2x)</option>
        <option value="b">Perfect negative</option>
        <option value="c">Noisy linear</option>
        <option value="d">Weak relationship</option>
        <option value="e">Outliers</option>
        <option value="f">Quadratic (x²)</option>
        <option value="k">Piecewise / tree</option>
        <option value="l">Smooth nonlinear</option>
        <option value="m">Constant target</option>
        <option value="students">Student Marks</option>
        <option value="energy">Energy Demand</option>
        {hasLoaded && <option value="loaded">{loadedName ?? 'Loaded dataset'}</option>}
      </select>
      <ChevronDown size={17} />
    </label>
  );
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const bounded = Math.min(max, Math.max(min, value));
  return (
    <label className="slr-range">
      <span><b>{label}</b><output>{value.toFixed(2)}</output></span>
      <input aria-label={label} type="range" value={bounded} min={min} max={max} step={step} onChange={event => onChange(Number(event.target.value))} />
      <small><span>{min.toFixed(1)}</span><span>{max.toFixed(1)}</span></small>
    </label>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="slr-check">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span>{checked && <Check size={13} />}</span>
      {label}
    </label>
  );
}
