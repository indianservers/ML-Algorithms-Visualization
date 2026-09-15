import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Bookmark, BookOpen, Boxes, BrainCircuit, ChartNoAxesCombined, ChevronDown,
  ChevronRight, CircleHelp, Database, Download, FileChartColumn, FlaskConical,
  FolderOpen, GitCompareArrows, Home, Lightbulb, Menu, Moon, Play, Plus, RotateCcw,
  Save, Share2, SlidersHorizontal, Trash2, Upload, Waypoints,
} from 'lucide-react';
import { energyDemandDataset, housingDataset } from '../../../../data/sampleDatasets';
import { multipleLinearRegressionDiagnostics } from '../../../../lib/algorithms/regression/linearRegression';
import { mae, rmse } from '../../../../lib/math/metrics';
import { formatR2, inferenceRow, modelLifecycle, regressionMetrics, splitRegressionData, splitViabilityMessage, validateFeatureMatrix } from '../../../../lib/regression/regressionEval';
import { varianceInflationFactors } from '../../../../lib/regression/regressionDiagnostics';
import { RegressionDiagnosticsPanel } from '../../../../components/ml/RegressionDiagnosticsPanel';
import { datasetHHousing, datasetIMulticollinearity, datasetJIrrelevantFeatures, datasetNConstantFeature } from '../../../../lib/regression/regressionDatasets';
import './MultipleLinearRegressionPage.css';

