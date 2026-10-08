import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, ChevronDown, CircleHelp, Database, Download, GitCompareArrows, LineChart, Pause, Play, RotateCcw, Sigma, SkipForward, SlidersHorizontal, Target, Upload } from 'lucide-react';
import { LabLessonPanel, useUrlTab } from '../../../../components/common/LabTabs';
import { loadActiveDatasetMap } from '../../../../lib/experimentWorkspace';
import { downloadJsonArtifact } from '../../../../lib/modelArtifacts/downloadJsonArtifact';
import { reportTrainingActivity } from '../../../../lib/trainingActivity';
import type { LoadedAlgorithmDataset } from '../../../../data/algorithmDatasets';
import { energyDemandDataset, studentMarksDataset } from '../../../../data/sampleDatasets';
import { datasetAPerfectPositive, datasetBPerfectNegative, datasetCNoisyLinear, datasetEOutliers, labPoints } from '../../../../lib/regression/regressionDatasets';
import './SimpleLinearRegressionPage.css';

type Point = { id: number; x: number; y: number };
type Tab = 'Learn' | 'Visualize' | 'Dataset' | 'Train' | 'Metrics' | 'Compare' | 'Explain';
type DatasetKey = 'study' | 'positive' | 'negative' | 'noisy' | 'outliers' | 'marks' | 'energy' | 'uploaded' | 'loaded';
type Dataset = { name: string; xLabel: string; yLabel: string; points: Point[]; description: string };
type Model = { slope: number; intercept: number; meanX: number; meanY: number };

const tabs: { name: Tab; icon: typeof BookOpen }[] = [
  { name: 'Learn', icon: BookOpen }, { name: 'Visualize', icon: BarChart3 },
  { name: 'Dataset', icon: Database }, { name: 'Train', icon: Play },
  { name: 'Metrics', icon: LineChart }, { name: 'Compare', icon: GitCompareArrows },

];
const steps = ['Inspect Data', 'Calculate x̄', 'Calculate ȳ', 'Calculate deviations', 'Calculate slope', 'Calculate intercept', 'Draw fitted line', 'Generate predictions', 'Calculate residuals', 'Evaluate fit'];

function studentStudyPoints(): Point[] {
  let seed = 5129;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: 100 }, (_, id) => {
    const x = (id + .5) / 10;
    const gaussian = Math.sqrt(-2 * Math.log(Math.max(1e-8, random()))) * Math.cos(2 * Math.PI * random());
    return { id, x, y: id === 65 ? 78 : 31.42 + 6.87 * x + gaussian * 9.2 };
  });
}
function numericPoints(rows: Array<Record<string, unknown>>, xKey?: string, yKey?: string): Point[] {
  if (!rows.length) return [];
  const columns = Object.keys(rows[0] ?? {}).filter(key => !/^id$|_id$/i.test(key) && rows.some(row => Number.isFinite(Number(row[key]))));
  const yColumn = yKey && columns.includes(yKey) ? yKey : columns.find(column => column !== (xKey ?? columns[0])) ?? columns[1];
  const xColumn = xKey && columns.includes(xKey) ? xKey : columns.find(column => column !== yColumn);
  if (!xColumn || !yColumn || xColumn === yColumn) return [];
  return rows.map((row, id) => ({ id, x: Number(row[xColumn]), y: Number(row[yColumn]) }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
}
const builtins: Record<Exclude<DatasetKey, 'uploaded' | 'loaded'>, Dataset> = {
  study: { name: 'Student Study Hours vs Exam Score', xLabel: 'Study Hours', yLabel: 'Exam Score', points: studentStudyPoints(), description: '100 students with study hours and continuous exam scores.' },
  positive: { name: 'Perfect Positive Linear', xLabel: 'Feature x', yLabel: 'Target y', points: labPoints(datasetAPerfectPositive), description: datasetAPerfectPositive.description },
  negative: { name: 'Perfect Negative Linear', xLabel: 'Feature x', yLabel: 'Target y', points: labPoints(datasetBPerfectNegative), description: datasetBPerfectNegative.description },
  noisy: { name: 'Noisy Linear', xLabel: 'Feature x', yLabel: 'Target y', points: labPoints(datasetCNoisyLinear()), description: datasetCNoisyLinear().description },
  outliers: { name: 'Outlier Dataset', xLabel: 'Feature x', yLabel: 'Target y', points: labPoints(datasetEOutliers), description: datasetEOutliers.description },
  marks: { name: 'Student Marks', xLabel: 'Study Hours', yLabel: 'Marks', points: numericPoints(studentMarksDataset.data as Array<Record<string, unknown>>, 'study_hours', 'marks'), description: 'The existing student marks dataset.' },
  energy: { name: 'Energy Demand', xLabel: 'Temperature', yLabel: 'Demand', points: numericPoints(energyDemandDataset.data as Array<Record<string, unknown>>, 'temperature_c', 'demand_mw'), description: 'The existing energy demand dataset.' },
};
function fitLine(points: Point[]): Model | null {
  if (points.length < 2) return null;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const sxx = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (sxx <= 1e-12) return null;
  const sxy = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const slope = sxy / sxx;
  return { slope, intercept: meanY - slope * meanX, meanX, meanY };
}
function measure(points: Point[], model: Model) {
  const residuals = points.map(point => point.y - (model.intercept + model.slope * point.x));
  const sse = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const mse = points.length ? sse / points.length : 0;
  const mae = points.length ? residuals.reduce((sum, residual) => sum + Math.abs(residual), 0) / points.length : 0;
  const sst = points.reduce((sum, point) => sum + (point.y - model.meanY) ** 2, 0);
  return { residuals, sse, mse, rmse: Math.sqrt(mse), mae, r2: sst > 1e-12 ? 1 - sse / sst : null };
}
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
const equation = (model: Model) => `ŷ = ${model.intercept.toFixed(2)} ${model.slope >= 0 ? '+' : '−'} ${Math.abs(model.slope).toFixed(2)}x`;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
function chartDomain(points: Point[], model: Model) {
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const xPad = Math.max((maxX - minX) * .04, .1);
  const xMin = minX >= 0 && minX < 1 ? 0 : minX - xPad;
  const xMax = maxX <= 10.1 && maxX > 8 ? Math.max(10, maxX) : maxX + xPad;
  const predicted = [model.intercept + model.slope * xMin, model.intercept + model.slope * xMax];
  const minY = Math.min(...ys, ...predicted), maxY = Math.max(...ys, ...predicted);
  const yMin = minY > 0 && maxY > 80 ? 0 : minY - Math.max((maxY - minY) * .08, 1);
  const yMax = minY > 0 && maxY > 80 && maxY < 120 ? 120 : maxY + Math.max((maxY - minY) * .08, 1);
  return { xMin, xMax, yMin, yMax };
}
function chartTicks(min: number, max: number, count = 6) {
  const raw = (max - min) / count || 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find(value => value * power >= raw) ?? 10) * power;
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max + step * .001; value += step) ticks.push(Number(value.toFixed(8)));
  return ticks;
}

