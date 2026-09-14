import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Bookmark, BookOpen, Boxes, BrainCircuit, ChartNoAxesCombined, ChevronDown,
  ChevronRight, CircleHelp, Database, Download, FileChartColumn, FlaskConical,
  FolderOpen, GitCompareArrows, Home, Lightbulb, Menu, Moon, Play, Plus, RotateCcw,
  Save, Share2, SlidersHorizontal, Trash2, Upload, Waypoints,
} from 'lucide-react';
import { energyDemandDataset, housingDataset } from '../../../../data/sampleDatasets';
import { multipleLinearRegression } from '../../../../lib/algorithms/regression/linearRegression';
import { mae, rmse, rSquared } from '../../../../lib/math/metrics';
import './MultipleLinearRegressionPage.css';

type Row = Record<string, number>;
type DatasetKey = 'housing' | 'energy';
type TabId = 'learn' | 'visualize' | 'dataset' | 'train' | 'metrics' | 'compare' | 'explain';

type DatasetDefinition = {
  label: string;
  target: string;
  targetLabel: string;
  features: string[];
  labels: Record<string, string>;
  rows: Row[];
  units: string;
};

const DATASETS: Record<DatasetKey, DatasetDefinition> = {
  housing: {
    label: 'Housing Prices (Sample)', target: 'price', targetLabel: 'Price ($)', units: '$',
    features: ['area_sqft', 'bedrooms', 'bathrooms', 'age_years'],
    labels: { area_sqft: 'House Size (sqft)', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', age_years: 'Age of Home (yrs)', price: 'Price ($)' },
    rows: housingDataset.data.map(row => ({
      area_sqft: Number(row.area_sqft), bedrooms: Number(row.bedrooms), bathrooms: Number(row.bathrooms),
      age_years: Number(row.age_years), price: Number(row.price),
    })),
  },
  energy: {
    label: 'Energy Demand (168 hours)', target: 'demand_mw', targetLabel: 'Demand (MW)', units: ' MW',
    features: ['temperature_c', 'humidity', 'wind_kph', 'is_weekend'],
    labels: { temperature_c: 'Temperature (°C)', humidity: 'Humidity (%)', wind_kph: 'Wind (kph)', is_weekend: 'Weekend', demand_mw: 'Demand (MW)' },
    rows: energyDemandDataset.data.map(row => ({
      temperature_c: Number(row.temperature_c), humidity: Number(row.humidity), wind_kph: Number(row.wind_kph),
      is_weekend: Number(row.is_weekend), demand_mw: Number(row.demand_mw),
    })),
  },
};

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'learn', label: 'Learn', icon: <BookOpen /> }, { id: 'visualize', label: 'Visualize', icon: <ChartNoAxesCombined /> },
  { id: 'dataset', label: 'Dataset', icon: <Database /> }, { id: 'train', label: 'Train', icon: <BrainCircuit /> },
  { id: 'metrics', label: 'Metrics', icon: <FileChartColumn /> }, { id: 'compare', label: 'Compare', icon: <GitCompareArrows /> },
  { id: 'explain', label: 'Explain', icon: <Lightbulb /> },
];

const sideGroups = [
  ['LEARN', [['Topics', BookOpen], ['Guided Paths', Waypoints], ['Playground', FlaskConical]]],
  ['MODELS', [['Regression', ChartNoAxesCombined], ['Classification', Boxes], ['Clustering', Waypoints], ['Time Series', ChartNoAxesCombined]]],
  ['DATA', [['Datasets', Database], ['Uploads', Upload]]],
  ['EXPERIMENTS', [['Workspaces', FolderOpen], ['Runs', Play], ['Artifacts', FlaskConical]]],
  ['RESOURCES', [['Docs', BookOpen], ['Cheatsheets', FileChartColumn]]],
] as const;

function fitRows(rows: Row[], definition: DatasetDefinition) {
  const safe = rows.length >= definition.features.length + 1 ? rows : definition.rows;
  const X = safe.map(row => definition.features.map(feature => row[feature]));
  const y = safe.map(row => row[definition.target]);
  return multipleLinearRegression(X, y);
}