type Row = Record<string, number>;
type DatasetKey = 'housing' | 'energy' | 'collinear' | 'sparse' | 'labHousing' | 'constantFeat';
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
  collinear: {
    label: datasetIMulticollinearity().name, target: 'price', targetLabel: 'Price', units: '',
    features: datasetIMulticollinearity().features,
    labels: datasetIMulticollinearity().labels,
    rows: datasetIMulticollinearity().rows,
  },
  sparse: {
    label: datasetJIrrelevantFeatures().name, target: 'y', targetLabel: 'y', units: '',
    features: datasetJIrrelevantFeatures().features,
    labels: datasetJIrrelevantFeatures().labels,
    rows: datasetJIrrelevantFeatures().rows,
  },
  labHousing: {
    label: datasetHHousing.name, target: 'price', targetLabel: datasetHHousing.labels.price, units: '',
    features: datasetHHousing.features,
    labels: datasetHHousing.labels,
    rows: datasetHHousing.rows,
  },
  constantFeat: {
    label: datasetNConstantFeature().name, target: 'y', targetLabel: 'y', units: '',
    features: datasetNConstantFeature().features,
    labels: datasetNConstantFeature().labels,
    rows: datasetNConstantFeature().rows,
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

function fitRows(rows: Row[], definition: DatasetDefinition, features: string[], testSize: number, seed: number) {
  const used = features.length ? features : definition.features;
  const y = rows.map(row => row[definition.target]);
  const X = rows.map(row => used.map(feature => row[feature]));
  const problem = validateFeatureMatrix(X, y, 2);
  if (problem) return { error: problem, model: null as ReturnType<typeof multipleLinearRegressionDiagnostics> | null, split: null as ReturnType<typeof splitRegressionData<Row>> | null };
  const splitIssue = splitViabilityMessage(rows.length, testSize, Math.max(2, used.length + 1));
  if (splitIssue) return { error: splitIssue, model: null, split: null };
  try {
    const split = splitRegressionData(rows, y, testSize, seed, true);
    const trainX = split.trainX.map(row => used.map(feature => row[feature]));
    return { error: null as string | null, model: multipleLinearRegressionDiagnostics(trainX, split.trainY), split };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not fit OLS.', model: null, split: null };
  }
}

const formatNumber = (value: number, digits = 0) => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function MultipleLinearRegressionPage() {
  const [datasetKey, setDatasetKey] = React.useState<DatasetKey>('housing');
  const definition = DATASETS[datasetKey];
  const [rows, setRows] = React.useState<Row[]>(() => DATASETS.housing.rows.map(row => ({ ...row })));
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>(() => [...DATASETS.housing.features]);
  const initialFit = fitRows(DATASETS.housing.rows, DATASETS.housing, DATASETS.housing.features, 0.2, 42);
  const [trained, setTrained] = React.useState(() => initialFit.model);
  const [fitError, setFitError] = React.useState<string | null>(initialFit.error);
  const [coefficients, setCoefficients] = React.useState(() => initialFit.model ? [initialFit.model.intercept, ...initialFit.model.coefficients] : [0]);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const [lastTrainKey, setLastTrainKey] = React.useState(() => JSON.stringify({ rows: DATASETS.housing.rows, features: DATASETS.housing.features, testSize: 0.2, seed: 42 }));
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
  const [testSize, setTestSize] = React.useState(0.2);
  const [seed, setSeed] = React.useState(42);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const applyModel = React.useCallback((nextRows: Row[], nextDef: DatasetDefinition, features: string[], size = testSize, nextSeed = seed) => {
    const result = fitRows(nextRows, nextDef, features, size, nextSeed);
    setFitError(result.error);
    setTrained(result.model);
    if (result.model) {
      setCoefficients([result.model.intercept, ...result.model.coefficients]);
      setLastTrainKey(JSON.stringify({ rows: nextRows, features, testSize: size, seed: nextSeed }));
    }
  }, [seed, testSize]);

  const predict = React.useCallback((row: Row, values = coefficients) => {
    const mapped = inferenceRow(row, selectedFeatures);
    if ('error' in mapped) return Number.NaN;
    return values[0] + mapped.reduce((sum, value, index) => sum + (values[index + 1] ?? 0) * value, 0);
  }, [coefficients, selectedFeatures]);
  const predictions = React.useMemo(() => rows.map(row => predict(row)), [rows, predict]);
  const actual = React.useMemo(() => rows.map(row => row[definition.target]), [rows, definition.target]);
  const residuals = React.useMemo(() => actual.map((value, index) => value - predictions[index]), [actual, predictions]);
  const currentKey = JSON.stringify({ rows, features: selectedFeatures, testSize, seed });
  const stale = Boolean(trained) && currentKey !== lastTrainKey;
  const split = React.useMemo(() => {
    try {
      return splitRegressionData(rows, actual, testSize, seed, true);
    } catch {
      return null;
    }
  }, [rows, actual, testSize, seed]);
  const testMetrics = React.useMemo(() => {
    if (!split || stale) return null;
    const pred = split.testX.map(row => predict(row));
    return regressionMetrics(split.testY, pred, selectedFeatures.length);
  }, [split, predict, selectedFeatures.length, stale]);
  const trainMetrics = React.useMemo(() => {
    if (!split || stale) return null;
    return regressionMetrics(split.trainY, split.trainX.map(row => predict(row)), selectedFeatures.length);
  }, [split, predict, selectedFeatures.length, stale]);
  const score = trainMetrics?.r2 ?? 0;
  const metricRmse = testMetrics?.rmse ?? (actual.length ? rmse(actual, predictions) : 0);
  const metricMae = testMetrics?.mae ?? (actual.length ? mae(actual, predictions) : 0);
  const vif = React.useMemo(() => {
    if (!split) return [] as number[];
    return varianceInflationFactors(split.trainX.map(row => selectedFeatures.map(feature => row[feature])));
  }, [split, selectedFeatures]);
  const predictedValue = predict(inputs);
  const visiblePrediction = autoUpdate || lockedPrediction === null ? predictedValue : lockedPrediction;
  const residualStd = trained?.residualStd ?? Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, residuals.length - selectedFeatures.length - 1));

  const train = React.useCallback(() => {
    setTraining(true);
    applyModel(rows, definition, selectedFeatures);
    setTraining(false);
  }, [applyModel, rows, definition, selectedFeatures]);

  const switchDataset = (key: DatasetKey) => {
    const next = DATASETS[key];
    const features = [...next.features];
    setDatasetKey(key);
    setRows(next.rows.map(row => ({ ...row })));
    setSelectedFeatures(features);
    applyModel(next.rows, next, features);
    setInputs(Object.fromEntries(next.features.map(feature => [feature, next.rows[Math.floor(next.rows.length / 2)][feature]])));
    setXFeature(next.features[0]);
    setYFeature(next.features[1] ?? next.features[0]);
    setColorFeature(next.features[2] ?? next.features[0]);
    setSelectedRow(0);
    setLockedPrediction(null);
  };

  const resetView = React.useCallback(() => {
    setXFeature(definition.features[0]); setYFeature(definition.features[1] ?? definition.features[0]); setColorFeature(definition.features[2] ?? definition.features[0]);
    setShowPlane(true); setShowPoints(true); setShowResiduals(true);
  }, [definition]);

  const resetAll = React.useCallback(() => {
    const features = [...definition.features];
    setSelectedFeatures(features);
    setRows(definition.rows.map(row => ({ ...row })));
    applyModel(definition.rows, definition, features);
    resetView();
  }, [definition, resetView, applyModel]);

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
    const lines = (await file.text()).trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 3) {
      setCsvError('CSV requires a header and at least two data rows.');
      event.target.value = '';
      return;
    }
    const headers = lines[0].split(',').map(header => header.trim());
    const needed = [...definition.features, definition.target];
    if (!needed.every(field => headers.includes(field))) {
      setCsvError(`CSV headers must include: ${needed.join(', ')}. Non-numeric columns are not converted to zero.`);
      event.target.value = '';
      return;
    }
    const parsed: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = Object.fromEntries(headers.map((header, index) => [header, Number(values[index])]));
      if (!needed.every(field => Number.isFinite(row[field]))) {
        setCsvError(`Row ${i} has missing or non-numeric values. Missing cells are not filled with zero.`);
        event.target.value = '';
        return;
      }
      parsed.push(row);
    }
    setCsvError(null);
    setRows(parsed);
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

        {fitError && <p className="mlr-help" style={{ color: '#f87171', padding: '0 16px' }}>{fitError}</p>}
        {csvError && <p className="mlr-help" style={{ color: '#f87171', padding: '0 16px' }}>{csvError}</p>}
        {activeTab === 'visualize' ? (
          <VisualizeView definition={definition} rows={rows} predictions={predictions} residuals={residuals} coefficients={coefficients} trained={trained ? [trained.intercept, ...trained.coefficients] : coefficients} stdErrors={trained?.coefficientStdErrors} tStats={trained?.tStatistics} rankWarning={trained?.rankWarning ?? false} selectedFeatures={selectedFeatures} inputs={inputs} predictedValue={visiblePrediction} residualStd={residualStd} score={typeof score === 'number' ? score : 0} metricRmse={metricRmse} trainR2={trainMetrics?.r2 ?? null} testR2={testMetrics?.r2 ?? null} nTrain={split?.nTrain ?? rows.length} nTest={split?.nTest ?? 0} xFeature={xFeature} yFeature={yFeature} colorFeature={colorFeature} showPlane={showPlane} showPoints={showPoints} showResiduals={showResiduals} autoUpdate={autoUpdate} training={training} predict={predict} onXFeature={setXFeature} onYFeature={setYFeature} onColorFeature={setColorFeature} onShowPlane={setShowPlane} onShowPoints={setShowPoints} onShowResiduals={setShowResiduals} onResetView={resetView} onCoefficient={updateCoefficient} onInput={(feature, value) => setInputs(current => ({ ...current, [feature]: value }))} onAutoUpdate={value => { setAutoUpdate(value); setLockedPrediction(value ? null : predictedValue); }} onTrain={train} onDataset={() => setActiveTab('dataset')} onUpload={() => fileRef.current?.click()} onDownload={downloadReport} onSave={saveView} onToggleFeature={(feature) => {
            const next = selectedFeatures.includes(feature)
              ? selectedFeatures.filter(name => name !== feature)
              : [...selectedFeatures, feature];
            const ordered = definition.features.filter(name => next.includes(name));
            setSelectedFeatures(ordered);
            applyModel(rows, definition, ordered);
          }} />
        ) : (
          <TabView activeTab={activeTab} definition={definition} datasetKey={datasetKey} rows={rows} predictions={predictions} residuals={residuals} coefficients={coefficients} inputs={inputs} score={typeof score === 'number' ? score : 0} metricRmse={metricRmse} metricMae={metricMae} training={training} selectedRow={selectedRow} selectedFeatures={selectedFeatures} trainR2={trainMetrics?.r2} testR2={testMetrics?.r2} nTrain={split?.nTrain} nTest={split?.nTest} seed={seed} testSize={testSize} fitError={fitError} vif={vif} trainMetrics={trainMetrics} testMetrics={testMetrics} stale={stale} split={split} onSeed={setSeed} onTestSize={setTestSize} onDataset={switchDataset} onTrain={train} onReset={resetAll} onRow={updateRow} onSelectRow={setSelectedRow} onAddRow={addRow} onDeleteRow={deleteSelectedRow} onUpload={() => fileRef.current?.click()} onInput={(feature, value) => setInputs(current => ({ ...current, [feature]: value }))} predictedValue={predictedValue} />
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
  stdErrors?: number[]; tStats?: number[]; rankWarning?: boolean; selectedFeatures?: string[];
  trainR2?: number | null; testR2?: number | null; nTrain?: number; nTest?: number; predict?: (row: Row) => number;
  onXFeature: (value: string) => void; onYFeature: (value: string) => void; onColorFeature: (value: string) => void;
  onShowPlane: (value: boolean) => void; onShowPoints: (value: boolean) => void; onShowResiduals: (value: boolean) => void;
  onResetView: () => void; onCoefficient: (index: number, value: number) => void; onInput: (feature: string, value: number) => void;
  onAutoUpdate: (value: boolean) => void; onTrain: () => void; onDataset: () => void; onUpload: () => void; onDownload: () => void; onSave: () => void;
  onToggleFeature?: (feature: string) => void;
};

function VisualizeView(props: VisualizeProps) {
  const { definition, rows, predictions, residuals, coefficients, trained } = props;
  return <div className="mlr-visualize">
    <section className="mlr-visual-card">
      <div className="mlr-feature-bar"><div><small>Choose features (showing 2 of {definition.features.length})</small><span><label>X Axis <select value={props.xFeature} onChange={event => props.onXFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label><label>Y Axis <select value={props.yFeature} onChange={event => props.onYFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label><label>Color by <select value={props.colorFeature} onChange={event => props.onColorFeature(event.target.value)}>{definition.features.map(feature => <option key={feature} value={feature}>{definition.labels[feature]}</option>)}</select></label></span></div><div className="mlr-color-key"><small>{definition.labels[props.colorFeature]}</small><span><i />Low <i />Mid <i />High <i />Max</span></div><button onClick={props.onResetView}><RotateCcw />Reset View</button></div>
      <div className="mlr-plot-wrap"><div className="mlr-plot-legend"><Toggle label="Fitted surface" checked={props.showPlane} onChange={props.onShowPlane} /><Toggle label="Data Points" checked={props.showPoints} onChange={props.onShowPoints} /><Toggle label="Residuals" checked={props.showResiduals} onChange={props.onShowResiduals} /><hr /><p>R² (train) <b>{formatR2(props.trainR2)}</b></p><p>R² (test) <b>{formatR2(props.testR2)}</b></p><p>RMSE <b>{formatNumber(props.metricRmse, 1)}</b></p></div><Regression3D definition={definition} rows={rows} predictions={predictions} xFeature={props.xFeature} yFeature={props.yFeature} colorFeature={props.colorFeature} showPlane={props.showPlane} showPoints={props.showPoints} showResiduals={props.showResiduals} predict={props.predict} /><div className="mlr-rotate-hint">Drag to rotate · Scroll to zoom · Shift + Drag to pan ⓘ</div></div>
    </section>
    <section className="mlr-model-card"><h3>Model Equation</h3><p className="mlr-equation">ŷ = β₀ + β₁x₁ + …</p><div>{definition.features.map(feature => <label key={feature} style={{ display: 'inline-flex', gap: 6, marginRight: 12, fontSize: 12 }}><input type="checkbox" checked={(props.selectedFeatures ?? definition.features).includes(feature)} onChange={() => props.onToggleFeature?.(feature)} />{definition.labels[feature]}</label>)}</div></section>
    <section className="mlr-coeff-card"><h3>Coefficients <CircleHelp /></h3><div className="mlr-coeff-head"><span>Feature</span><span>Coefficient (β)</span><span>Std. Error</span><span>t-stat</span></div>{['Intercept', ...(props.selectedFeatures ?? definition.features)].map((feature, index) => <div className="mlr-coeff-row" key={feature}><span style={{ '--accent': ['#6284ff','#23c8e3','#52d58d','#9ce56c','#ff8b55'][index] } as React.CSSProperties}>{index === 0 ? 'Intercept (β₀)' : `${definition.labels[feature]} (β${index})`}</span><b>{formatNumber(coefficients[index], 2)}</b><span>{formatNumber(props.stdErrors?.[index] ?? Number.NaN, 2)}</span><span>{formatNumber(props.tStats?.[index] ?? Number.NaN, 2)}</span></div>)}<div className="mlr-adjust-title"><b>Adjust Coefficients (live) <CircleHelp /></b><button onClick={() => trained.forEach((value, index) => props.onCoefficient(index, value))}>Reset to Trained</button></div>{coefficients.map((coefficient, index) => { const span = Math.max(Math.abs(trained[index]) * 1.8, 1); return <label className="mlr-coeff-slider" key={index}><span>β{index} <small>{index === 0 ? 'Intercept' : definition.labels[definition.features[index - 1]]}</small></span><input aria-label={`Coefficient beta ${index}`} type="range" min={trained[index] - span} max={trained[index] + span} step={span / 100} value={coefficient} onChange={event => props.onCoefficient(index, Number(event.target.value))} /><input aria-label={`Coefficient beta ${index} value`} type="number" step="any" value={Number(coefficient.toFixed(4))} onChange={event => props.onCoefficient(index, Number(event.target.value))} /></label>;})}</section>
    <section className="mlr-mini-card mlr-dataset-card"><h3>Dataset <CircleHelp /></h3><b>{definition.label}</b><hr /><p>Samples <span>{rows.length}</span></p><p>Features <span>{definition.features.length}</span></p><p>Target <span>{definition.targetLabel}</span></p><p>Source <span>{definition === DATASETS.housing ? 'Built-in' : 'Synthetic'}</span></p><div><button onClick={props.onDataset}>View Dataset</button><button onClick={props.onUpload}><Upload />Upload CSV</button></div></section>
    <section className="mlr-mini-card mlr-histogram"><h3>Residual Analysis <CircleHelp /></h3><ResidualHistogram residuals={residuals} /><aside><p>Mean <b>{formatNumber(residuals.reduce((a,b)=>a+b,0)/residuals.length,1)}</b></p><p>Std. Dev. <b>{formatNumber(props.residualStd,1)}</b></p><p>Min <b>{formatNumber(Math.min(...residuals),1)}</b></p><p>Max <b>{formatNumber(Math.max(...residuals),1)}</b></p></aside></section>
    <section className="mlr-mini-card"><h3>Residuals vs Fitted <CircleHelp /></h3><ResidualScatter predictions={predictions} residuals={residuals} /></section>
    <section className="mlr-predict-card"><div className="mlr-predict-head"><h3>Prediction Inspector <CircleHelp /></h3><Toggle label="Auto-update" checked={props.autoUpdate} onChange={props.onAutoUpdate} /></div><div className="mlr-inputs">{definition.features.map(feature => <label key={feature}>{definition.labels[feature]}<input type="number" value={props.inputs[feature] ?? 0} onChange={event => props.onInput(feature, Number(event.target.value))} /></label>)}</div><hr /><div className="mlr-prediction-output"><div><small>Predicted {definition.targetLabel}</small><strong>{definition.units === '$' ? '$' : ''}{formatNumber(props.predictedValue, 0)}{definition.units === '$' ? '' : definition.units}</strong></div><div><small>95% Prediction Interval</small><b>[{formatNumber(props.predictedValue - 1.96 * props.residualStd, 0)}, {formatNumber(props.predictedValue + 1.96 * props.residualStd, 0)}]</b></div></div><hr /><div className="mlr-prediction-output"><div><small>Residual (vs selected)</small><strong className="negative">{formatNumber((rows[0]?.[definition.target] ?? 0) - props.predictedValue, 0)}</strong></div><div><small>Actual</small><b>{formatNumber(rows[0]?.[definition.target] ?? 0)}</b></div></div><button className="mlr-retrain" onClick={props.onTrain}>{props.training ? 'Training model…' : 'Retrain Model'}<Play /></button></section>
    <section className="mlr-insight"><span><Lightbulb /></span><div><h3>Insights</h3><p>{definition.labels[definition.features[Math.max(0, coefficients.slice(1).map(Math.abs).indexOf(Math.max(...coefficients.slice(1).map(Math.abs))))]]} has the strongest modeled impact on {definition.targetLabel.toLowerCase()}.</p><small>Adjust coefficients or edit the dataset to see this explanation update with the live model.</small></div><button onClick={props.onDownload}><Download />Download Report</button><button onClick={props.onSave}><Save />Save View</button></section>
  </div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="mlr-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span />{label}</label>; }

function Regression3D({ definition, rows, predictions, xFeature, yFeature, colorFeature, showPlane, showPoints, showResiduals, predict }: { definition: DatasetDefinition; rows: Row[]; predictions: number[]; xFeature: string; yFeature: string; colorFeature: string; showPlane: boolean; showPoints: boolean; showResiduals: boolean; predict?: (row: Row) => number }) {
  const sample = rows.length > 70 ? rows.filter((_, index) => index % Math.ceil(rows.length / 70) === 0) : rows;
  const indices = sample.map(row => rows.indexOf(row));
  const range = (values: number[]) => { const min = Math.min(...values); const max = Math.max(...values); return { min, span: max - min || 1 }; };
  const xr = range(rows.map(row => row[xFeature])), yr = range(rows.map(row => row[yFeature])), zr = range([...rows.map(row => row[definition.target]), ...predictions]), cr = range(rows.map(row => row[colorFeature]));
  const project = (x: number, y: number, z: number) => ({ x: 78 + x * 430 + y * 155, y: 365 - z * 250 - y * 65 + x * 28 });
  const normalize = (value: number, r: { min: number; span: number }) => (value - r.min) / r.span;
  const projected = sample.map((row, index) => { const sourceIndex = indices[index]; const x = normalize(row[xFeature], xr), y = normalize(row[yFeature], yr), z = normalize(row[definition.target], zr), pz = normalize(predictions[sourceIndex], zr); return { row, sourceIndex, p: project(x,y,z), fitted: project(x,y,pz), color: normalize(row[colorFeature], cr) }; });
  return <svg className="mlr-3d" viewBox="0 0 730 430" role="img" aria-label="Multiple regression plot from the current OLS fit">
    <defs><linearGradient id="plane" x1="0" x2="1"><stop stopColor="#00d7e5" stopOpacity=".16"/><stop offset="1" stopColor="#00a0d0" stopOpacity=".04"/></linearGradient></defs>
    {Array.from({length:9},(_,i)=>i/8).map(t=><g key={t}><line x1={project(t,0,0).x} y1={project(t,0,0).y} x2={project(t,1,0).x} y2={project(t,1,0).y}/><line x1={project(0,t,0).x} y1={project(0,t,0).y} x2={project(1,t,0).x} y2={project(1,t,0).y}/><line x1={project(0,t,0).x} y1={project(0,t,0).y} x2={project(0,t,1).x} y2={project(0,t,1).y}/></g>)}
    {showPlane && (() => {
      const means: Row = Object.fromEntries(definition.features.map(feature => [feature, rows.reduce((sum, row) => sum + row[feature], 0) / rows.length]));
      const grid = [0, 0.33, 0.66, 1];
      const corners = [[0,0],[1,0],[1,1],[0,1]].map(([u,v]) => {
        const probe = { ...means, [xFeature]: xr.min + u * xr.span, [yFeature]: yr.min + v * yr.span };
        const z = predict ? predict(probe) : zr.min + 0.5 * zr.span;
        return project(u, v, normalize(z, zr));
      });
      return <><polygon points={corners.map(point=>`${point.x},${point.y}`).join(' ')} className="mlr-plane"/>{grid.map(t => {
        const a = { ...means, [xFeature]: xr.min + t * xr.span, [yFeature]: yr.min };
        const b = { ...means, [xFeature]: xr.min + t * xr.span, [yFeature]: yr.min + yr.span };
        const za = predict ? predict(a) : zr.min + 0.5 * zr.span;
        const zb = predict ? predict(b) : zr.min + 0.5 * zr.span;
        const pa = project(t, 0, normalize(za, zr));
        const pb = project(t, 1, normalize(zb, zr));
        return <line key={t} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} className="plane-line"/>;
      })}</>;
    })()}
    {showResiduals && projected.map(point=><line key={`r-${point.sourceIndex}`} x1={point.p.x} y1={point.p.y} x2={point.fitted.x} y2={point.fitted.y} className="mlr-residual"/>)}
    {showPoints && projected.map(point=><circle key={point.sourceIndex} cx={point.p.x} cy={point.p.y} r="4" fill={`hsl(${205-point.color*180} 88% 58%)`} className="mlr-dot"><title>{definition.labels[xFeature]}: {point.row[xFeature]}, {definition.targetLabel}: {point.row[definition.target]}</title></circle>)}
    <text x="355" y="421">{definition.labels[xFeature]}</text><text x="26" y="395">{definition.labels[yFeature]}</text><text x="12" y="160" transform="rotate(-90 12 160)">{definition.targetLabel}</text>
  </svg>;
}

function ResidualHistogram({ residuals }: { residuals: number[] }) { const max = Math.max(...residuals.map(Math.abs),1); const bins=Array.from({length:13},()=>0); residuals.forEach(value=>{const i=clamp(Math.floor(((value+max)/(2*max))*13),0,12);bins[i]++;}); const peak=Math.max(...bins,1); return <svg viewBox="0 0 260 125" aria-label="Residual histogram">{bins.map((value,index)=><rect key={index} x={index*19+7} y={112-(value/peak)*96} width="14" height={(value/peak)*96} fill="#5558f3"/>)}<path d="" fill="none"/><line x1="5" x2="255" y1="112" y2="112"/></svg>; }
function ResidualScatter({ predictions, residuals }: { predictions: number[]; residuals: number[] }) { const pr={min:Math.min(...predictions),span:Math.max(...predictions)-Math.min(...predictions)||1};const max=Math.max(...residuals.map(Math.abs),1);return <svg viewBox="0 0 300 140" aria-label="Residuals versus fitted chart"><line x1="25" x2="290" y1="70" y2="70" className="zero"/>{predictions.slice(0,100).map((prediction,index)=><circle key={index} cx={25+((prediction-pr.min)/pr.span)*265} cy={70-(residuals[index]/max)*55} r="3" fill="#8b5cf6"/>)}<line x1="25" x2="25" y1="8" y2="130"/><line x1="25" x2="290" y1="130" y2="130"/></svg>; }

type TabProps = { activeTab: TabId; definition: DatasetDefinition; datasetKey: DatasetKey; rows: Row[]; predictions: number[]; residuals: number[]; coefficients: number[]; inputs: Row; score: number; metricRmse: number; metricMae: number; training: boolean; selectedRow: number; predictedValue: number; selectedFeatures?: string[]; trainR2?: number | null; testR2?: number | null; nTrain?: number; nTest?: number; seed?: number; testSize?: number; fitError?: string | null; vif?: number[]; trainMetrics?: ReturnType<typeof regressionMetrics> | null; testMetrics?: ReturnType<typeof regressionMetrics> | null; stale?: boolean; split?: ReturnType<typeof splitRegressionData<Row>> | null; onSeed?: (value: number) => void; onTestSize?: (value: number) => void; onDataset:(key:DatasetKey)=>void; onTrain:()=>void; onReset:()=>void; onRow:(index:number,field:string,value:number)=>void; onSelectRow:(index:number)=>void; onAddRow:()=>void; onDeleteRow:()=>void; onUpload:()=>void; onInput:(feature:string,value:number)=>void; };

function TabView(props: TabProps) {
  const { activeTab, definition } = props;
  if (activeTab === 'dataset') return <section className="mlr-tab-panel"><PanelHeader title="Dataset Workspace" subtitle="Edit training rows live, load another built-in dataset, or import a compatible CSV." /><div className="mlr-dataset-actions"><select aria-label="Dataset source" value={props.datasetKey} onChange={event=>props.onDataset(event.target.value as DatasetKey)}><option value="housing">Housing Prices</option><option value="energy">Energy Demand</option><option value="collinear">Multicollinear</option><option value="sparse">Irrelevant features</option><option value="labHousing">Lab housing</option><option value="constantFeat">Constant feature</option></select><button onClick={props.onAddRow}><Plus/>Add Row</button><button onClick={props.onDeleteRow} disabled={props.rows.length<=definition.features.length+1}><Trash2/>Remove Selected</button><button onClick={props.onUpload}><Upload/>Upload CSV</button><button onClick={props.onReset}><RotateCcw/>Reset Data</button></div><div className="mlr-table-wrap"><table><thead><tr><th>#</th>{[...definition.features,definition.target].map(field=><th key={field}>{definition.labels[field]}</th>)}</tr></thead><tbody>{props.rows.map((row,index)=><tr key={index} className={props.selectedRow===index?'selected':''} onClick={()=>props.onSelectRow(index)}><td>{index+1}</td>{[...definition.features,definition.target].map(field=><td key={field}><input aria-label={`Row ${index+1} ${definition.labels[field]}`} type="number" value={row[field]} onChange={event=>props.onRow(index,field,Number(event.target.value))}/></td>)}</tr>)}</tbody></table></div></section>;
  if (activeTab === 'train') return <section className="mlr-tab-panel"><PanelHeader title="Train the Model" subtitle="Fit ordinary least squares to the current editable dataset using the shared normal-equation engine." /><div className="mlr-training-stage"><BrainCircuit/><h2>{props.training?'Optimizing coefficients…':'Ready to train'}</h2><p>{props.rows.length} samples · train {props.nTrain ?? '—'} · test {props.nTest ?? '—'} · features: {(props.selectedFeatures ?? definition.features).length} · target: {definition.targetLabel}</p>{props.fitError && <p>{props.fitError}</p>}<label>Test fraction <input type="number" min={0.1} max={0.5} step={0.05} value={props.testSize ?? 0.2} onChange={event => props.onTestSize?.(Number(event.target.value))} /></label><label>Seed <input type="number" value={props.seed ?? 42} onChange={event => props.onSeed?.(Number(event.target.value))} /></label><button onClick={props.onTrain} disabled={props.training}><Play/>{props.training?'Training…':'Train Model'}</button><button onClick={props.onReset}><RotateCcw/>Reset Experiment</button></div></section>;
  if (activeTab === 'metrics') {
    const features = props.selectedFeatures ?? definition.features;
    const predictRow = (row: Row) => props.coefficients[0] + features.reduce((sum, feature, index) => sum + (props.coefficients[index + 1] ?? 0) * (row[feature] ?? 0), 0);
    const testPredicted = props.split?.testX.map(predictRow);
    const testResiduals = props.split && testPredicted ? props.split.testY.map((value, index) => value - testPredicted[index]) : props.residuals;
    return <section className="mlr-tab-panel"><PanelHeader title="Model Metrics" subtitle="The OLS fit uses the training fold only. Test MAE, RMSE, and R² are held-out scores, not training accuracy." /><div className="mlr-big-metrics"><Metric label="Train R²" value={formatR2(props.trainR2)}/><Metric label="Test R²" value={formatR2(props.testR2)}/><Metric label="Test RMSE" value={formatNumber(props.metricRmse,2)}/><Metric label="Test MAE" value={formatNumber(props.metricMae,2)}/></div><div className="mlr-tab-charts"><ResidualHistogram residuals={testResiduals}/><ResidualScatter predictions={testPredicted ?? props.predictions} residuals={testResiduals}/></div><RegressionDiagnosticsPanel algorithm="Multiple Linear Regression" dataset={definition.label} samples={props.rows.length} features={features.length} split={`${Math.round((1-(props.testSize??0.2))*100)}/${Math.round((props.testSize??0.2)*100)}`} seed={props.seed} state={modelLifecycle({ training: props.training, error: props.fitError, trained: true, stale: Boolean(props.stale) })} train={props.trainMetrics} test={props.testMetrics} testActual={props.split?.testY} testPredicted={testPredicted} suitability="Approximately linear relationships among several numeric features." complexity={`${features.length + 1} coefficients`} /></section>;
  }
  if (activeTab === 'compare') { const baseline=props.rows.reduce((sum,row)=>sum+row[definition.target],0)/props.rows.length; const baselineRmse=rmse(props.rows.map(r=>r[definition.target]),props.rows.map(()=>baseline)); return <section className="mlr-tab-panel"><PanelHeader title="Model Comparison" subtitle="Compare the trained multivariate model with a mean-only baseline." /><div className="mlr-compare"><article><h3>Multiple Linear Regression</h3><strong>{formatNumber(props.metricRmse,2)}</strong><p>RMSE</p></article><b>VS</b><article><h3>Mean Baseline</h3><strong>{formatNumber(baselineRmse,2)}</strong><p>RMSE</p></article></div></section>; }
  if (activeTab === 'explain') return <section className="mlr-tab-panel"><PanelHeader title="Explain the Model" subtitle="Coefficients are partial effects. VIF = 1 / (1 − R²_j) from regressing feature j on the others. Higher VIF means a stronger multicollinearity concern, not an automatic fail." /><div className="mlr-explanations">{(props.selectedFeatures ?? definition.features).map((feature,index)=><article key={feature}><span>β{index+1}</span><div><h3>{definition.labels[feature]}</h3><p>Coefficient {formatNumber(props.coefficients[index+1],2)} · |β| {formatNumber(Math.abs(props.coefficients[index+1] ?? 0),2)} · VIF {Number.isFinite(props.vif?.[index] ?? NaN) ? formatNumber(props.vif![index], 2) : '∞'}. A one-unit increase changes {definition.targetLabel.toLowerCase()} by that coefficient when other included features stay fixed.</p></div></article>)}</div></section>;
  return <section className="mlr-tab-panel"><PanelHeader title="Multiple Linear Regression" subtitle="Learn how several features combine to estimate one continuous target." /><div className="mlr-learn-grid"><article><h3>Model</h3><p>ŷ = β₀ + β₁x₁ + … + βₚxₚ</p></article><article><h3>Objective</h3><p>Choose coefficients that minimize the sum of squared residuals.</p></article><article><h3>Interpretation</h3><p>Each coefficient measures a feature's partial effect with other inputs held fixed.</p></article><article><h3>Try it</h3><p>Edit a row, retrain, and observe how the coefficients and residuals respond.</p></article></div></section>;
}
function PanelHeader({title,subtitle}:{title:string;subtitle:string}){return <header className="mlr-panel-header"><h2>{title}</h2><p>{subtitle}</p></header>;}function Metric({label,value}:{label:string;value:string}){return <article><small>{label}</small><strong>{value}</strong></article>;}