function RegressionChart({ points, model, autoModel, manualModel, xLabel, yLabel, predictionX, showProbe, showResiduals, showMean, showTriangle, showManual, editable, selectedId, onSelect, onPointChange }: {
  points: Point[]; model: Model; autoModel: Model; manualModel: Model; xLabel: string; yLabel: string; predictionX: number;
  showProbe: boolean; showResiduals: boolean; showMean: boolean; showTriangle: boolean; showManual: boolean; editable: boolean;
  selectedId: number | null; onSelect: (id: number) => void;
  onPointChange: (id: number, x: number, y: number) => void;
}) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const resize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const domain = chartDomain(points, autoModel);
  const { xMin, xMax, yMin, yMax } = domain;
  const mobile = viewportWidth <= 900;
  const width = mobile ? Math.max(280, viewportWidth - 48) : 1100, height = mobile ? 300 : 270, left = mobile ? 45 : 63, right = 20, top = 10, bottom = 38;
  const sx = (x: number) => left + ((x - xMin) / (xMax - xMin)) * (width - left - right);
  const sy = (y: number) => top + ((yMax - y) / (yMax - yMin)) * (height - top - bottom);
  const highlighted = points.find(point => point.id === hoverId) ?? points.find(point => point.id === selectedId) ?? null;
  const baseX = clamp(autoModel.meanX - (xMax - xMin) * .12, xMin, xMax);
  const tipX = clamp(baseX + (xMax - xMin) * .16, xMin, xMax);
  const baseY = autoModel.intercept + autoModel.slope * baseX;
  const tipY = autoModel.intercept + autoModel.slope * tipX;
  const predictionY = model.intercept + model.slope * predictionX;
  const xTicks = chartTicks(xMin, xMax), yTicks = chartTicks(yMin, yMax);
  return <div className="slr2-plot-wrap">
    <svg className="slr2-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Scatterplot of ${xLabel} versus ${yLabel}, fitted line, and residuals`}>
      {xTicks.map(value => <g key={`x${value}`}><line className="slr2-grid" x1={sx(value)} x2={sx(value)} y1={top} y2={height-bottom} /><text x={sx(value)} y={height-15} textAnchor="middle">{Number(value.toFixed(1))}</text></g>)}
      {yTicks.map(value => <g key={`y${value}`}><line className="slr2-grid" x1={left} x2={width-right} y1={sy(value)} y2={sy(value)} /><text x={left-12} y={sy(value)+4} textAnchor="end">{Number(value.toFixed(1))}</text></g>)}
      <line className="slr2-axis" x1={left} x2={width-right} y1={height-bottom} y2={height-bottom} />
      <text className="slr2-axis-label" x={width/2} y={height-1} textAnchor="middle">{xLabel}</text>
      <text className="slr2-axis-label" transform={`translate(18 ${height/2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
      {showResiduals && points.map(point => <line key={`r${point.id}`} className="slr2-residual" x1={sx(point.x)} x2={sx(point.x)} y1={sy(point.y)} y2={sy(model.intercept+model.slope*point.x)} />)}
      <line className="slr2-fit-line" x1={sx(xMin)} y1={sy(autoModel.intercept+autoModel.slope*xMin)} x2={sx(xMax)} y2={sy(autoModel.intercept+autoModel.slope*xMax)} />
      {showManual && <line className="slr2-manual-line" x1={sx(xMin)} y1={sy(manualModel.intercept+manualModel.slope*xMin)} x2={sx(xMax)} y2={sy(manualModel.intercept+manualModel.slope*xMax)} />}
      {showMean && <g className="slr2-mean"><line x1={sx(autoModel.meanX)} x2={sx(autoModel.meanX)} y1={top} y2={height-bottom} /><line x1={left} x2={width-right} y1={sy(autoModel.meanY)} y2={sy(autoModel.meanY)} /><circle cx={sx(autoModel.meanX)} cy={sy(autoModel.meanY)} r="7" /><text x={sx(autoModel.meanX)+11} y={sy(autoModel.meanY)-8}>Mean (x̄, ȳ)</text></g>}
      {showTriangle && <g className="slr2-triangle"><path d={`M${sx(baseX)},${sy(baseY)} L${sx(tipX)},${sy(baseY)} L${sx(tipX)},${sy(tipY)}`} /><text x={(sx(baseX)+sx(tipX))/2} y={sy(baseY)+16}>Run</text><text x={sx(tipX)+22} y={(sy(baseY)+sy(tipY))/2}>Rise</text></g>}
      {points.map(point => <circle key={point.id} className={`slr2-point${point.id === (hoverId ?? selectedId) ? ' selected' : ''}${editable ? ' editable' : ''}`} cx={sx(point.x)} cy={sy(point.y)} r={point.id === (hoverId ?? selectedId) ? 6 : 4.5} tabIndex={0} role="button" aria-label={`Point ${point.id+1}: x ${point.x.toFixed(2)}, actual y ${point.y.toFixed(2)}${editable ? '. Drag or use arrow keys to edit' : ''}`} onMouseEnter={() => setHoverId(point.id)} onMouseLeave={() => setHoverId(null)} onFocus={() => setHoverId(point.id)} onBlur={() => setHoverId(null)} onClick={() => onSelect(point.id)} onPointerDown={event => {
        if (!editable) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        onSelect(point.id);
      }} onPointerMove={event => {
        if (!editable || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const svg = event.currentTarget.ownerSVGElement;
        const matrix = svg?.getScreenCTM();
        if (!svg || !matrix) return;
        const cursor = svg.createSVGPoint();
        cursor.x = event.clientX; cursor.y = event.clientY;
        const position = cursor.matrixTransform(matrix.inverse());
        onPointChange(point.id, clamp(xMin + (position.x-left)/(width-left-right)*(xMax-xMin), xMin, xMax), clamp(yMax - (position.y-top)/(height-top-bottom)*(yMax-yMin), yMin, yMax));
      }} onPointerUp={event => { if (editable && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(point.id); return; }
        if (!editable || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault(); onSelect(point.id);
        const dx = (xMax-xMin)/100, dy = (yMax-yMin)/100;
        onPointChange(point.id, clamp(point.x + (event.key === 'ArrowRight' ? dx : event.key === 'ArrowLeft' ? -dx : 0), xMin, xMax), clamp(point.y + (event.key === 'ArrowUp' ? dy : event.key === 'ArrowDown' ? -dy : 0), yMin, yMax));
      }} />)}
      {showProbe && <g className="slr2-probe"><line x1={sx(predictionX)} x2={sx(predictionX)} y1={sy(predictionY)} y2={height-bottom} /><circle cx={sx(predictionX)} cy={sy(predictionY)} r="5" /></g>}
    </svg>
    {highlighted && <div className="slr2-tooltip" style={{ left: `${clamp(sx(highlighted.x)/width*100, 15, 86)}%`, top: `${clamp(sy(highlighted.y)/height*100, 19, 80)}%` }} role="status"><b>x = {highlighted.x.toFixed(2)}</b><span>actual y = {highlighted.y.toFixed(2)}</span><span>predicted ŷ = {(model.intercept+model.slope*highlighted.x).toFixed(2)}</span><span>residual = {signed(highlighted.y-(model.intercept+model.slope*highlighted.x))}</span></div>}
  </div>;
}

function ResidualPlot({ points, model }: { points: Point[]; model: Model }) {
  const rows = points.map(point => ({ predicted: model.intercept+model.slope*point.x, residual: point.y-(model.intercept+model.slope*point.x) }));
  const predictions = rows.map(row => row.predicted);
  const min = Math.min(...predictions), max = Math.max(...predictions);
  const spread = Math.max(1, ...rows.map(row => Math.abs(row.residual)));
  const sx = (x: number) => 27 + ((x-min)/(max-min || 1))*330;
  const sy = (y: number) => 52 - y/spread*34;
  return <svg className="slr2-residual-plot" viewBox="0 0 380 105" role="img" aria-label="Residuals by predicted value"><line x1="27" x2="357" y1="52" y2="52" /><text x="6" y="55">0</text>{rows.map((row, index) => <circle key={index} cx={sx(row.predicted)} cy={sy(row.residual)} r="2.7" />)}<text x="190" y="101" textAnchor="middle">Predicted Value (ŷ)</text></svg>;
}

export default function SimpleLinearRegressionPage() {
  const location = useLocation();
  const [tab, setTab] = useUrlTab<Tab>('Learn');
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('study');
  const [customDataset, setCustomDataset] = useState<Dataset | null>(null);
  const [points, setPoints] = useState<Point[]>(() => builtins.study.points.map(point => ({ ...point })));
  const [manual, setManual] = useState({ slope: 6.87, intercept: 31.42 });
  useEffect(() => { if (tab === 'Explain') setTab('Train'); }, [tab, setTab]);
  const [predictionX, setPredictionX] = useState(6.5);
  const [showResiduals, setShowResiduals] = useState(true);
  const [showMean, setShowMean] = useState(false);
  const [showTriangle, setShowTriangle] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newPoint, setNewPoint] = useState({ x: 6.5, y: 80 });
  const [step, setStep] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [dataMessage, setDataMessage] = useState('');
  const [pendingCsv, setPendingCsv] = useState<{ name: string; columns: string[]; rows: string[][] } | null>(null);
  const [csvX, setCsvX] = useState('');
  const [csvY, setCsvY] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const attachedKey = useRef('');
  const dataset = datasetKey === 'uploaded' || datasetKey === 'loaded' ? customDataset ?? builtins.study : builtins[datasetKey];
  const auto = useMemo(() => fitLine(points), [points]);
  const fallback: Model = { slope: 0, intercept: 0, meanX: 0, meanY: 0 };
  const best = auto ?? fallback;
  const bestStats = measure(points, best);
  const { xMin, xMax } = chartDomain(points, best);
  const selected = points.find(point => point.id === selectedId) ?? null;
  const progress = Math.round((step+1)/steps.length*100);

  const editPoint = (id: number, x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setPoints(current => {
      const next = current.map(point => point.id === id ? { ...point, x, y } : point);
      return fitLine(next) ? next : current;
    });
  };
  const addPoint = () => {
    if (!Number.isFinite(newPoint.x) || !Number.isFinite(newPoint.y)) { setDataMessage('Enter finite x and y values.'); return; }
    const id = Math.max(-1, ...points.map(point => point.id)) + 1;
    setPoints(current => [...current, { id, ...newPoint }]);
    setSelectedId(id);
    setDataMessage('Point added. The fitted model and metrics updated immediately.');
  };
  const removePoint = (id: number) => {
    const next = points.filter(point => point.id !== id);
    if (!fitLine(next)) { setDataMessage('Keep at least two points with different x values.'); return; }
    setPoints(next);
    setSelectedId(null);
    setDataMessage('Point removed. The fitted model and metrics updated immediately.');
  };

  const applyDataset = (next: Dataset, key: DatasetKey) => {
    const copied = next.points.map(point => ({ ...point }));
    const nextFit = fitLine(copied);
    if (!nextFit) { setDataMessage('The dataset needs at least two different x values.'); return; }
    setDatasetKey(key); setPoints(copied); setManual({ slope: nextFit.slope, intercept: nextFit.intercept });
    setPredictionX(key === 'study' ? 6.5 : nextFit.meanX);
    setNewPoint({ x: nextFit.meanX, y: nextFit.meanY });
    setSelectedId(null);
    setStep(4); setPlaying(false); setShowResiduals(true); setShowMean(false); setShowTriangle(false); setDataMessage('');
  };
  const switchDataset = (key: DatasetKey) => {
    if (key === 'uploaded' || key === 'loaded') { if (customDataset) applyDataset(customDataset, key); return; }
    applyDataset(builtins[key], key);
  };
  const reset = () => applyDataset(dataset, datasetKey);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep(current => {
      if (current >= steps.length-1) { setPlaying(false); reportTrainingActivity({ kind: 'complete', message: 'Training walkthrough completed · ordinary least squares fit and residuals evaluated', current: 10, total: 10 }); return current; }
      reportTrainingActivity({ kind: 'progress', message: `Step ${current+2}/10 · ${steps[current+1]}`, current: current+2, total: 10 });
      return current+1;
    }), 850);
    return () => window.clearInterval(timer);
  }, [playing]);
  const startPlayback = (restart: boolean) => {
    if (restart || step >= 9) setStep(0);
    setPlaying(true);
    reportTrainingActivity({ kind: 'start', message: `Regression training started · ${points.length} observations · OLS`, current: 0, total: 10 });
  };
  const resetRef = useRef(reset);
  const playbackRef = useRef(startPlayback);
  const loadAttached = (loaded: LoadedAlgorithmDataset) => {
    const next = numericPoints(loaded.data, undefined, loaded.target);
    if (!fitLine(next)) { setDataMessage('Loaded dataset needs numeric x and y columns with varying x values.'); return; }
    const entry: Dataset = { name: loaded.name, xLabel: loaded.columns.find(column => column !== loaded.target) ?? 'Feature x', yLabel: loaded.target ?? 'Target y', points: next, description: loaded.description ?? 'Dataset Manager selection' };
    setCustomDataset(entry); applyDataset(entry, 'loaded');
  };
  const loadRef = useRef(loadAttached);
  useEffect(() => { resetRef.current = reset; playbackRef.current = startPlayback; loadRef.current = loadAttached; });
  useEffect(() => {
    const attached = loadActiveDatasetMap()[location.pathname];
    if (attached) {
      const key = `${attached.id}:${attached.data.length}`;
      if (key !== attachedKey.current) {
        attachedKey.current = key;
        queueMicrotask(() => loadRef.current(attached));
      }
    }
    const onLoaded = (event: Event) => {
      const detail = (event as CustomEvent<{ route?: string; dataset?: LoadedAlgorithmDataset }>).detail;
      if (!detail?.dataset || (detail.route && detail.route !== location.pathname)) return;
      const key = `${detail.dataset.id}:${detail.dataset.data.length}`;
      if (key === attachedKey.current) return;
      attachedKey.current = key; loadRef.current(detail.dataset);
    };
    const onTrain = () => { setTab('Train'); playbackRef.current(true); };
    const onReset = () => resetRef.current();
    window.addEventListener('ml:algorithm-dataset-loaded', onLoaded);
    window.addEventListener('ml:train', onTrain);
    window.addEventListener('ml:reset', onReset);
    return () => { window.removeEventListener('ml:algorithm-dataset-loaded', onLoaded); window.removeEventListener('ml:train', onTrain); window.removeEventListener('ml:reset', onReset); };
  // Event handlers use refs so app shortcuts always operate on the current dataset.
  }, [location.pathname, setTab]);
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 5) { setDataMessage('CSV needs a header and at least four numeric rows.'); return; }
    const columns = lines[0].split(',').map(value => value.trim());
    if (columns.length < 2 || new Set(columns).size !== columns.length) { setDataMessage('CSV needs two or more distinct column names.'); return; }
    const rows = lines.slice(1).map(line => line.split(',').map(value => value.trim()));
    setPendingCsv({ name: file.name.replace(/\.csv$/i, ''), columns, rows }); setCsvX(columns[0]); setCsvY(columns[1]); setDataMessage('Choose the x feature and y target, then load the CSV.');
    event.target.value = '';
  };
  const importCsv = () => {
    if (!pendingCsv || csvX === csvY) { setDataMessage('Choose different columns for x and y.'); return; }
    const xi = pendingCsv.columns.indexOf(csvX), yi = pendingCsv.columns.indexOf(csvY);
    const valid = pendingCsv.rows.filter(row => row.length === pendingCsv.columns.length && row[xi] !== '' && row[yi] !== '').map((row, id) => ({ id, x: Number(row[xi]), y: Number(row[yi]) })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (valid.length < 4 || !fitLine(valid)) { setDataMessage('CSV needs four valid numeric rows and nonzero variance in x.'); return; }
    const entry: Dataset = { name: pendingCsv.name, xLabel: csvX, yLabel: csvY, points: valid, description: `Imported ${valid.length} numeric observations.` };
    setCustomDataset(entry); applyDataset(entry, 'uploaded'); setPendingCsv(null);
  };
  const exportModel = () => downloadJsonArtifact('simple-linear-regression-model.json', { format: 'ml-suite-linear-regression-v1', algorithm: 'Simple Linear Regression', createdAt: new Date().toISOString(), datasetName: dataset.name, inputFeatures: [dataset.xLabel], target: dataset.yLabel, coefficients: { intercept: best.intercept, weights: [best.slope] }, trainingSamples: points.length, metrics: { mae: bestStats.mae, rmse: bestStats.rmse, r2: bestStats.r2 } });

  return <div className="slr2-page">
    <header className="slr2-header">
      <div className="slr2-title-area"><span className="slr2-icon"><svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="M8 5v37h37" stroke="currentColor" strokeWidth="2"/><path d="M10 35 22 27 31 20 43 9" stroke="currentColor" strokeWidth="2.5"/><circle cx="18" cy="29" r="2.5" fill="currentColor"/><circle cx="30" cy="23" r="2.5" fill="currentColor"/><circle cx="40" cy="12" r="2.5" fill="currentColor"/></svg></span><div><h1>Simple Linear Regression</h1><p>Learn how a straight line models the relationship between one input feature and a continuous target.</p></div></div>
      <div className="slr2-header-actions"><span className="slr2-dataset-badge">{datasetKey === 'study' ? 'Student Scores Dataset' : dataset.name}</span><span>Lesson Progress</span><div className="slr2-progress"><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b><button type="button" onClick={() => { setTab('Train'); startPlayback(false); }}>Resume <Play size={16}/></button><CircleHelp size={20}/></div>
    </header>
    <nav className="slr2-tabs" aria-label="Regression sections" role="tablist">{tabs.map(({ name, icon: Icon }) => <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}><Icon size={20}/>{name === 'Train' ? 'Train and Test' : name}</button>)}</nav>
    {tab === 'Dataset' && <><div className="slr2-dataset-bar"><b>DATASET</b><label className="slr2-dataset-select"><Database size={16}/><select aria-label="Regression dataset" value={datasetKey} onChange={event => switchDataset(event.target.value as DatasetKey)}>{(Object.entries(builtins) as [Exclude<DatasetKey, 'uploaded' | 'loaded'>, Dataset][]).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}{customDataset && <option value={datasetKey === 'loaded' ? 'loaded' : 'uploaded'}>{customDataset.name}</option>}</select><ChevronDown size={16}/></label><span>{points.length} samples • 1 feature • continuous target</span><div className="slr2-dataset-actions"><button type="button" onClick={reset}><RotateCcw size={16}/>Reset Dataset</button><button type="button" onClick={() => fileRef.current?.click()}><Upload size={16}/>Upload CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile}/></div></div>
    {pendingCsv && <div className="slr2-csv-panel"><strong>Import {pendingCsv.name}</strong><label>X Feature<select value={csvX} onChange={event => setCsvX(event.target.value)}>{pendingCsv.columns.map(column => <option key={column}>{column}</option>)}</select></label><label>Y Target<select value={csvY} onChange={event => setCsvY(event.target.value)}>{pendingCsv.columns.map(column => <option key={column}>{column}</option>)}</select></label><button type="button" onClick={importCsv}>Load CSV</button><button type="button" onClick={() => setPendingCsv(null)}>Cancel</button></div>}
    {dataMessage && <p className="slr2-message" role="status">{dataMessage}</p>}</>}

    {tab === 'Learn' ? <div className="slr2-other"><LabLessonPanel tab="Learn" route="/ml/supervised/simple-linear-regression" /></div> : tab === 'Dataset' ? <section className="slr2-other slr2-data-table"><h2>{dataset.name}</h2><p>{dataset.description} Edit a value to retrain the line immediately, or add and remove points below.</p><div className="slr2-point-editor"><label>New {dataset.xLabel}<input aria-label="New point x" type="number" step="any" value={newPoint.x} onChange={event => setNewPoint(current => ({ ...current, x: Number(event.target.value) }))}/></label><label>New {dataset.yLabel}<input aria-label="New point y" type="number" step="any" value={newPoint.y} onChange={event => setNewPoint(current => ({ ...current, y: Number(event.target.value) }))}/></label><button type="button" onClick={addPoint}>Add point</button><span role="status">Live fit: {equation(best)} · R² {bestStats.r2?.toFixed(3) ?? '—'}</span></div><table><thead><tr><th>#</th><th>{dataset.xLabel}</th><th>{dataset.yLabel}</th><th>Action</th></tr></thead><tbody>{points.map((point, index) => <tr key={point.id}><td>{index+1}</td><td><input aria-label={`Point ${index+1} x`} type="number" step="any" value={point.x} onChange={event => editPoint(point.id, Number(event.target.value), point.y)}/></td><td><input aria-label={`Point ${index+1} y`} type="number" step="any" value={point.y} onChange={event => editPoint(point.id, point.x, Number(event.target.value))}/></td><td><button type="button" aria-label={`Remove point ${index+1}`} onClick={() => removePoint(point.id)}>Remove</button></td></tr>)}</tbody></table></section> : tab === 'Metrics' ? <section className="slr2-other"><h2>Model metrics from {points.length} observations</h2><p>Metrics describe the least-squares fit on the current dataset. R² measures the share of target variation explained by the line.</p><div className="slr2-metric-grid">{[['R²', bestStats.r2 === null ? '—' : bestStats.r2.toFixed(3)], ['MSE', bestStats.mse.toFixed(2)], ['RMSE', bestStats.rmse.toFixed(2)], ['MAE', bestStats.mae.toFixed(2)], ['SSE', bestStats.sse.toFixed(1)]].map(([name, value]) => <article key={name}><span>{name}</span><strong>{value}</strong></article>)}</div><h3>Residuals by predicted value</h3><ResidualPlot points={points} model={best}/><p>Residual = actual − predicted. A random spread around zero supports a linear fit; a curved pattern suggests the line misses structure.</p></section> : <div className="slr2-layout">
      <div className="slr2-left">
        {tab === 'Train' && <div className="slr2-step-list"><h2>Training walkthrough</h2>{steps.map((name, index) => <button key={name} type="button" className={step === index ? 'active' : ''} onClick={() => { setStep(index); setPlaying(false); }}>{index+1}. {name}</button>)}</div>}
        {tab === 'Compare' && <div className="slr2-compare-note"><b>Compare fit lines</b><span>Best-fit SSE {bestStats.sse.toFixed(1)} · Manual SSE {measure(points, { ...best, ...manual }).sse.toFixed(1)}</span></div>}
        <article className="slr2-chart-card"><div className="slr2-chart-heading"><strong>{tab === 'Train' ? 'Fit the regression line' : tab === 'Compare' ? 'Compare fitted and manual lines' : 'Explore the regression fit'}</strong><div className="slr2-chart-legend" aria-label="Chart colors"><span><i className="point"/>Data points</span><span><i className="fit"/>Fitted line</span>{tab === 'Compare' && <span><i className="manual"/>Manual line</span>}</div>{tab === 'Train' && <div><button type="button" onClick={() => startPlayback(true)}><Play size={16}/>Play</button><button type="button" onClick={() => { if (playing) setPlaying(false); else startPlayback(false); }}>{playing ? <Pause size={16}/> : <Play size={16}/ >}{playing ? 'Pause' : 'Resume'}</button><button type="button" onClick={() => { setPlaying(false); setStep(current => Math.min(9, current+1)); }}><SkipForward size={16}/>Step</button><button type="button" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={16}/>Restart</button><span>Step {step+1} / 10 · {steps[step]}</span></div>}</div>
          <RegressionChart points={points} model={tab === 'Compare' ? { ...best, ...manual } : best} autoModel={best} manualModel={{ ...best, ...manual }} xLabel={dataset.xLabel} yLabel={dataset.yLabel} predictionX={predictionX} showProbe={tab === 'Visualize'} showResiduals={tab === 'Visualize' && showResiduals} showMean={tab === 'Visualize' && showMean} showTriangle={tab === 'Visualize' && showTriangle} showManual={tab === 'Compare'} editable={tab === 'Visualize'} selectedId={selectedId} onSelect={setSelectedId} onPointChange={editPoint}/>
          <p className="slr2-chart-caption">{tab === 'Compare' ? 'Orange is the least-squares line; purple is your manual line.' : tab === 'Train' ? 'Follow the ten steps from inspecting the observations to evaluating the fitted line.' : 'Drag a blue point to change the dataset. The orange line, prediction, residuals, and metrics retrain immediately.'}</p>
        </article>
        {tab === 'Visualize' && <div className="slr2-visual-summary"><article className="slr2-equation-card"><h3><Sigma size={22}/>Fitted line</h3><div className="slr2-equation">{equation(best)}</div></article><article className="slr2-prediction-card"><h3><Target size={18}/>Prediction at x = {predictionX.toFixed(2)}</h3><b>ŷ = {(best.intercept + best.slope * predictionX).toFixed(2)}</b></article></div>}
        {tab === 'Train' && <section className="slr2-other slr2-inference">
      <h2>Live test / inference</h2>
      <p>Enter a new {dataset.xLabel.toLowerCase()} value to predict {dataset.yLabel.toLowerCase()} with the fitted line from {dataset.name}.</p>
      <label>{dataset.xLabel}<input aria-label="Inference input" type="number" step="any" value={predictionX} onChange={event => setPredictionX(Number(event.target.value))}/></label>
      <div className="slr2-inference-result" role="status"><span>Predicted {dataset.yLabel}</span><strong>{(best.intercept + best.slope * predictionX).toFixed(2)}</strong></div>
      <p>{equation(best)} → {best.intercept.toFixed(2)} {best.slope >= 0 ? '+' : '−'} {Math.abs(best.slope).toFixed(2)} × {predictionX.toFixed(2)}</p>
      {(predictionX < xMin || predictionX > xMax) && <p className="slr2-inference-warning">This input is outside the observed range; the line is extrapolating.</p>}
    </section>}
        {tab === 'Train' && <div className="slr2-training-status" role="status"><strong>{playing ? 'Training walkthrough running' : step === 9 ? 'Training walkthrough completed' : 'Training walkthrough paused'}</strong><span>Step {step+1} of 10 · {steps[step]}</span><div className="slr2-progress"><i style={{ width: `${progress}%` }} /></div></div>}
      </div>
      <aside className="slr2-right">
        {tab === 'Visualize' && <section className="slr2-controls"><h2><SlidersHorizontal size={19}/>VISUALIZATION CONTROLS</h2>
          <p className="slr2-live-fit" role="status">● Live auto-fit · {points.length} points · R² {bestStats.r2?.toFixed(3) ?? '—'}</p>
          <p className="slr2-field-label">Fitted parameters</p><div className="slr2-parameters"><div><span>Slope (b₁)</span><strong>{best.slope.toFixed(2)}</strong></div><div><span>Intercept (b₀)</span><strong>{best.intercept.toFixed(2)}</strong></div></div>
          <div className="slr2-point-editor slr2-sidebar-editor"><label>New {dataset.xLabel}<input aria-label="New point x" type="number" step="any" value={newPoint.x} onChange={event => setNewPoint(current => ({ ...current, x: Number(event.target.value) }))}/></label><label>New {dataset.yLabel}<input aria-label="New point y" type="number" step="any" value={newPoint.y} onChange={event => setNewPoint(current => ({ ...current, y: Number(event.target.value) }))}/></label><button type="button" onClick={addPoint}>Add point</button>{selected && <button type="button" onClick={() => removePoint(selected.id)}>Remove selected</button>}</div>
          <div className="slr2-editor-actions"><button type="button" onClick={() => setTab('Dataset')}>Edit all points</button><button type="button" onClick={reset}><RotateCcw size={14}/>Reset points</button></div>
          <label className="slr2-prediction-slider">Prediction X ({dataset.xLabel}) <output>{predictionX.toFixed(2)}</output><input aria-label="Prediction X" type="range" min={xMin} max={xMax} step={(xMax-xMin)/200} value={predictionX} onChange={event => setPredictionX(Number(event.target.value))}/><span><small>{Number(xMin.toFixed(1))}</small><small>{Number(xMax.toFixed(1))}</small></span></label>
          <div className="slr2-switches"><label><input type="checkbox" checked={showResiduals} onChange={event => setShowResiduals(event.target.checked)}/><span/>Show Residuals</label><label><input type="checkbox" checked={showMean} onChange={event => setShowMean(event.target.checked)}/><span/>Show Mean Point</label><label><input type="checkbox" checked={showTriangle} onChange={event => setShowTriangle(event.target.checked)}/><span/>Show Slope Triangle</label></div>
        </section>}
        {tab === 'Train' && <><section className="slr2-controls"><h2><SlidersHorizontal size={19}/>TRAINED PARAMETERS</h2><p>The least-squares coefficients are recalculated when the dataset changes.</p><div className="slr2-parameters"><div><span>Slope (b₁)</span><strong>{best.slope.toFixed(2)}</strong></div><div><span>Intercept (b₀)</span><strong>{best.intercept.toFixed(2)}</strong></div></div></section><button type="button" className="slr2-export" onClick={exportModel}><Download size={16}/>Export fitted model</button></>}
        {tab === 'Compare' && <section className="slr2-controls"><h2><GitCompareArrows size={19}/>MANUAL LINE EXPERIMENT</h2><p>Change one coefficient and compare its squared error with the best fit.</p><div className="slr2-manual-panel"><label>Manual Slope <output>{manual.slope.toFixed(2)}</output><input aria-label="Manual Slope" type="range" min={Math.floor(best.slope-Math.max(10,Math.abs(best.slope)*2))} max={Math.ceil(best.slope+Math.max(10,Math.abs(best.slope)*2))} step="0.05" value={manual.slope} onChange={event => setManual(value => ({ ...value, slope: Number(event.target.value) }))}/></label><label>Manual Intercept <output>{manual.intercept.toFixed(2)}</output><input aria-label="Manual Intercept" type="range" min={Math.floor(best.intercept-Math.max(30,Math.abs(best.intercept)))} max={Math.ceil(best.intercept+Math.max(30,Math.abs(best.intercept)))} step="0.1" value={manual.intercept} onChange={event => setManual(value => ({ ...value, intercept: Number(event.target.value) }))}/></label><p>Optimal SSE: {bestStats.sse.toFixed(1)} · Manual SSE: {measure(points, { ...best, ...manual }).sse.toFixed(1)}</p></div></section>}
      </aside>
    </div>}
  </div>;
}