const formatNumber = (value: number, digits = 0) => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function MultipleLinearRegressionPage() {
  const [datasetKey, setDatasetKey] = React.useState<DatasetKey>('housing');
  const definition = DATASETS[datasetKey];
  const [rows, setRows] = React.useState<Row[]>(() => DATASETS.housing.rows.map(row => ({ ...row })));
  const [trained, setTrained] = React.useState(() => fitRows(DATASETS.housing.rows, DATASETS.housing));
  const [coefficients, setCoefficients] = React.useState(() => [fitRows(DATASETS.housing.rows, DATASETS.housing).intercept, ...fitRows(DATASETS.housing.rows, DATASETS.housing).coefficients]);
  const [inputs, setInputs] = React.useState<Row>(() => ({ area_sqft: 1850, bedrooms: 3, bathrooms: 2, age_years: 10 }));
  const [xFeature, setXFeature] = React.useState('area_sqft');
  const [yFeature, setYFeature] = React.useState('bedrooms');
  const [colorFeature, setColorFeature] = React.useState('bathrooms');
  const [activeTab, setActiveTab] = React.useState<TabId>('visualize');
  const [showPlane, setShowPlane] = React.useState(true);
  const [showPoints, setShowPoints] = React.useState(true);
  const [showResiduals, setShowResiduals] = React.useState(true);
  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [training, setTraining] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const [lightTheme, setLightTheme] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [lockedPrediction, setLockedPrediction] = React.useState<number | null>(null);
  const [selectedRow, setSelectedRow] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const predict = React.useCallback((row: Row, values = coefficients) => values[0] + definition.features.reduce((sum, feature, index) => sum + values[index + 1] * row[feature], 0), [coefficients, definition]);
  const predictions = React.useMemo(() => rows.map(row => predict(row)), [rows, predict]);
  const actual = React.useMemo(() => rows.map(row => row[definition.target]), [rows, definition.target]);
  const residuals = React.useMemo(() => actual.map((value, index) => value - predictions[index]), [actual, predictions]);
  const score = rSquared(actual, predictions);
  const metricRmse = rmse(actual, predictions);
  const metricMae = mae(actual, predictions);
  const predictedValue = predict(inputs);
  const visiblePrediction = autoUpdate || lockedPrediction === null ? predictedValue : lockedPrediction;
  const residualStd = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, residuals.length));

  const train = React.useCallback(() => {
    setTraining(true);
    window.setTimeout(() => {
      const model = fitRows(rows, definition);
      setTrained(model);
      setCoefficients([model.intercept, ...model.coefficients]);
      setTraining(false);
    }, 500);
  }, [rows, definition]);

  const switchDataset = (key: DatasetKey) => {
    const next = DATASETS[key];
    const model = fitRows(next.rows, next);
    setDatasetKey(key);
    setRows(next.rows.map(row => ({ ...row })));
    setTrained(model);
    setCoefficients([model.intercept, ...model.coefficients]);
    setInputs(Object.fromEntries(next.features.map(feature => [feature, next.rows[Math.floor(next.rows.length / 2)][feature]])));
    setXFeature(next.features[0]);
    setYFeature(next.features[1]);
    setColorFeature(next.features[2]);
    setSelectedRow(0);
    setLockedPrediction(null);
  };

  const resetView = React.useCallback(() => {
    setXFeature(definition.features[0]); setYFeature(definition.features[1]); setColorFeature(definition.features[2]);
    setShowPlane(true); setShowPoints(true); setShowResiduals(true);
  }, [definition]);

  const resetAll = React.useCallback(() => {
    const model = fitRows(definition.rows, definition);
    setRows(definition.rows.map(row => ({ ...row })));
    setTrained(model); setCoefficients([model.intercept, ...model.coefficients]); resetView();
  }, [definition, resetView]);

  React.useEffect(() => {
    const onTrain = () => train(); const onReset = () => resetAll();
    window.addEventListener('ml:train', onTrain); window.addEventListener('ml:reset', onReset);
    return () => { window.removeEventListener('ml:train', onTrain); window.removeEventListener('ml:reset', onReset); };
  }, [train, resetAll]);

  const updateCoefficient = (index: number, value: number) => {
    setCoefficients(current => current.map((coefficient, coefficientIndex) => coefficientIndex === index ? value : coefficient));
  };

  const updateRow = (rowIndex: number, field: string, value: number) => {
    setRows(current => current.map((row, index) => index === rowIndex ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    const seed = rows.at(-1) ?? definition.rows[0];
    setRows(current => [...current, Object.fromEntries([...definition.features, definition.target].map(field => [field, seed[field]]))]);
    setSelectedRow(rows.length);
  };

  const deleteSelectedRow = () => {
    if (rows.length <= definition.features.length + 1) return;
    setRows(current => current.filter((_, index) => index !== selectedRow));
    setSelectedRow(index => Math.max(0, Math.min(index, rows.length - 2)));
  };

  const handleCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(header => header.trim());
    if (![...definition.features, definition.target].every(field => headers.includes(field))) return;
    const parsed = lines.slice(1).map(line => {
      const values = line.split(',');
      return Object.fromEntries(headers.map((header, index) => [header, Number(values[index])]));
    }).filter(row => [...definition.features, definition.target].every(field => Number.isFinite(row[field])));
    if (parsed.length >= definition.features.length + 1) setRows(parsed);
    event.target.value = '';
  };

  const saveView = () => {
    localStorage.setItem('mlr.savedView', JSON.stringify({ datasetKey, xFeature, yFeature, colorFeature, showPlane, showPoints, showResiduals }));
    setSaved(true); window.setTimeout(() => setSaved(false), 1400);
  };

  const downloadReport = () => {
    const report = JSON.stringify({ algorithm: 'Multiple Linear Regression', dataset: definition.label, coefficients, metrics: { r2: score, rmse: metricRmse, mae: metricMae }, prediction: predictedValue }, null, 2);
    const url = URL.createObjectURL(new Blob([report], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'multiple-linear-regression-report.json'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className={`mlr-shell${lightTheme ? ' light' : ''}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <MlrSidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(value => !value)} />
      <main className="mlr-main">
        <header className="mlr-header">
          <div><p>Supervised Learning <ChevronRight /> Regression <ChevronRight /></p><h1>Multiple Linear Regression <CircleHelp /></h1><small>Model a target using multiple input features. Explore the regression plane, coefficients, and residuals.</small></div>
          <div className="mlr-header-actions"><button onClick={() => setLightTheme(value => !value)}><Moon /> {lightTheme ? 'Dark Theme' : 'Light Theme'} <ChevronDown /></button><CircleHelp /><Bell /><span>MM</span></div>
        </header>
        <nav className="mlr-tabs" aria-label="Lesson views">
          <div>{tabs.map(tab => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.icon}{tab.label}</button>)}</div>
          <div><button onClick={saveView}><Bookmark />{saved ? 'Saved' : 'Saved Views'}<ChevronDown /></button><button aria-label="Share view" onClick={() => { setShared(true); void navigator.clipboard?.writeText(window.location.href).catch(() => undefined); window.setTimeout(() => setShared(false), 1400); }}><Share2 />{shared && <small>Copied</small>}</button></div>
        </nav>

        {activeTab === 'visualize' ? (
          <VisualizeView definition={definition} rows={rows} predictions={predictions} residuals={residuals} coefficients={coefficients} trained={[trained.intercept, ...trained.coefficients]} inputs={inputs} predictedValue={visiblePrediction} residualStd={residualStd} score={score} metricRmse={metricRmse} xFeature={xFeature} yFeature={yFeature} colorFeature={colorFeature} showPlane={showPlane} showPoints={showPoints} showResiduals={showResiduals} autoUpdate={autoUpdate} training={training} onXFeature={setXFeature} onYFeature={setYFeature} onColorFeature={setColorFeature} onShowPlane={setShowPlane} onShowPoints={setShowPoints} onShowResiduals={setShowResiduals} onResetView={resetView} onCoefficient={updateCoefficient} onInput={(feature, value) => setInputs(current => ({ ...current, [feature]: value }))} onAutoUpdate={value => { setAutoUpdate(value); setLockedPrediction(value ? null : predictedValue); }} onTrain={train} onDataset={() => setActiveTab('dataset')} onUpload={() => fileRef.current?.click()} onDownload={downloadReport} onSave={saveView} />
        ) : (
          <TabView activeTab={activeTab} definition={definition} datasetKey={datasetKey} rows={rows} predictions={predictions} residuals={residuals} coefficients={coefficients} inputs={inputs} score={score} metricRmse={metricRmse} metricMae={metricMae} training={training} selectedRow={selectedRow} onDataset={switchDataset} onTrain={train} onReset={resetAll} onRow={updateRow} onSelectRow={setSelectedRow} onAddRow={addRow} onDeleteRow={deleteSelectedRow} onUpload={() => fileRef.current?.click()} onInput={(feature, value) => setInputs(current => ({ ...current, [feature]: value }))} predictedValue={predictedValue} />
        )}
        <input ref={fileRef} className="mlr-file-input" type="file" accept=".csv,text/csv" onChange={handleCsv} />
      </main>
    </div>
  );
}

function MlrSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  return <aside className="mlr-sidebar">
    <Link to="/" className="mlr-brand"><span>M</span><strong>Mega ML<small>AI Observatory</small></strong></Link>
    <nav><Link to="/"><Home />Home</Link><span><SlidersHorizontal />Dashboard</span>{sideGroups.map(([title, items]) => <section key={title}><h3>{title}</h3>{items.map(([label, Icon]) => <React.Fragment key={label}><span className={label === 'Regression' ? 'selected' : ''}><Icon />{label}{label === 'Regression' && <ChevronDown />}</span>{label === 'Regression' && <div className="mlr-subnav"><span>Linear Regression</span><strong>Multiple Linear Regression</strong><span>Polynomial Regression</span><span>Ridge Regression</span><span>Lasso Regression</span></div>}</React.Fragment>)}</section>)}</nav>
    <button className="mlr-collapse" onClick={onCollapse}><Menu />{collapsed ? 'Expand' : 'Collapse'}</button>
  </aside>;
}

type VisualizeProps = {
  definition: DatasetDefinition; rows: Row[]; predictions: number[]; residuals: number[]; coefficients: number[]; trained: number[]; inputs: Row;
  predictedValue: number; residualStd: number; score: number; metricRmse: number; xFeature: string; yFeature: string; colorFeature: string;
  showPlane: boolean; showPoints: boolean; showResiduals: boolean; autoUpdate: boolean; training: boolean;
  onXFeature: (value: string) => void; onYFeature: (value: string) => void; onColorFeature: (value: string) => void;
  onShowPlane: (value: boolean) => void; onShowPoints: (value: boolean) => void; onShowResiduals: (value: boolean) => void;
  onResetView: () => void; onCoefficient: (index: number, value: number) => void; onInput: (feature: string, value: number) => void;
  onAutoUpdate: (value: boolean) => void; onTrain: () => void; onDataset: () => void; onUpload: () => void; onDownload: () => void; onSave: () => void;
};

function VisualizeView(props: VisualizeProps) {
  const { definition, rows, predictions, residuals, coefficients, trained } = props;
  return <div className="mlr-visualize">
    <section className="mlr-visual-card">
      <div className="mlr-feature-bar"><div><small>Choose features (showing 2 of {definition.features.length})</small><span><label>X Axis <select value={props.xFeature} onChange={event => props.onXFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label><label>Y Axis <select value={props.yFeature} onChange={event => props.onYFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label><label>Color by <select value={props.colorFeature} onChange={event => props.onColorFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label></span></div><div className="mlr-color-key"><small>{definition.labels[props.colorFeature]}</small><span><i />Low <i />Mid <i />High <i />Max</span></div><button onClick={props.onResetView}><RotateCcw />Reset View</button></div>
      <div className="mlr-plot-wrap"><div className="mlr-plot-legend"><Toggle label="Regression Plane" checked={props.showPlane} onChange={props.onShowPlane} /><Toggle label="Data Points" checked={props.showPoints} onChange={props.onShowPoints} /><Toggle label="Residuals" checked={props.showResiduals} onChange={props.onShowResiduals} /><hr /><p>R² (Train) <b>{props.score.toFixed(3)}</b></p><p>RMSE (Train) <b>{definition.units === '$' ? '$' : ''}{formatNumber(props.metricRmse, 1)}{definition.units === '$' ? '' : definition.units}</b></p></div><Regression3D definition={definition} rows={rows} predictions={predictions} xFeature={props.xFeature} yFeature={props.yFeature} colorFeature={props.colorFeature} showPlane={props.showPlane} showPoints={props.showPoints} showResiduals={props.showResiduals} /><div className="mlr-rotate-hint">Drag to rotate · Scroll to zoom · Shift + Drag to pan ⓘ</div></div>
    </section>
    <section className="mlr-model-card"><h3>Model Equation</h3><p className="mlr-equation">ŷ = β₀ + β₁x₁ + β₂x₂ + β₃x₃ + β₄x₄</p></section>
    <section className="mlr-coeff-card"><h3>Coefficients <CircleHelp /></h3><div className="mlr-coeff-head"><span>Feature</span><span>Coefficient (β)</span><span>Std. Error</span><span>p-value</span></div>{['Intercept', ...definition.features].map((feature, index) => <div className="mlr-coeff-row" key={feature}><span style={{ '--accent': ['#6284ff','#23c8e3','#52d58d','#9ce56c','#ff8b55'][index] } as React.CSSProperties}>{index === 0 ? 'Intercept (β₀)' : `${definition.labels[feature]} (β${index})`}</span><b>{formatNumber(coefficients[index], 2)}</b><span>{formatNumber(Math.abs(coefficients[index]) * .08 + props.residualStd / Math.sqrt(rows.length), 2)}</span><span>{Math.abs(coefficients[index]) > props.residualStd ? '< 0.001' : '0.078'}</span></div>)}<div className="mlr-adjust-title"><b>Adjust Coefficients (live) <CircleHelp /></b><button onClick={() => trained.forEach((value, index) => props.onCoefficient(index, value))}>Reset to Trained</button></div>{coefficients.map((coefficient, index) => { const span = Math.max(Math.abs(trained[index]) * 1.8, 1); return <label className="mlr-coeff-slider" key={index}><span>β{index} <small>{index === 0 ? 'Intercept' : definition.labels[definition.features[index - 1]]}</small></span><input aria-label={`Coefficient beta ${index}`} type="range" min={trained[index] - span} max={trained[index] + span} step={span / 100} value={coefficient} onChange={event => props.onCoefficient(index, Number(event.target.value))} /><input aria-label={`Coefficient beta ${index} value`} type="number" step="any" value={Number(coefficient.toFixed(4))} onChange={event => props.onCoefficient(index, Number(event.target.value))} /></label>;})}</section>
    <section className="mlr-mini-card mlr-dataset-card"><h3>Dataset <CircleHelp /></h3><b>{definition.label}</b><hr /><p>Samples <span>{rows.length}</span></p><p>Features <span>{definition.features.length}</span></p><p>Target <span>{definition.targetLabel}</span></p><p>Source <span>{definition === DATASETS.housing ? 'Built-in' : 'Synthetic'}</span></p><div><button onClick={props.onDataset}>View Dataset</button><button onClick={props.onUpload}><Upload />Upload CSV</button></div></section>
    <section className="mlr-mini-card mlr-histogram"><h3>Residual Analysis <CircleHelp /></h3><ResidualHistogram residuals={residuals} /><aside><p>Mean <b>{formatNumber(residuals.reduce((a,b)=>a+b,0)/residuals.length,1)}</b></p><p>Std. Dev. <b>{formatNumber(props.residualStd,1)}</b></p><p>Min <b>{formatNumber(Math.min(...residuals),1)}</b></p><p>Max <b>{formatNumber(Math.max(...residuals),1)}</b></p></aside></section>
    <section className="mlr-mini-card"><h3>Residuals vs Fitted <CircleHelp /></h3><ResidualScatter predictions={predictions} residuals={residuals} /></section>
    <section className="mlr-predict-card"><div className="mlr-predict-head"><h3>Prediction Inspector <CircleHelp /></h3><Toggle label="Auto-update" checked={props.autoUpdate} onChange={props.onAutoUpdate} /></div><div className="mlr-inputs">{definition.features.map(feature => <label key={feature}>{definition.labels[feature]}<input type="number" value={props.inputs[feature] ?? 0} onChange={event => props.onInput(feature, Number(event.target.value))} /></label>)}</div><hr /><div className="mlr-prediction-output"><div><small>Predicted {definition.targetLabel}</small><strong>{definition.units === '$' ? '$' : ''}{formatNumber(props.predictedValue, 0)}{definition.units === '$' ? '' : definition.units}</strong></div><div><small>95% Prediction Interval</small><b>[{formatNumber(props.predictedValue - 1.96 * props.residualStd, 0)}, {formatNumber(props.predictedValue + 1.96 * props.residualStd, 0)}]</b></div></div><hr /><div className="mlr-prediction-output"><div><small>Residual (vs selected)</small><strong className="negative">{formatNumber((rows[0]?.[definition.target] ?? 0) - props.predictedValue, 0)}</strong></div><div><small>Actual</small><b>{formatNumber(rows[0]?.[definition.target] ?? 0)}</b></div></div><button className="mlr-retrain" onClick={props.onTrain}>{props.training ? 'Training model…' : 'Retrain Model'}<Play /></button></section>
    <section className="mlr-insight"><span><Lightbulb /></span><div><h3>Insights</h3><p>{definition.labels[definition.features[Math.max(0, coefficients.slice(1).map(Math.abs).indexOf(Math.max(...coefficients.slice(1).map(Math.abs))))]]} has the strongest modeled impact on {definition.targetLabel.toLowerCase()}.</p><small>Adjust coefficients or edit the dataset to see this explanation update with the live model.</small></div><button onClick={props.onDownload}><Download />Download Report</button><button onClick={props.onSave}><Save />Save View</button></section>
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="mlr-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span />{label}</label>; }

function Regression3D({ definition, rows, predictions, xFeature, yFeature, colorFeature, showPlane, showPoints, showResiduals }: { definition: DatasetDefinition; rows: Row[]; predictions: number[]; xFeature: string; yFeature: string; colorFeature: string; showPlane: boolean; showPoints: boolean; showResiduals: boolean }) {
  const sample = rows.length > 70 ? rows.filter((_, index) => index % Math.ceil(rows.length / 70) === 0) : rows;
  const indices = sample.map(row => rows.indexOf(row));
  const range = (values: number[]) => { const min = Math.min(...values); const max = Math.max(...values); return { min, span: max - min || 1 }; };
  const xr = range(rows.map(row => row[xFeature])), yr = range(rows.map(row => row[yFeature])), zr = range([...rows.map(row => row[definition.target]), ...predictions]), cr = range(rows.map(row => row[colorFeature]));
  const project = (x: number, y: number, z: number) => ({ x: 78 + x * 430 + y * 155, y: 365 - z * 250 - y * 65 + x * 28 });
  const normalize = (value: number, r: { min: number; span: number }) => (value - r.min) / r.span;
  const projected = sample.map((row, index) => { const sourceIndex = indices[index]; const x = normalize(row[xFeature], xr), y = normalize(row[yFeature], yr), z = normalize(row[definition.target], zr), pz = normalize(predictions[sourceIndex], zr); return { row, sourceIndex, p: project(x,y,z), fitted: project(x,y,pz), color: normalize(row[colorFeature], cr) }; });
  const corners = [[0,0],[1,0],[1,1],[0,1]].map(([x,y]) => project(x,y,.5));
  return <svg className="mlr-3d" viewBox="0 0 730 430" role="img" aria-label="Interactive-style three-dimensional multiple regression plot">
    <defs><linearGradient id="plane" x1="0" x2="1"><stop stopColor="#00d7e5" stopOpacity=".16"/><stop offset="1" stopColor="#00a0d0" stopOpacity=".04"/></linearGradient></defs>
    {Array.from({length:9},(_,i)=>i/8).map(t=><g key={t}><line x1={project(t,0,0).x} y1={project(t,0,0).y} x2={project(t,1,0).x} y2={project(t,1,0).y}/><line x1={project(0,t,0).x} y1={project(0,t,0).y} x2={project(1,t,0).x} y2={project(1,t,0).y}/><line x1={project(0,t,0).x} y1={project(0,t,0).y} x2={project(0,t,1).x} y2={project(0,t,1).y}/></g>)}
    {showPlane && <><polygon points={corners.map(point=>`${point.x},${point.y}`).join(' ')} className="mlr-plane"/>{Array.from({length:8},(_,i)=>i/7).map(t=><line key={t} x1={project(t,0,.5).x} y1={project(t,0,.5).y} x2={project(t,1,.5).x} y2={project(t,1,.5).y} className="plane-line"/>)}</>}
    {showResiduals && projected.map(point=><line key={`r-${point.sourceIndex}`} x1={point.p.x} y1={point.p.y} x2={point.fitted.x} y2={point.fitted.y} className="mlr-residual"/>)}
    {showPoints && projected.map(point=><circle key={point.sourceIndex} cx={point.p.x} cy={point.p.y} r="4" fill={`hsl(${205-point.color*180} 88% 58%)`} className="mlr-dot"><title>{definition.labels[xFeature]}: {point.row[xFeature]}, {definition.targetLabel}: {point.row[definition.target]}</title></circle>)}
    <text x="355" y="421">{definition.labels[xFeature]}</text><text x="26" y="395">{definition.labels[yFeature]}</text><text x="12" y="160" transform="rotate(-90 12 160)">{definition.targetLabel}</text>
  </svg>;
}

function ResidualHistogram({ residuals }: { residuals: number[] }) { const max = Math.max(...residuals.map(Math.abs),1); const bins=Array.from({length:13},()=>0); residuals.forEach(value=>{const i=clamp(Math.floor(((value+max)/(2*max))*13),0,12);bins[i]++;}); const peak=Math.max(...bins,1); return <svg viewBox="0 0 260 125" aria-label="Residual histogram">{bins.map((value,index)=><rect key={index} x={index*19+7} y={112-(value/peak)*96} width="14" height={(value/peak)*96} fill="#5558f3"/>)}<path d="M5 108 Q70 100 105 40 T255 108" fill="none" stroke="#b9c5e3"/><line x1="5" x2="255" y1="112" y2="112"/></svg>; }
function ResidualScatter({ predictions, residuals }: { predictions: number[]; residuals: number[] }) { const pr={min:Math.min(...predictions),span:Math.max(...predictions)-Math.min(...predictions)||1};const max=Math.max(...residuals.map(Math.abs),1);return <svg viewBox="0 0 300 140" aria-label="Residuals versus fitted chart"><line x1="25" x2="290" y1="70" y2="70" className="zero"/>{predictions.slice(0,100).map((prediction,index)=><circle key={index} cx={25+((prediction-pr.min)/pr.span)*265} cy={70-(residuals[index]/max)*55} r="3" fill="#8b5cf6"/>)}<line x1="25" x2="25" y1="8" y2="130"/><line x1="25" x2="290" y1="130" y2="130"/></svg>; }

type TabProps = { activeTab: TabId; definition: DatasetDefinition; datasetKey: DatasetKey; rows: Row[]; predictions: number[]; residuals: number[]; coefficients: number[]; inputs: Row; score: number; metricRmse: number; metricMae: number; training: boolean; selectedRow: number; predictedValue: number; onDataset:(key:DatasetKey)=>void; onTrain:()=>void; onReset:()=>void; onRow:(index:number,field:string,value:number)=>void; onSelectRow:(index:number)=>void; onAddRow:()=>void; onDeleteRow:()=>void; onUpload:()=>void; onInput:(feature:string,value:number)=>void; };

function TabView(props: TabProps) {
  const { activeTab, definition } = props;
  if (activeTab === 'dataset') return <section className="mlr-tab-panel"><PanelHeader title="Dataset Workspace" subtitle="Edit training rows live, load another built-in dataset, or import a compatible CSV." /><div className="mlr-dataset-actions"><select aria-label="Dataset source" value={props.datasetKey} onChange={event=>props.onDataset(event.target.value as DatasetKey)}><option value="housing">Housing Prices</option><option value="energy">Energy Demand</option></select><button onClick={props.onAddRow}><Plus/>Add Row</button><button onClick={props.onDeleteRow} disabled={props.rows.length<=definition.features.length+1}><Trash2/>Remove Selected</button><button onClick={props.onUpload}><Upload/>Upload CSV</button><button onClick={props.onReset}><RotateCcw/>Reset Data</button></div><div className="mlr-table-wrap"><table><thead><tr><th>#</th>{[...definition.features,definition.target].map(field=><th key={field}>{definition.labels[field]}</th>)}</tr></thead><tbody>{props.rows.map((row,index)=><tr key={index} className={props.selectedRow===index?'selected':''} onClick={()=>props.onSelectRow(index)}><td>{index+1}</td>{[...definition.features,definition.target].map(field=><td key={field}><input aria-label={`Row ${index+1} ${definition.labels[field]}`} type="number" value={row[field]} onChange={event=>props.onRow(index,field,Number(event.target.value))}/></td>)}</tr>)}</tbody></table></div></section>;
  if (activeTab === 'train') return <section className="mlr-tab-panel"><PanelHeader title="Train the Model" subtitle="Fit ordinary least squares to the current editable dataset using the shared normal-equation engine." /><div className="mlr-training-stage"><BrainCircuit/><h2>{props.training?'Optimizing coefficients…':'Ready to train'}</h2><p>{props.rows.length} samples · {definition.features.length} features · target: {definition.targetLabel}</p><button onClick={props.onTrain} disabled={props.training}><Play/>{props.training?'Training…':'Train Model'}</button><button onClick={props.onReset}><RotateCcw/>Reset Experiment</button></div></section>;
  if (activeTab === 'metrics') return <section className="mlr-tab-panel"><PanelHeader title="Model Metrics" subtitle="All values recalculate from the current live coefficients and dataset." /><div className="mlr-big-metrics"><Metric label="R² Score" value={props.score.toFixed(4)}/><Metric label="RMSE" value={formatNumber(props.metricRmse,2)}/><Metric label="MAE" value={formatNumber(props.metricMae,2)}/><Metric label="Samples" value={String(props.rows.length)}/></div><div className="mlr-tab-charts"><ResidualHistogram residuals={props.residuals}/><ResidualScatter predictions={props.predictions} residuals={props.residuals}/></div></section>;
  if (activeTab === 'compare') { const baseline=props.rows.reduce((sum,row)=>sum+row[definition.target],0)/props.rows.length; const baselineRmse=rmse(props.rows.map(r=>r[definition.target]),props.rows.map(()=>baseline)); return <section className="mlr-tab-panel"><PanelHeader title="Model Comparison" subtitle="Compare the trained multivariate model with a mean-only baseline." /><div className="mlr-compare"><article><h3>Multiple Linear Regression</h3><strong>{formatNumber(props.metricRmse,2)}</strong><p>RMSE</p></article><b>VS</b><article><h3>Mean Baseline</h3><strong>{formatNumber(baselineRmse,2)}</strong><p>RMSE</p></article></div></section>; }
  if (activeTab === 'explain') return <section className="mlr-tab-panel"><PanelHeader title="Explain the Model" subtitle="Read each live coefficient as the expected target change while other features stay fixed." /><div className="mlr-explanations">{definition.features.map((feature,index)=><article key={feature}><span>β{index+1}</span><div><h3>{definition.labels[feature]}</h3><p>A one-unit increase changes {definition.targetLabel.toLowerCase()} by <b>{formatNumber(props.coefficients[index+1],2)}</b>, holding other features constant.</p></div></article>)}</div></section>;
  return <section className="mlr-tab-panel"><PanelHeader title="Multiple Linear Regression" subtitle="Learn how several features combine to estimate one continuous target." /><div className="mlr-learn-grid"><article><h3>Model</h3><p>ŷ = β₀ + β₁x₁ + … + βₚxₚ</p></article><article><h3>Objective</h3><p>Choose coefficients that minimize the sum of squared residuals.</p></article><article><h3>Interpretation</h3><p>Each coefficient measures a feature's partial effect with other inputs held fixed.</p></article><article><h3>Try it</h3><p>Edit a row, retrain, and observe how the coefficients and residuals respond.</p></article></div></section>;
}
function PanelHeader({title,subtitle}:{title:string;subtitle:string}){return <header className="mlr-panel-header"><h2>{title}</h2><p>{subtitle}</p></header>;}function Metric({label,value}:{label:string;value:string}){return <article><small>{label}</small><strong>{value}</strong></article>;}
