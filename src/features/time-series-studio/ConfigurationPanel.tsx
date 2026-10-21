import { Play, RotateCcw } from "lucide-react";
import { Panel, Select, Slider, Toggle } from "./components";
import {
  LABS,
  isNeural,
  type LabKind,
  type LabConfig,
  type NeuralKind,
} from "./types";
import type { StudioDataset } from "./datasets";
type Props = {
  kind: LabKind;
  architecture: NeuralKind;
  setArchitecture: (a: NeuralKind) => void;
  config: LabConfig;
  update: <K extends keyof LabConfig>(key: K, value: LabConfig[K]) => void;
  dataset: StudioDataset;
  datasets: StudioDataset[];
  chooseDataset: (id: string) => void;
  openDataset: () => void;
  count: number;
  trainEnd: number;
  origin: number;
  reset: () => void;
  optimize: () => void;
  run: () => void;
  stop: () => void;
  busy: boolean;
  blocked: boolean;
  inject: () => void;
  injectType: string;
  setInjectType: (v: string) => void;
  resetStream: () => void;
  display: {
    raw: boolean;
    model: boolean;
    band: boolean;
    window: boolean;
    residual: boolean;
  };
  setDisplay: (
    key: "raw" | "model" | "band" | "window" | "residual",
    v: boolean,
  ) => void;
};
export function ConfigurationPanel(p: Props) {
  const { kind, config: c, update: u } = p;
  const neural = isNeural(kind),
    anomaly = kind === "anomaly-detection";
  return (
    <Panel title="Model configuration" className="tsw-config">
      <div className="tsw-inline">
        <strong>
          {neural ? p.architecture.toUpperCase() : LABS[kind].title}
        </strong>
        <button onClick={p.reset}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      <Select
        label="Dataset"
        value={p.dataset.id}
        options={p.datasets.map((d) => ({ value: d.id, label: d.name }))}
        onChange={p.chooseDataset}
      />
      <button className="tsw-text-button" onClick={p.openDataset}>
        Inspect data / upload CSV →
      </button>
      {!anomaly && (
        <>
          <Slider
            label="Holdout (%)"
            value={c.holdout}
            min={10}
            max={40}
            onChange={(v) => u("holdout", v)}
            hint="The final portion is not used to fit model parameters."
          />
          <Slider
            label="Forecast horizon"
            value={c.horizon}
            min={1}
            max={48}
            onChange={(v) => u("horizon", v)}
          />
        </>
      )}
      {(kind === "moving-average" || anomaly) && (
        <Slider
          label="Window size"
          value={c.window}
          min={3}
          max={Math.max(3, Math.min(168, p.count - 2))}
          onChange={(v) => u("window", v)}
        />
      )}
      {kind === "moving-average" && (
        <>
          <Select
            label="Alignment"
            value={c.alignment}
            options={["trailing", "centered", "leading"]}
            onChange={(v) => u("alignment", v as LabConfig["alignment"])}
          />
          <Slider
            label="Lag (comparison only)"
            value={c.lag}
            min={0}
            max={24}
            onChange={(v) => u("lag", v)}
          />
          <p
            className={c.alignment === "trailing" ? "tsw-muted" : "tsw-warning"}
          >
            {c.alignment === "trailing"
              ? "Trailing uses only current and past observations."
              : "Retrospective, noncausal smoother: future observations enter the displayed window. Holdout forecasts always use trailing windows."}
          </p>
        </>
      )}
      {(kind === "exponential-smoothing" ||
        kind === "holt-winters" ||
        (anomaly && c.detector === "ewma")) && (
        <Slider
          label="Alpha (level)"
          value={c.alpha}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => u("alpha", v)}
          hint={
            c.alpha > 0.6
              ? "High alpha: faster reaction, less memory."
              : "Lower alpha: smoother estimates, longer memory."
          }
        />
      )}
      {kind === "exponential-smoothing" && (
        <Select
          label="Initial level"
          value={c.initialization}
          options={[
            { value: "first", label: "First training observation" },
            { value: "mean", label: "First training-window mean" },
          ]}
          onChange={(v) =>
            u("initialization", v as LabConfig["initialization"])
          }
        />
      )}
      {kind === "holt-winters" && (
        <>
          <Toggle
            label="Custom initial level"
            value={c.initialLevel !== null}
            onChange={(v) => u("initialLevel", v ? 100 : null)}
          />
          {c.initialLevel !== null && (
            <Slider
              label="Initial level"
              value={c.initialLevel}
              min={c.seasonalMode === "multiplicative" ? 0.001 : -10000}
              max={10000}
              step={0.1}
              onChange={(v) => u("initialLevel", v)}
            />
          )}
          <Toggle
            label="Custom initial trend"
            value={c.initialTrend !== null}
            onChange={(v) => u("initialTrend", v ? 0 : null)}
          />
          {c.initialTrend !== null && (
            <Slider
              label="Initial trend"
              value={c.initialTrend}
              min={-1000}
              max={1000}
              step={0.1}
              onChange={(v) => u("initialTrend", v)}
            />
          )}
          <Select
            label="Seasonal initialization"
            value={c.seasonalInit}
            options={[
              {
                value: "cycle",
                label: "First training-cycle offsets / factors",
              },
              { value: "neutral", label: "Neutral offsets / factors" },
            ]}
            onChange={(v) => u("seasonalInit", v as LabConfig["seasonalInit"])}
          />
          <Select
            label="Seasonality type"
            value={c.seasonalMode}
            options={["additive", "multiplicative"]}
            onChange={(v) => u("seasonalMode", v as LabConfig["seasonalMode"])}
          />
          <Slider
            label="Beta (trend)"
            value={c.beta}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => u("beta", v)}
          />
          <Slider
            label="Gamma (seasonal)"
            value={c.gamma}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => u("gamma", v)}
          />
        </>
      )}
      {(kind === "holt-winters" ||
        kind === "arima-concept" ||
        (anomaly && c.detector === "seasonal")) && (
        <Slider
          label="Seasonal period"
          value={c.season}
          min={2}
          max={Math.max(2, Math.min(60, Math.floor(p.origin / 2)))}
          onChange={(v) => u("season", v)}
          hint="Period is measured in observations. Changing it changes the repeating pattern."
        />
      )}
      {(kind === "exponential-smoothing" ||
        kind === "holt-winters" ||
        kind === "arima-concept") && (
        <Select
          label="Prediction interval"
          value={String(c.confidence)}
          options={[
            { value: "0.9", label: "90%" },
            { value: "0.95", label: "95%" },
            { value: "0.99", label: "99%" },
          ]}
          onChange={(v) => u("confidence", Number(v))}
        />
      )}
      {(kind === "exponential-smoothing" || kind === "holt-winters") && (
        <button onClick={p.optimize} disabled={p.blocked}>
          Optimize on training data
        </button>
      )}
      {kind === "arima-concept" && (
        <>
          <div className="tsw-form-grid">
            {(["p", "d", "q", "P", "D", "Q"] as const).map((key) => (
              <Slider
                key={key}
                label={`${key} (${key === "d" || key === "D" ? "differences" : key.toLowerCase() === "p" ? "AR" : "MA"})`}
                value={c[key]}
                min={0}
                max={key === "d" || key === "D" ? 2 : 4}
                onChange={(v) => u(key, v)}
              />
            ))}
          </div>
          <p className="tsw-muted">
            CTSA likelihood fitting in a worker. ACF/PACF are guidance, not
            proof of stationarity or order.
          </p>
        </>
      )}
      {anomaly && (
        <>
          <Select
            label="Detection method"
            value={c.detector}
            options={[
              { value: "zscore", label: "Rolling Z-score" },
              { value: "modified", label: "Modified Z-score (median/MAD)" },
              { value: "iqr", label: "IQR fences" },
              { value: "ewma", label: "EWMA baseline" },
              { value: "seasonal", label: "Seasonal residual context" },
            ]}
            onChange={(v) => u("detector", v as LabConfig["detector"])}
          />
          <Slider
            label="Sensitivity threshold"
            value={c.threshold}
            min={0.5}
            max={8}
            step={0.1}
            onChange={(v) => u("threshold", v)}
            hint="Lower thresholds create more alerts. Larger thresholds can miss anomalies."
          />
          <Slider
            label="Alert cooldown (observations)"
            value={c.cooldown}
            min={0}
            max={24}
            onChange={(v) => u("cooldown", v)}
          />
          <Select
            label="Injection type"
            value={p.injectType}
            options={["spike", "drop", "shift", "seasonal"]}
            onChange={p.setInjectType}
          />
          <button onClick={p.inject}>Inject anomaly at selected step</button>
          <button onClick={p.resetStream}>Reset replay</button>
          <p className="tsw-notice">
            {p.dataset.synthetic
              ? "Synthetic simulation"
              : p.dataset.sourceUrl
                ? "Historical replay"
                : "User-provided series replay"}{" "}
            · no external live feed. A run of ≥3 flagged observations is a
            collective candidate.
          </p>
        </>
      )}
      {neural && (
        <>
          <Select
            label="Architecture"
            value={p.architecture}
            options={["rnn", "lstm", "gru"]}
            onChange={(v) => p.setArchitecture(v as NeuralKind)}
          />
          <Slider
            label="Lookback"
            value={c.lookback}
            min={3}
            max={Math.max(3, Math.min(168, p.trainEnd - 2))}
            onChange={(v) => u("lookback", v)}
          />
          <Slider
            label="Window stride"
            value={c.stride}
            min={1}
            max={12}
            onChange={(v) => u("stride", v)}
          />
          <div className="tsw-form-grid">
            <Slider
              label="Layers"
              value={c.layers}
              min={1}
              max={3}
              onChange={(v) => u("layers", v)}
            />
            <Slider
              label="Hidden units"
              value={c.units}
              min={2}
              max={64}
              onChange={(v) => u("units", v)}
            />
          </div>
          <Slider
            label="Dropout"
            value={c.dropout}
            min={0}
            max={0.6}
            step={0.05}
            onChange={(v) => u("dropout", v)}
          />
          <Select
            label="Activation"
            value={c.activation}
            options={["tanh", "relu"]}
            onChange={(v) => u("activation", v as LabConfig["activation"])}
          />
          <Select
            label="Optimizer"
            value={c.optimizer}
            options={["adam", "rmsprop", "sgd"]}
            onChange={(v) => u("optimizer", v as LabConfig["optimizer"])}
          />
          <Slider
            label="Learning rate"
            value={c.learningRate}
            min={0.0001}
            max={0.1}
            step={0.0001}
            onChange={(v) => u("learningRate", v)}
          />
          <Select
            label="Loss function"
            value={c.loss}
            options={["meanSquaredError", "meanAbsoluteError"]}
            onChange={(v) => u("loss", v as LabConfig["loss"])}
          />
          <Slider
            label="Batch size"
            value={c.batch}
            min={1}
            max={128}
            onChange={(v) => u("batch", v)}
          />
          <Slider
            label="Epochs"
            value={c.epochs}
            min={1}
            max={100}
            onChange={(v) => u("epochs", v)}
          />
          <Select
            label="Scaling"
            value={c.scaling}
            options={["standard", "minmax", "none"]}
            onChange={(v) => u("scaling", v as LabConfig["scaling"])}
          />
          <Toggle
            label="Early stopping (restore best validation weights)"
            value={c.earlyStopping}
            onChange={(v) => u("earlyStopping", v)}
          />
          {c.earlyStopping && (
            <Slider
              label="Patience"
              value={c.patience}
              min={1}
              max={15}
              onChange={(v) => u("patience", v)}
            />
          )}
          <Slider
            label="Random seed"
            value={c.seed}
            min={1}
            max={9999}
            onChange={(v) => u("seed", v)}
          />
          <small>
            Seeded initialization; GPU kernels and dropout can introduce runtime
            variation.
          </small>
        </>
      )}
      {(neural || kind === "arima-concept") && (
        <button
          className="tsw-primary"
          disabled={p.busy || p.blocked}
          onClick={p.run}
        >
          <Play size={16} />
          {p.busy ? "Working…" : neural ? "Train model" : "Run ARIMA model"}
        </button>
      )}
      {p.busy && <button onClick={p.stop}>Stop safely</button>}
      <div className="tsw-display">
        <strong>Display</strong>
        <Toggle
          label="Observed signal"
          value={p.display.raw}
          onChange={(v) => p.setDisplay("raw", v)}
        />
        <Toggle
          label="Model / baseline"
          value={p.display.model}
          onChange={(v) => p.setDisplay("model", v)}
        />
        <Toggle
          label="Prediction / threshold band"
          value={p.display.band}
          onChange={(v) => p.setDisplay("band", v)}
        />
        {kind === "moving-average" && (
          <Toggle
            label="Rolling window"
            value={p.display.window}
            onChange={(v) => p.setDisplay("window", v)}
          />
        )}
        <Toggle
          label="Residual panels"
          value={p.display.residual}
          onChange={(v) => p.setDisplay("residual", v)}
        />
      </div>
    </Panel>
  );
}
