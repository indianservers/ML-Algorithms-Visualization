import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  binaryMetrics,
  precisionRecallCurve,
} from "../../../lib/math/metrics";
import {
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
import "./PrecisionRecallApprovedPage.css";

type ScoreDataset = {
  name: string;
  shortName: string;
  positiveName: string;
  negativeName: string;
  featureCount: number;
  actual: number[];
  scores: number[];
};

const spread = (index: number, count: number, min: number, max: number, power: number) => {
  const unit = (index + 0.5) / Math.max(1, count);
  return min + (max - min) * unit ** power;
};

const makeControlledDataset = (
  name: string,
  shortName: string,
  positiveName: string,
  negativeName: string,
  positives: number,
  negatives: number,
  truePositivesAt37: number,
  falsePositivesAt37: number,
  featureCount: number,
): ScoreDataset => {
  const actual: number[] = [];
  const scores: number[] = [];
  for (let index = 0; index < positives; index++) {
    actual.push(1);
    scores.push(
      index < truePositivesAt37
        ? spread(index, truePositivesAt37, 0.371, 0.985, 0.82)
        : spread(index - truePositivesAt37, positives - truePositivesAt37, 0.055, 0.369, 0.72),
    );
  }
  for (let index = 0; index < negatives; index++) {
    actual.push(0);
    scores.push(
      index < falsePositivesAt37
        ? spread(index, falsePositivesAt37, 0.371, 0.835, 1.75)
        : spread(index - falsePositivesAt37, negatives - falsePositivesAt37, 0.008, 0.369, 1.3),
    );
  }
  return {
    name,
    shortName,
    positiveName,
    negativeName,
    featureCount,
    actual,
    scores,
  };
};

const datasets = [
  makeControlledDataset(
    "Credit Card Fraud (Kaggle)",
    "Credit Card Fraud",
    "Fraud",
    "Non-Fraud",
    1250,
    23750,
    581,
    1610,
    30,
  ),
  makeControlledDataset(
    "Customer Churn",
    "Customer Churn",
    "Churned",
    "Retained",
    1150,
    8850,
    702,
    1280,
    18,
  ),
  makeControlledDataset(
    "Loan Approval",
    "Loan Approval",
    "Approved",
    "Declined",
    1800,
    6200,
    1370,
    930,
    14,
  ),
];

const metricsAt = (actual: number[], scores: number[], threshold: number) => {
  const predicted = scores.map((score) => (score >= threshold ? 1 : 0));
  const base = binaryMetrics(actual, predicted);
  const positiveCount = actual.filter(Boolean).length;
  return {
    ...base,
    fpr: base.fp / Math.max(1, base.fp + base.tn),
    fnr: base.fn / Math.max(1, base.fn + base.tp),
    positiveCount,
    negativeCount: actual.length - positiveCount,
    predictedPositive: base.tp + base.fp,
  };
};

const formatCount = (value: number) => value.toLocaleString("en-US");
export default function PrecisionRecallApprovedPage() {
  const [datasetIndex, setDatasetIndex] = useState(0);
  const [customDataset, setCustomDataset] = useState<ScoreDataset | null>(null);
  const [threshold, setThreshold] = useState(0.37);
  const [bins, setBins] = useState(50);
  const { tab, setTab, panel, layout, lesson } = useLabTabs("Learn");
  const [showIso, setShowIso] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showPoint, setShowPoint] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [message, setMessage] = useState("Ready");
  const go = useLabNavigate();
  const uploadRef = useRef<HTMLInputElement>(null);
  const dataset = customDataset ?? datasets[datasetIndex];

  const curve = useMemo(
    () => precisionRecallCurve(dataset.actual, dataset.scores),
    [dataset],
  );
  const ap = useMemo(
    () =>
      curve.precision.reduce(
        (sum, precision, index) =>
          sum +
          precision *
            Math.max(
              0,
              curve.recall[index] - (index ? curve.recall[index - 1] : 0),
            ),
        0,
      ),
    [curve],
  );
  const prevalence =
    dataset.actual.filter(Boolean).length / Math.max(1, dataset.actual.length);
  const current = metricsAt(dataset.actual, dataset.scores, threshold);

  const sampledCurve = useMemo(() => {
    const stride = Math.max(1, Math.ceil(curve.precision.length / 92));
    const points = curve.precision
      .map((precision, index) => ({
        precision,
        recall: curve.recall[index],
        threshold: curve.thresholds[index],
      }))
      .filter((_, index) => index % stride === 0);
    const last = curve.precision.length - 1;
    if (points.at(-1)?.threshold !== curve.thresholds[last]) {
      points.push({
        precision: curve.precision[last],
        recall: curve.recall[last],
        threshold: curve.thresholds[last],
      });
    }
    return points;
  }, [curve]);

  const histogram = useMemo(() => {
    const positive = Array(bins).fill(0) as number[];
    const negative = Array(bins).fill(0) as number[];
    dataset.scores.forEach((score, index) => {
      const bucket = Math.min(bins - 1, Math.floor(score * bins));
      (dataset.actual[index] ? positive : negative)[bucket]++;
    });
    return { positive, negative, max: Math.max(1, ...positive, ...negative) };
  }, [bins, dataset]);

  const suggestions = useMemo(() => {
    const candidates = curve.thresholds
      .map((candidateThreshold, index) => ({
        threshold: candidateThreshold,
        precision: curve.precision[index],
        recall: curve.recall[index],
        f1:
          (2 * curve.precision[index] * curve.recall[index]) /
            Math.max(0.0001, curve.precision[index] + curve.recall[index]),
      }))
      .filter((candidate) => Number.isFinite(candidate.threshold));
    const maxF1 = candidates.reduce((best, candidate) =>
      candidate.f1 > best.f1 ? candidate : best,
    );
    const recallCandidates = candidates.filter(
      (candidate) => candidate.recall >= 0.8,
    );
    const precisionCandidates = candidates.filter(
      (candidate) => candidate.precision >= 0.5,
    );
    const highRecall = recallCandidates.reduce(
      (best, candidate) =>
        candidate.precision > best.precision ? candidate : best,
      recallCandidates[0] ?? candidates.at(-1) ?? candidates[0],
    );
    const highPrecision = precisionCandidates.reduce(
      (best, candidate) => (candidate.recall > best.recall ? candidate : best),
      precisionCandidates[0] ?? candidates[0],
    );
    return { maxF1, highRecall, highPrecision };
  }, [curve]);

  const curvePath = sampledCurve
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${46 + point.recall * 430},${250 - point.precision * 220}`,
    )
    .join(" ");
  const confidencePath = [
    ...sampledCurve.map((point) => ({
      x: 46 + point.recall * 430,
      y: 250 - Math.min(1, point.precision + 0.045) * 220,
    })),
    ...[...sampledCurve].reverse().map((point) => ({
      x: 46 + point.recall * 430,
      y: 250 - Math.max(0, point.precision - 0.045) * 220,
    })),
  ]
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");

  const trends = [0.1, 0.2, threshold, 0.6, 0.9].map((value) => ({
    threshold: value,
    ...metricsAt(dataset.actual, dataset.scores, value),
  }));

  const changeDataset = (index: number) => {
    setCustomDataset(null);
    setDatasetIndex(index);
    setThreshold(0.37);
    setMessage(`${datasets[index].shortName} loaded`);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter(
        (row) =>
          row.length >= 2 &&
          (row[0] === 0 || row[0] === 1) &&
          Number.isFinite(row[1]) &&
          row[1] >= 0 &&
          row[1] <= 1,
      );
    if (!rows.length) {
      setMessage("Upload needs actual,score columns");
      return;
    }
    setCustomDataset({
      name: file.name,
      shortName: file.name,
      positiveName: "Positive",
      negativeName: "Negative",
      featureCount: 1,
      actual: rows.map((row) => row[0]),
      scores: rows.map((row) => row[1]),
    });
    setThreshold(0.37);
    setMessage(`${file.name} · ${rows.length} scores`);
  };

  const exportCurve = () => {
    const csv = [
      "threshold,precision,recall",
      ...curve.thresholds.map(
        (curveThreshold, index) =>
          `${curveThreshold},${curve.precision[index]},${curve.recall[index]}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "precision-recall-curve.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Curve exported");
  };

  return (
    <div className="pr-page">
      <aside className="pr-side">
        <Link className="pr-brand" to="/">
          <span>✣</span>
          <b>Mega ML<small>AI OBSERVATORY</small></b>
        </Link>
        <nav>
          {["♧ Overview", "▤ Datasets", "◇ Models", "♙ Experiments", "◉ Playground", "♧ Deployments", "▣ Reports", "⚙ Settings"].map((item) => (
            <button
              className={item.includes("Playground") ? "active" : ""}
              key={item}
              onClick={() => go(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="pr-help" onClick={() => go("Help")}>? Help</button>
        <button className="pr-user" onClick={() => setMessage("Profile opened")}>
          <span>AS</span><b>Avery Smith<small>Data Scientist</small></b><i>›</i>
        </button>
      </aside>

      <header className="pr-head">
        <div className="crumb">‹ Playground</div>
        <h1>Precision-Recall Curve <small>ⓘ</small></h1>
        <div className="pr-actions">
          <button onClick={exportCurve}>⇧ Export</button>
          <button onClick={() => setMessage("Share link copied")}>⌘ Share</button>
          <button className="save" onClick={() => {
            localStorage.setItem("precision-recall-threshold", `${threshold}`);
            setMessage("View saved");
          }}>⌘ Save View</button>
        </div>
        <nav className="pr-tabs" role="tablist" aria-label="Precision-recall sections">
          {["▤ Learn", "▧ Visualize", "▤ Dataset", "◇ Transform", "♧ Train", "›", "▥ Metrics", "⌘ Compare", "│", "♙ Explain"].map((item) => {
            const name = item.replace(/^[^A-Za-z]+/, "");
            if (item === "›" || item === "│") return <i key={item}>{item}</i>;
            return <button role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={item}>{item}</button>;
          })}
        </nav>
      </header>

      <main className="pr-main">
        {lesson && <LabLessonPanel tab={tab} route="/ml/evaluation/precision-recall-curve" />}
        <section className={`pr-intro panel${panel("Dataset", "Transform", "Train", "Metrics")}`}>
          <article><b>OBJECTIVE</b><p>Understand the precision-recall trade-off across classification thresholds and identify the best threshold for your use case.</p></article>
          <article><b>HOW IT WORKS</b><p>Each point on the curve is computed at a specific threshold. Moving the threshold changes precision and recall.</p></article>
          <article><b>PROGRESS</b><p>Interact with the threshold slider to see how the curve, predictions, and metrics update in real time.</p></article>
          <div className="pr-progress"><span>100%</span></div>
        </section>

        <section className={`pr-work-row${layout}`}>
          <article className={`panel pr-distribution${panel("Dataset", "Transform")}`}>
            <h2>Score Distribution <small>ⓘ</small></h2>
            <div className="dist-legend">
              <span className="positive">● Positive (Actual)</span><b>{formatCount(current.positiveCount)} ({(prevalence * 100).toFixed(1)}%)</b>
              <span className="negative">● Negative (Actual)</span><b>{formatCount(current.negativeCount)} ({((1 - prevalence) * 100).toFixed(1)}%)</b>
            </div>
            <svg viewBox="0 0 380 190" role="img" aria-label="Score distribution histogram">
              <line x1="42" y1="155" x2="370" y2="155" />
              <line x1="42" y1="15" x2="42" y2="155" />
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => <text x={42 + tick * 328} y="174" key={tick}>{tick.toFixed(1)}</text>)}
              {histogram.negative.map((count, index) => <rect className="neg-bar" key={`n${index}`} x={42 + index * (328 / bins)} y={155 - count / histogram.max * 132} width={Math.max(1, 328 / bins - 0.6)} height={count / histogram.max * 132} />)}
              {histogram.positive.map((count, index) => <rect className="pos-bar" key={`p${index}`} x={42 + index * (328 / bins)} y={155 - count / histogram.max * 132} width={Math.max(1, 328 / bins - 0.6)} height={count / histogram.max * 132} />)}
              <line className="threshold-line" x1={42 + threshold * 328} y1="12" x2={42 + threshold * 328} y2="155" />
              <text className="threshold-label" x={42 + threshold * 328} y="10">{threshold.toFixed(2)}</text>
            </svg>
            <label className="pr-slider-line">Threshold ⓘ
              <input aria-label="Threshold" type="range" min="0.01" max="0.99" step="0.01" value={threshold} onInput={(event) => setThreshold(Number(event.currentTarget.value))} onChange={(event) => setThreshold(Number(event.target.value))} />
              <input aria-label="Threshold value" type="number" min="0.01" max="0.99" step="0.01" value={threshold} onChange={(event) => setThreshold(Math.max(.01, Math.min(.99, Number(event.target.value))))} />
            </label>
            <div className="confusion-mini"><b>At threshold {threshold.toFixed(2)}</b><div>
              <span className="tp">TP<strong>{formatCount(current.tp)}</strong></span>
              <span className="fp">FP<strong>{formatCount(current.fp)}</strong></span>
              <span className="fn">FN<strong>{formatCount(current.fn)}</strong></span>
              <span className="tn">TN<strong>{formatCount(current.tn)}</strong></span>
            </div></div>
            <p className="predicted">Positives Predicted: <b>{formatCount(current.predictedPositive)} ({(current.predictedPositive / dataset.actual.length * 100).toFixed(1)}%)</b> Actual Positives: <b>{formatCount(current.positiveCount)} ({(prevalence * 100).toFixed(1)}%)</b></p>
          </article>

          <article className={`panel pr-curve${panel("Train")}`}>
            <h2>Precision-Recall Curve <small>ⓘ</small></h2>
            <label><input type="checkbox" checked={showIso} onChange={(event) => setShowIso(event.target.checked)} /> Show iso-F1 lines</label>
            <svg viewBox="0 0 510 290" role="img" aria-label="Precision-recall curve">
              {[0, .25, .5, .75, 1].map((tick) => <g key={`grid-${tick}`}><line className="grid" x1={46 + tick * 430} y1="30" x2={46 + tick * 430} y2="250" /><line className="grid" x1="46" y1={250 - tick * 220} x2="476" y2={250 - tick * 220} /><text x={39 + tick * 430} y="269">{tick.toFixed(2)}</text><text x="8" y={254 - tick * 220}>{tick.toFixed(2)}</text></g>)}
              {showConfidence && <path className="confidence" d={`${confidencePath} Z`} />}
              {showBaseline && <line className="baseline" x1="46" y1={250 - prevalence * 220} x2="476" y2={250 - prevalence * 220} />}
              {showIso && [0.2, .4, .6, .8].map((f1) => {
                const points = Array.from({ length: 40 }, (_, index) => (index + 1) / 40).map((recall) => ({ recall, precision: f1 * recall / Math.max(.001, 2 * recall - f1) })).filter((point) => point.precision >= 0 && point.precision <= 1);
                return <path className="iso" key={f1} d={points.map((point, index) => `${index ? "L" : "M"}${46 + point.recall * 430},${250 - point.precision * 220}`).join(" ")} />;
              })}
              <path className="pr-line" d={curvePath} />
              {sampledCurve.filter((_, index) => index % 7 === 0).map((point, index) => <circle className="pr-dot" cx={46 + point.recall * 430} cy={250 - point.precision * 220} r="2.4" key={index} />)}
              {showPoint && <><line className="operating-guide" x1={46 + current.recall * 430} y1={250 - current.precision * 220} x2={46 + current.recall * 430} y2="250" /><circle className="operating" cx={46 + current.recall * 430} cy={250 - current.precision * 220} r="7" /></>}
              <text className="ap-label" x="57" y="220">Average Precision (AP)</text><text className="ap-value" x="57" y="243">{ap.toFixed(3)}</text>
              <text className="axis-label" x="247" y="287">Recall</text><text className="axis-label y" x="4" y="140">Precision</text>
            </svg>
            <div className="curve-legend"><span>━ PR Curve (AP = {ap.toFixed(3)})</span><span>● Operating Point (Threshold = {threshold.toFixed(2)})</span><button onClick={() => setMessage("Zoom reset")}>⟳ Reset Zoom</button></div>
          </article>

          <article className={`panel pr-operating${panel("Metrics")}`}>
            <h2>Operating Point (Threshold = {threshold.toFixed(2)}) <small>ⓘ</small></h2>
            <div className="metric-grid">
              <div><span>Precision</span><strong>{current.precision.toFixed(3)}</strong></div>
              <div><span>Recall</span><strong>{current.recall.toFixed(3)}</strong></div>
              <div><span>F1 Score</span><strong>{current.f1.toFixed(3)}</strong></div>
              <div><span>Specificity</span><strong>{(current.specificity * 100).toFixed(1)}%</strong></div>
              <div><span>False Positive Rate</span><strong>{(current.fpr * 100).toFixed(1)}%</strong></div>
              <div><span>False Negative Rate</span><strong>{(current.fnr * 100).toFixed(1)}%</strong></div>
            </div>
            <div className="pr-tip">☆ Lower the threshold to capture more positives (higher recall) at the cost of more false positives (lower precision). Increase it for the opposite trade-off.</div>
          </article>
        </section>

        <section className={`pr-lower-row${layout}`}>
          <article className={`panel imbalance${panel("Dataset")}`}><h2>Class Imbalance Context <small>ⓘ</small></h2><div className="donut" style={{ "--positive-share": `${prevalence * 360}deg` } as React.CSSProperties}><b>{(prevalence * 100).toFixed(1)}%</b></div><div className="imbalance-legend"><span className="positive">● {dataset.positiveName}</span><b>{formatCount(current.positiveCount)} ({(prevalence * 100).toFixed(1)}%)</b><span className="negative">● {dataset.negativeName}</span><b>{formatCount(current.negativeCount)} ({((1 - prevalence) * 100).toFixed(1)}%)</b></div><p>High class imbalance makes accuracy misleading. Precision-Recall Curve is the right tool.</p></article>
          <article className={`panel suggestions${panel("Transform", "Metrics")}`}><h2>Threshold Suggestions <small>ⓘ</small></h2>{[
            ["Max F1 Score", suggestions.maxF1, "blue"],
            ["High Recall (≥ 0.80)", suggestions.highRecall, "green"],
            ["High Precision (≥ 0.50)", suggestions.highPrecision, "amber"],
          ].map(([label, metric, color]) => { const item = metric as { threshold: number; precision: number; recall: number }; return <button key={label as string} onClick={() => setThreshold(Number(item.threshold.toFixed(2)))}><i className={color as string}>✓</i><span>{label as string}<small>Threshold: {item.threshold.toFixed(2)}</small></span><em>Precision: {item.precision.toFixed(3)} Recall: {item.recall.toFixed(3)}</em></button>; })}</article>
          <article className={`panel summary${panel("Train", "Metrics")}`}><h2>PR AUC Summary <small>ⓘ</small></h2><div><span>Average Precision (AP)<strong>{ap.toFixed(3)}</strong></span><span>Baseline (Prevalence)<strong>{prevalence.toFixed(3)}</strong></span></div><hr /><p>Model lift over baseline<strong>{(ap / Math.max(.0001, prevalence)).toFixed(2)}×</strong></p></article>
          <article className={`panel trend${panel("Train", "Metrics")}`}><h2>Threshold Impact Trend <small>ⓘ</small></h2><table><thead><tr><th>Threshold</th><th>Precision</th><th>Recall</th><th>F1 Score</th><th>Pos Pred %</th></tr></thead><tbody>{trends.map((row, index) => <tr className={index === 2 ? "active" : ""} key={`${row.threshold}-${index}`} onClick={() => setThreshold(row.threshold)}><td>{row.threshold.toFixed(2)}</td><td>{row.precision.toFixed(3)} <i style={{width:`${row.precision * 30}px`}} /></td><td>{row.recall.toFixed(3)} <i style={{width:`${row.recall * 30}px`}} /></td><td>{row.f1.toFixed(3)} <i style={{width:`${row.f1 * 30}px`}} /></td><td>{(row.predictedPositive / dataset.actual.length * 100).toFixed(1)}%</td></tr>)}</tbody></table></article>
        </section>
      </main>

      <aside className="pr-controls">
        <section className={`panel${panel("Dataset")}`}><h2>Dataset <small>ⓘ</small></h2><select aria-label="Dataset" value={customDataset ? "custom" : datasetIndex} onChange={(event) => event.target.value !== "custom" && changeDataset(Number(event.target.value))}>{customDataset && <option value="custom">{customDataset.name}</option>}{datasets.map((item, index) => <option value={index} key={item.name}>● {item.name}</option>)}</select><p>Binary classification • {prevalence < .1 ? "Highly imbalanced" : "Imbalanced"}<br /><b>{formatCount(dataset.actual.length)} rows • {dataset.featureCount} features • {(prevalence * 100).toFixed(1)}% positive</b></p><div><button onClick={() => changeDataset((datasetIndex + 1) % datasets.length)}>⇄ Switch Dataset</button><button onClick={() => uploadRef.current?.click()}>⇧ Upload Dataset</button><input hidden ref={uploadRef} type="file" accept=".csv" onChange={(event) => upload(event.target.files?.[0])} /></div><hr /><label>Positive Class<select aria-label="Positive Class" value={dataset.positiveName} onChange={() => setMessage("Positive class selected")}><option>{dataset.positiveName} (1)</option></select></label></section>
        <section className={`panel${panel("Transform", "Train", "Metrics")}`}><h2>Controls</h2><label>Threshold<div className="control-line"><input aria-label="Control Threshold" type="range" min="0.01" max="0.99" step="0.01" value={threshold} onInput={(event) => setThreshold(Number(event.currentTarget.value))} onChange={(event) => setThreshold(Number(event.target.value))} /><input aria-label="Control threshold value" type="number" min="0.01" max="0.99" step="0.01" value={threshold} onChange={(event) => setThreshold(Math.max(.01, Math.min(.99, Number(event.target.value))))} /></div></label><label>Smoothing (Bins) <small>ⓘ</small><select aria-label="Smoothing Bins" value={bins} onChange={(event) => setBins(Number(event.target.value))}>{[20,35,50,75].map((value) => <option key={value}>{value}</option>)}</select></label><label className="check"><input type="checkbox" checked={showBaseline} onChange={(event) => setShowBaseline(event.target.checked)} /> Show PR AUC Baseline (Prevalence)</label><p className="baseline-key">Baseline (No Skill): {prevalence.toFixed(3)} <span>– – –</span></p><hr /><b>Display Options</b><label className="check"><input type="checkbox" checked={showIso} onChange={(event) => setShowIso(event.target.checked)} /> Show iso-F1 lines <small>ⓘ</small></label><label className="check"><input type="checkbox" checked={showPoint} onChange={(event) => setShowPoint(event.target.checked)} /> Show operating point <small>ⓘ</small></label><label className="check"><input type="checkbox" checked={showConfidence} onChange={(event) => setShowConfidence(event.target.checked)} /> Show confidence bands <small>ⓘ</small></label></section>
        <Link className="advanced-link" reloadDocument to="?advanced=1">Open compact PR lab →</Link>
      </aside>

      <footer className="pr-footer">{message === "Ready" ? "Precision-Recall analysis helps you choose the right threshold for your problem and understand model performance under class imbalance." : message}</footer>
    </div>
  );
}
