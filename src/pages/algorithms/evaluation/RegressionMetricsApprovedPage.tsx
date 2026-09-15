import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import { Link } from "react-router-dom";
import { mae, mse, rSquared, rmse } from "../../../lib/math/metrics";
import "./RegressionMetricsApprovedPage.css";

type RegressionDataset = {
  name: string;
  target: string;
  features: number;
  actual: number[];
  residual: number[];
  fixedPredicted?: number[];
};

const rng = (seed: number) => {
  let state = seed >>> 0;
  return () => (state = (1664525 * state + 1013904223) >>> 0) / 4294967296;
};

const buildDataset = (
  name: string,
  target: string,
  rows: number,
  features: number,
  seed: number,
  targetRmse: number,
): RegressionDataset => {
  const random = rng(seed);
  const actual = Array.from({ length: rows }, () => {
    const broad = random();
    const centered = (random() + random() + random()) / 3;
    return 2.5 + 48 * (0.67 * broad + 0.33 * centered);
  });
  const raw = actual.map((_, index) => {
    const unit = random();
    const laplace =
      -2.4 * Math.sign(unit - 0.5) * Math.log(1 - 2 * Math.abs(unit - 0.5));
    const ordinary = Math.max(-6, Math.min(6, laplace));
    if (index % 130 === 17) {
      return (index % 260 === 17 ? 1 : -1) * (22 + random() * 6);
    }
    return ordinary;
  });
  const mean = raw.reduce((sum, value) => sum + value, 0) / raw.length;
  const centered = raw.map((value) => value - mean);
  const currentRmse = Math.sqrt(
    centered.reduce((sum, value) => sum + value * value, 0) / centered.length,
  );
  const residual = centered.map((value) => value * targetRmse / currentRmse);
  return { name, target, features, actual, residual };
};

const datasets = [
  buildDataset(
    "California Housing (Clean)",
    "MedHouseVal ($100K)",
    8064,
    8,
    59,
    3.9,
  ),
  buildDataset("Ames Housing", "SalePrice ($10K)", 2930, 24, 71, 4.6),
  buildDataset("Energy Efficiency", "Heating Load", 768, 8, 83, 2.25),
];

const modelFactors: Record<string, number> = {
  "Random Forest Regressor": 1,
  "Gradient Boosting Regressor": 0.88,
  "Linear Regression": 1.24,
};

const quantile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + (sorted[lower + 1] - sorted[lower] || 0) * fraction;
};

const summarize = (actual: number[], predicted: number[]) => ({
  mae: mae(actual, predicted),
  mse: mse(actual, predicted),
  rmse: rmse(actual, predicted),
  r2: rSquared(actual, predicted),
});

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : "0.00";

export default function RegressionMetricsApprovedPage() {
  const [datasetIndex, setDatasetIndex] = useState(0);
  const [customDataset, setCustomDataset] = useState<RegressionDataset | null>(null);
  const [model, setModel] = useState("Random Forest Regressor");
  const [tab, setTab] = useState("Visualize");
  const [showOutliers, setShowOutliers] = useState(true);
  const [showZero, setShowZero] = useState(true);
  const [equalAxes, setEqualAxes] = useState(false);
  const [jitter, setJitter] = useState(false);
  const [outlierRule, setOutlierRule] = useState("IQR (1.5×)");
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("Linked Views");
  const go = useLabNavigate();
  const uploadRef = useRef<HTMLInputElement>(null);
  const dataset = customDataset ?? datasets[datasetIndex];

  const predicted = useMemo(() => {
    if (dataset.fixedPredicted) return dataset.fixedPredicted;
    const factor = modelFactors[model];
    return dataset.actual.map(
      (actualValue, index) => actualValue - dataset.residual[index] * factor,
    );
  }, [dataset, model]);
  const residuals = dataset.actual.map(
    (actualValue, index) => actualValue - predicted[index],
  );
  const allMetrics = summarize(dataset.actual, predicted);
  const residualMean =
    residuals.reduce((sum, value) => sum + value, 0) /
    Math.max(1, residuals.length);
  const residualStd = Math.sqrt(
    residuals.reduce(
      (sum, value) => sum + (value - residualMean) ** 2,
      0,
    ) / Math.max(1, residuals.length),
  );
  const q1 = quantile(residuals, 0.25);
  const q3 = quantile(residuals, 0.75);
  const iqr = q3 - q1;

  const isOutlier = (value: number, rule = outlierRule) => {
    if (rule === "None") return false;
    if (rule === "3σ" || rule === "5σ") {
      return Math.abs(value - residualMean) > residualStd * (rule === "5σ" ? 5 : 3);
    }
    return value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr;
  };
  const outlierFlags = residuals.map((value) => isOutlier(value));
  const outlierCount = outlierFlags.filter(Boolean).length;

  const filteredMetrics = (rule: string) => {
    const indexes = residuals
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => !isOutlier(value, rule))
      .map(({ index }) => index);
    return summarize(
      indexes.map((index) => dataset.actual[index]),
      indexes.map((index) => predicted[index]),
    );
  };
  const noIqr = filteredMetrics("IQR (1.5×)");
  const noSigma = filteredMetrics("5σ");

  const sampleStride = Math.max(1, Math.ceil(dataset.actual.length / 720));
  const plotted = dataset.actual
    .map((actualValue, index) => ({
      index,
      actual: actualValue,
      predicted: predicted[index],
      residual: residuals[index],
      outlier: outlierFlags[index],
    }))
    .filter((point, index) => index % sampleStride === 0 || point.outlier)
    .filter((point) => showOutliers || !point.outlier);
  const domainMax = equalAxes
    ? Math.max(50, ...dataset.actual, ...predicted) * 1.03
    : Math.max(50, ...dataset.actual) * 1.03;
  const residualLimit = Math.max(
    12,
    ...residuals.map((value) => Math.abs(value)),
  ) * 1.08;
  const xActual = (value: number) => 40 + value / domainMax * 500;
  const yPredicted = (value: number) => 320 - value / domainMax * 270;
  const xPredicted = (value: number) => 42 + value / domainMax * 495;
  const yResidual = (value: number) =>
    184 - value / residualLimit * 136;

  const upload = async (file?: File) => {
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter(
        (row) =>
          row.length >= 2 && Number.isFinite(row[0]) && Number.isFinite(row[1]),
      );
    if (!rows.length) {
      setMessage("Upload needs actual,predicted columns");
      return;
    }
    setCustomDataset({
      name: file.name,
      target: "Imported target",
      features: 1,
      actual: rows.map((row) => row[0]),
      residual: rows.map((row) => row[0] - row[1]),
      fixedPredicted: rows.map((row) => row[1]),
    });
    setSelected(null);
    setMessage(`${file.name} · ${rows.length} rows`);
  };

  const selectDataset = (index: number) => {
    setCustomDataset(null);
    setDatasetIndex(index);
    setSelected(null);
    setMessage(`${datasets[index].name} loaded`);
  };

  const metricCards: Array<{
    label: string;
    description: string;
    value: number;
    color: string;
    direction: string;
  }> = [
    { label: "MAE", description: "Mean Absolute Error", value: allMetrics.mae, color: "cyan", direction: "Lower is better" },
    { label: "MSE", description: "Mean Squared Error", value: allMetrics.mse, color: "amber", direction: "Lower is better" },
    { label: "RMSE", description: "Root Mean Squared Error", value: allMetrics.rmse, color: "orange", direction: "Lower is better" },
    { label: "R²", description: "Coefficient of Determination", value: allMetrics.r2, color: "green", direction: "Higher is better" },
  ];
  const sensitivityRows: Array<{
    label: string;
    values: [number, number, number];
    max: number;
  }> = [
    { label: "MAE", values: [allMetrics.mae, noIqr.mae, noSigma.mae], max: 3.5 },
    { label: "MSE", values: [allMetrics.mse, noIqr.mse, noSigma.mse], max: 20 },
    { label: "RMSE", values: [allMetrics.rmse, noIqr.rmse, noSigma.rmse], max: 5 },
    { label: "R²", values: [allMetrics.r2, noIqr.r2, noSigma.r2], max: 1 },
  ];
  const sensitivityColors = ["violet", "cyan", "yellow"];

  return (
    <div className="rm-page">
      <aside className="rm-side">
        <Link className="rm-brand" to="/"><span>▥</span><b>Mega ML<small>AI Observatory</small></b></Link>
        <div className="rm-nav panel">
          <b>LEARN</b>
          <button onClick={() => go("All Lessons")}>⇧ All Lessons</button>
          <hr /><b>REGRESSION</b>
          {["◉ Overview", "▥ Regression Metrics", "♧ Algorithms", "◇ Feature Engineering"].map((item) => <button className={item.includes("Regression Metrics") ? "active" : ""} onClick={() => go(item)} key={item}>{item}</button>)}
          <hr /><b>PLAYGROUND</b>
          {["☷ Notebooks", "⌘ Experiments", "♧ Models"].map((item) => <button onClick={() => go(item)} key={item}>{item}</button>)}
          <hr /><b>DATA</b>
          <button onClick={() => go("Datasets")}>▤ Datasets</button>
          <button onClick={() => uploadRef.current?.click()}>⇧ Uploads</button>
        </div>
        <section className="rm-progress panel"><b>Learning Progress</b><div><span>74%</span></div><small>Progress</small><p>Lesson 4 of 12</p><progress max="100" value="74" /><p>Next: Outlier Impact</p><button onClick={() => setMessage("Lesson continued")}>Continue Lesson</button></section>
        <div className="rm-side-actions">⚙ ⓘ ◉ ⌗</div>
        <button className="rm-collapse" onClick={() => setMessage("Navigation collapsed")}>≪</button>
      </aside>

      <header className="rm-head">
        <p>Regression › <b>Regression Metrics</b></p>
        <div className="rm-title"><span>▥</span><h1>Regression Metrics<small>Understand performance using error metrics and visual diagnostics. Explore how outliers affect your model.</small></h1></div>
        <div className="rm-objective"><b>◉ OBJECTIVE</b><p>Interpret regression performance using metrics, visualizations, and outlier analysis.</p></div>
        <label className="rm-dataset-head">Sample Dataset<select aria-label="Sample Dataset" value={customDataset ? "custom" : datasetIndex} onChange={(event) => event.target.value !== "custom" && selectDataset(Number(event.target.value))}>{customDataset && <option value="custom">{customDataset.name}</option>}{datasets.map((item, index) => <option value={index} key={item.name}>{item.name}</option>)}</select><small>{dataset.actual.length.toLocaleString("en-US")} rows • {dataset.features} features</small></label>
        <button className="rm-upload" onClick={() => uploadRef.current?.click()}>⇧ Upload Dataset</button>
        <input hidden ref={uploadRef} type="file" accept=".csv" onChange={(event) => upload(event.target.files?.[0])} />
        <nav className="rm-tabs">{["▤ Learn", "▥ Visualize", "▤ Dataset", "✣ Transform", "♧ Train", "▥ Metrics", "⌁ Compare", "♙ Explain"].map((item) => { const name = item.replace(/^[^A-Za-z]+/, ""); return <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={item}>{item}</button>; })}</nav>
      </header>

      <main className="rm-main">
        <section className="rm-plots">
          <article className="panel actual-plot"><h2>Actual vs Predicted <small>ⓘ</small></h2><p className="plot-legend"><span>– – Ideal (y = ŷ)</span><span>● Predictions</span><span>● Outliers</span></p><svg viewBox="0 0 560 350" role="img" aria-label="Actual versus predicted scatter plot">
            {[0,10,20,30,40,50].map((tick) => <g key={tick}><line className="grid" x1={xActual(tick)} y1="45" x2={xActual(tick)} y2="320" /><line className="grid" x1="40" y1={yPredicted(tick)} x2="540" y2={yPredicted(tick)} /><text x={xActual(tick)} y="338">{tick}</text><text x="27" y={yPredicted(tick)+3}>{tick}</text></g>)}
            <line className="ideal" x1={xActual(0)} y1={yPredicted(0)} x2={xActual(domainMax)} y2={yPredicted(domainMax)} />
            {plotted.map((point) => <circle key={point.index} className={point.outlier ? "outlier" : selected === point.index ? "selected" : "prediction"} cx={xActual(point.actual) + (jitter ? Math.sin(point.index) * 1.4 : 0)} cy={yPredicted(point.predicted) + (jitter ? Math.cos(point.index) * 1.4 : 0)} r={point.outlier ? 2.1 : selected === point.index ? 3 : 1.35} onClick={() => setSelected(point.index)} />)}
            <text className="axis" x="242" y="349">Actual Values ({dataset.target})</text><text className="axis vertical" x="8" y="180">Predicted Values ({dataset.target})</text>
          </svg><div className="plot-stat"><span>Points<b>{dataset.actual.length.toLocaleString("en-US")}</b></span><span>Outliers<b>{outlierCount} ({(outlierCount / dataset.actual.length * 100).toFixed(2)}%)</b></span><span>Selected<b>{selected === null ? 0 : selected + 1}</b></span></div><div className="plot-tools">{["⬡","⌕","✥","⌁","↻"].map((tool) => <button onClick={() => setMessage(`Plot tool ${tool}`)} key={tool}>{tool}</button>)}</div></article>

          <article className="panel residual-plot"><h2>Residuals vs Predicted <small>ⓘ</small></h2><p className="plot-legend"><span>● Residuals</span><span>– – Zero Error</span></p><svg viewBox="0 0 560 350" role="img" aria-label="Residuals versus predicted scatter plot">
            {[0,10,20,30,40,50].map((tick) => <line className="grid" key={`x${tick}`} x1={xPredicted(tick)} y1="45" x2={xPredicted(tick)} y2="320" />)}
            {[-30,-20,-10,0,10,20,30].map((tick) => <g key={`y${tick}`}><line className="grid" x1="42" y1={yResidual(tick)} x2="537" y2={yResidual(tick)} /><text x="25" y={yResidual(tick)+3}>{tick}</text></g>)}
            {showZero && <line className="zero" x1="42" y1={yResidual(0)} x2="537" y2={yResidual(0)} />}
            {plotted.map((point) => <circle key={point.index} className={point.outlier ? "outlier" : selected === point.index ? "selected" : "residual"} cx={xPredicted(point.predicted) + (jitter ? Math.cos(point.index) * 1.4 : 0)} cy={yResidual(point.residual) + (jitter ? Math.sin(point.index) * 1.4 : 0)} r={point.outlier ? 2.1 : selected === point.index ? 3 : 1.35} onClick={() => setSelected(point.index)} />)}
            <text className="axis" x="230" y="349">Predicted Values ({dataset.target})</text><text className="axis vertical" x="8" y="180">Residuals (Actual - Predicted)</text>
          </svg><div className="residual-stat"><span>Mean<b>{residualMean.toFixed(2)}</b></span><span>Std Dev<b>{residualStd.toFixed(2)}</b></span><span>Range<b>[{Math.min(...residuals).toFixed(2)}, {Math.max(...residuals).toFixed(2)}]</b></span></div><button className="linked" onClick={() => setMessage(selected === null ? "Select a point in either plot" : `Point ${selected + 1} linked`)}>⌘ Linked Views</button></article>
        </section>

        <section className="rm-sensitivity panel"><div><h2>Outlier Sensitivity Comparison <small>ⓘ</small></h2><p>Impact of outliers on model performance</p><span className="violet">● All Data (with outliers)</span><span className="cyan">● No Outliers (IQR)</span><span className="yellow">● No Outliers (5σ)</span></div>{sensitivityRows.map((row) => <article key={row.label}><h3>{row.label}</h3>{row.values.map((value, index) => <p key={sensitivityColors[index]}><b>{value.toFixed(row.label === "R²" ? 3 : 2)}</b><i className={sensitivityColors[index]} style={{"--bar":`${Math.max(4, Math.min(100, value / row.max * 100))}%`} as CSSProperties} /></p>)}</article>)}<aside>💡<p>Outliers increase errors. MSE and RMSE are more sensitive to outliers than MAE. R² improves when outliers are removed.</p></aside></section>

        <section className="rm-insight panel"><b>☆ Key Insight</b><p>Your model explains <strong>{(allMetrics.r2 * 100).toFixed(1)}%</strong> of the variance in {dataset.name.toLowerCase()}.<br />Errors are mostly centered around zero with a few high-value outliers.</p><b>▣ What's Next?</b><p>Explore how different algorithms handle outliers.</p><button onClick={() => { const models=Object.keys(modelFactors); setModel(models[(models.indexOf(model)+1)%models.length]); setMessage("Compared next model"); }}>Compare Models</button></section>
      </main>

      <aside className="rm-controls panel"><h2>Model</h2><select aria-label="Model" value={model} onChange={(event) => setModel(event.target.value)}>{Object.keys(modelFactors).map((name) => <option key={name}>{name}</option>)}</select><label>Target<input aria-label="Target" readOnly value={dataset.target} /></label><h2>Error Metrics <small>ⓘ</small></h2><div className="rm-metrics">{metricCards.map((card) => <article className={card.color} key={card.label}><span><b>{card.label}</b><small>{card.description}</small></span><strong>{formatNumber(card.value)}</strong><i>{card.direction}</i></article>)}</div><hr /><h2>View Options</h2><label className="check"><input type="checkbox" checked={showOutliers} onChange={(event) => setShowOutliers(event.target.checked)} /> Show Outliers (IQR)</label><label className="check"><input type="checkbox" checked={showZero} onChange={(event) => setShowZero(event.target.checked)} /> Show Zero Error Line</label><label className="check"><input type="checkbox" checked={equalAxes} onChange={(event) => setEqualAxes(event.target.checked)} /> Equal Axis Scale</label><label className="check"><input type="checkbox" checked={jitter} onChange={(event) => setJitter(event.target.checked)} /> Jitter Points</label><label>Outlier Rule <small>ⓘ</small><select aria-label="Outlier Rule" value={outlierRule} onChange={(event) => setOutlierRule(event.target.value)}>{["IQR (1.5×)","3σ","None"].map((rule) => <option key={rule}>{rule}</option>)}</select></label><Link reloadDocument to="?advanced=1">Open original metrics lab →</Link></aside>
      <footer className="rm-status">{message}</footer>
    </div>
  );
}
