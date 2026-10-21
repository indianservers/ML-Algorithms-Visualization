import reference from "./fixtures/time-series-arima-reference.json";
import { describe, it, expect, beforeAll } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { createRequire } from "node:module";
const ARIMA = createRequire(import.meta.url)("arima");
import {
  STUDIO_DATASETS,
  prepareDataset,
  uploadDataset,
  DEFAULT_POLICY,
} from "../src/features/time-series-studio/datasets";
import {
  DEFAULT_CONFIG,
  type NeuralKind,
} from "../src/features/time-series-studio/types";
import {
  classicalFit,
  splitSeries,
  detectCausal,
  alertIndexes,
  optimizeClassical,
} from "../src/features/time-series-studio/engine";
import {
  inspectCell,
  trainNeural,
  createSession,
} from "../src/features/time-series-studio/neural";
import { integratedWhiteNoise } from "../src/features/time-series-studio/integratedWhiteNoise";
import { forecastMetrics } from "../src/lib/timeSeries/forecastMetrics";
import {
  alphaScenarios,
  replayBenchmark,
} from "../src/features/time-series-studio/comparison";

describe("Complete comparison and replay evaluation", () => {
  it("evaluates each selected alpha independently on identical history", () => {
    const config = { ...DEFAULT_CONFIG, horizon: 2 };
    const rows = alphaScenarios([10, 20, 30], config, [0.1, 0.9, 0.1]);
    expect(rows.map((r) => r.name)).toEqual(["α = 0.1", "α = 0.9"]);
    expect(rows[0].result.forecast).toEqual([12.9, 12.9]);
    expect(rows[1].result.forecast).toEqual([28.9, 28.9]);
    expect(alphaScenarios([], config, [0.1])).toEqual([]);
  });
  it("excludes future injections and labels from the replay benchmark", () => {
    const score = replayBenchmark(
      5,
      [2, 8],
      [{ index: 8, type: "spike" }],
      4,
      [2, 8],
    );
    expect(score).toMatchObject({
      tp: 1,
      fp: 0,
      fn: 0,
      events: 0,
      labelled: 1,
      precision: 1,
      recall: 1,
    });
  });
  it("scores full shift regions and counts event detection only once", () => {
    const score = replayBenchmark(
      8,
      [1, 5, 6],
      [{ index: 4, type: "shift" }],
      4,
    );
    expect(score).toMatchObject({
      tp: 2,
      fp: 1,
      fn: 2,
      events: 1,
      detectedEvents: 1,
      labelled: 4,
      recall: 0.5,
    });
    expect(score.precision).toBeCloseTo(2 / 3);
  });
  it("excludes unchanged seasonal positions and represents undefined rates explicitly", () => {
    expect(
      replayBenchmark(10, [2, 3, 4, 6], [{ index: 2, type: "seasonal" }], 4),
    ).toMatchObject({ tp: 2, fp: 2, fn: 0, labelled: 2, detectedEvents: 1 });
    expect(replayBenchmark(0, [], [], 4)).toMatchObject({
      precision: null,
      recall: null,
      f1: null,
    });
  });
});

describe("Time Series production workspace correctness", () => {
  it("computes exact full-window MA and preserves causality", () => {
    const config = { ...DEFAULT_CONFIG, window: 3, horizon: 3 };
    const r = classicalFit("moving-average", [2, 4, 6, 8, 10], config);
    expect(r.fitted.slice(2)).toEqual([4, 6, 8]);
    expect(r.fitted[0]).toBeNaN();
    expect(r.forecast[0]).toBe(8);
    const changed = classicalFit(
      "moving-average",
      [2, 4, 6, 999, 1000],
      config,
    );
    expect(changed.fitted[2]).toBe(4);
  });
  it("labels leading smoothing while keeping its forecasts causal", () => {
    const r = classicalFit("moving-average", [2, 4, 6, 8, 10], {
      ...DEFAULT_CONFIG,
      window: 3,
      alignment: "leading",
    });
    expect(r.fitted[0]).toBe(4);
    expect(r.fitted[4]).toBeNaN();
    expect(r.forecast[0]).toBe(8);
  });
  it("matches manually computed SES updates and flat multi-step forecasts", () => {
    const r = classicalFit("exponential-smoothing", [10, 14, 18], {
      ...DEFAULT_CONFIG,
      alpha: 0.25,
      horizon: 3,
    });
    expect(r.components.Level).toEqual([10, 11, 12.75]);
    expect(r.fitted).toEqual([NaN, 10, 11]);
    expect(r.forecast).toEqual([12.75, 12.75, 12.75]);
    expect(r.lower[2]).toBeLessThan(r.lower[0]);
  });
  it("uses only training data during alpha optimization", () => {
    const train = [
      10, 12, 11, 14, 13, 15, 16, 15, 18, 19, 20, 21, 20, 22, 21, 24, 23, 25,
      26, 27,
    ];
    const optimum = optimizeClassical(
      "exponential-smoothing",
      train,
      DEFAULT_CONFIG,
    );
    expect(optimum.alpha).toBeGreaterThan(0);
    expect(optimum.alpha).toBeLessThanOrEqual(1);
    expect(train.at(-1)).toBe(27);
  });
  it("excludes SES initialization from residuals and interval noise estimation", () => {
    const r = classicalFit("exponential-smoothing", [10, 20, 30, 40, 50], {
      ...DEFAULT_CONFIG,
      initialization: "mean",
      window: 3,
      alpha: 0.5,
      horizon: 1,
    });
    expect(r.fitted.slice(0, 3).every(Number.isNaN)).toBe(true);
    expect(r.components.Residual.slice(0, 3).every(Number.isNaN)).toBe(true);
    const errors = r.components.Residual.slice(3);
    const expectedSigma = Math.sqrt(
      errors.reduce((sum, error) => sum + error ** 2, 0) / 2,
    );
    expect(r.upper[0] - r.forecast[0]).toBeCloseTo(1.96 * expectedSigma);
    expect(
      classicalFit("exponential-smoothing", [10, 20], {
        ...DEFAULT_CONFIG,
        initialization: "mean",
        window: 2,
      }).lower,
    ).toEqual([]);
  });
  it("requires two full HW cycles, rejects nonpositive multiplicative values and predicts a stable season", () => {
    expect(() =>
      classicalFit("holt-winters", [1, 2, 3, 4, 5], {
        ...DEFAULT_CONFIG,
        season: 4,
      }),
    ).toThrow(/two complete/);
    const data = Array.from({ length: 80 }, (_, i) => [10, 20, 30, 40][i % 4]);
    const r = classicalFit("holt-winters", data, {
      ...DEFAULT_CONFIG,
      season: 4,
      horizon: 4,
      alpha: 0.4,
      beta: 0.1,
      gamma: 0.3,
    });
    expect(forecastMetrics([10, 20, 30, 40], r.forecast).rmse).toBeLessThan(1);
    expect(() =>
      classicalFit(
        "holt-winters",
        data.map((v) => v - 20),
        { ...DEFAULT_CONFIG, season: 4, seasonalMode: "multiplicative" },
      ),
    ).toThrow(/positive/);
  });
  it("keeps chronological partitions disjoint and evaluates only supplied test pairs", () => {
    const split = splitSeries(
      Array.from({ length: 100 }, (_, i) => i),
      20,
    );
    expect(split.train.at(-1)).toBe(63);
    expect(split.validation[0]).toBe(64);
    expect(split.test[0]).toBe(80);
    expect(forecastMetrics([0, 2], [1, 2]).mape).toBeNull();
    expect(forecastMetrics([0, 2], [1, 2]).rmse).toBeCloseTo(Math.sqrt(0.5));
  });
  it("never fabricates historical observations or silently fills missing CO2 values", () => {
    const co2 = STUDIO_DATASETS.find((d) => d.id === "co2")!;
    expect(co2.synthetic).toBe(false);
    expect(co2.license).toMatch(/Public domain/);
    expect(() =>
      prepareDataset(co2, co2.target, co2.dateColumn, DEFAULT_POLICY),
    ).toThrow(/missing/);
    const repaired = prepareDataset(co2, co2.target, co2.dateColumn, {
      ...DEFAULT_POLICY,
      missing: "forward",
    });
    expect(repaired.missing).toBeGreaterThan(0);
    expect(co2.table.data.some((r) => r.co2 === null)).toBe(true);
  });
  it("requires explicit duplicate policy and preserves uploaded originals", () => {
    const rows = Array.from(
      { length: 15 },
      (_, i) => `2024-01-${String(i + 1).padStart(2, "0")},${i}`,
    );
    rows.push("2024-01-02,99");
    const ds = uploadDataset("test.csv", "date,value\n" + rows.join("\n"));
    expect(() => prepareDataset(ds, "value", "date", DEFAULT_POLICY)).toThrow(
      /duplicate/,
    );
    expect(
      prepareDataset(ds, "value", "date", {
        ...DEFAULT_POLICY,
        duplicates: "mean",
      }).points[1].value,
    ).toBe(50);
    expect(ds.table.data).toHaveLength(16);
  });
  it("rejects bad timestamps and blank numeric cells instead of treating them as zero", () => {
    const text =
      "date,value\n" +
      Array.from(
        { length: 15 },
        (_, i) =>
          `2024-01-${String(i + 1).padStart(2, "0")},${i === 4 ? "" : i}`,
      ).join("\n");
    const ds = uploadDataset("missing.csv", text);
    expect(() => prepareDataset(ds, "value", "date", DEFAULT_POLICY)).toThrow(
      /missing/,
    );
    expect(
      prepareDataset(ds, "value", "date", {
        ...DEFAULT_POLICY,
        missing: "forward",
      }).points[4].value,
    ).toBe(3);
  });
  for (const detector of [
    "zscore",
    "modified",
    "iqr",
    "ewma",
    "seasonal",
  ] as const)
    it(`detects injected spikes causally using ${detector}`, () => {
      const values = Array.from({ length: 60 }, (_, i) => 20 + Math.sin(i));
      values[40] = 200;
      const c = {
        ...DEFAULT_CONFIG,
        window: 24,
        season: 6,
        detector,
        threshold: 3,
      };
      const result = detectCausal(values, c);
      expect(result[40].anomaly).toBe(true);
      const after = detectCausal([...values.slice(0, 41), 9999, 9999], c);
      expect(after[40]).toEqual(result[40]);
      expect(
        alertIndexes(result, 5).every((v, i, a) => !i || v - a[i - 1] > 5),
      ).toBe(true);
    });
});

describe("Real recurrent models and exact state inspection", () => {
  beforeAll(async () => {
    await tf.setBackend("cpu");
    await tf.ready();
  });
  for (const kind of ["rnn", "lstm", "gru"] as NeuralKind[])
    it(`${kind}: inspector matches TensorFlow.js recurrent outputs`, async () => {
      const units = 3;
      const args = {
        units,
        inputShape: [4, 1],
        returnSequences: true,
        activation: "tanh" as const,
        recurrentActivation: "sigmoid" as const,
        kernelInitializer: tf.initializers.glorotUniform({ seed: 4 }),
        recurrentInitializer: tf.initializers.glorotUniform({ seed: 5 }),
      };
      const layer =
        kind === "rnn"
          ? tf.layers.simpleRNN(args)
          : kind === "lstm"
            ? tf.layers.lstm(args)
            : tf.layers.gru(args);
      const model = tf.sequential({ layers: [layer] });
      const input = tf.tensor3d([0.2, 0.4, -0.1, 0.8], [1, 4, 1]);
      const output = model.predict(input) as tf.Tensor;
      const expected = Array.from(await output.data());
      const weights = layer.getWeights();
      const frames = inspectCell(
        [0.2, 0.4, -0.1, 0.8],
        kind,
        units,
        "tanh",
        (await weights[0].array()) as number[][],
        (await weights[1].array()) as number[][],
        Array.from(await weights[2].data()),
      );
      const actual = frames.flatMap((f) => f.hidden);
      actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 5));
      input.dispose();
      output.dispose();
      model.dispose();
    });
  for (const kind of ["rnn", "lstm", "gru"] as NeuralKind[])
    it(`${kind}: real training, finite losses, shape, parameter count and save/reload parity`, async () => {
      const c = {
        ...DEFAULT_CONFIG,
        lookback: 4,
        units: 3,
        epochs: 2,
        horizon: 3,
        earlyStopping: false,
      };
      const values = Array.from({ length: 40 }, (_, i) => Math.sin(i / 3));
      const history: Array<number> = [];
      const { session, result } = await trainNeural(
        values,
        c,
        kind,
        (e) => history.push(e.loss),
        new AbortController().signal,
      );
      expect(history).toHaveLength(2);
      expect(history.every(Number.isFinite)).toBe(true);
      expect(result.forecast).toHaveLength(3);
      expect(result.forecast.every(Number.isFinite)).toBe(true);
      expect(session.parameters).toBe(
        kind === "rnn" ? 19 : kind === "lstm" ? 64 : 49,
      );
      expect(result.lower).toEqual([]);
      let artifacts: tf.io.ModelArtifacts | undefined;
      await session.model.save(
        tf.io.withSaveHandler(async (a) => {
          artifacts = a;
          return {
            modelArtifactsInfo: {
              dateSaved: new Date(),
              modelTopologyType: "JSON",
            },
          };
        }),
      );
      const model = await tf.loadLayersModel(tf.io.fromMemory(artifacts!));
      const loaded = await createSession(
        tf,
        model,
        c,
        kind,
        session.mean,
        session.scale,
        splitSeries(values, c.holdout).history,
      );
      const forecast = await loaded.predict(
        splitSeries(values, c.holdout).history,
        3,
      );
      forecast.forEach((v, i) => expect(v).toBeCloseTo(result.forecast[i], 6));
      loaded.dispose();
      session.dispose();
    }, 30000);
  it("supports cancellation and refuses lookback with no training windows", async () => {
    const signal = new AbortController();
    signal.abort();
    await expect(
      trainNeural(
        Array.from({ length: 30 }, (_, i) => i),
        { ...DEFAULT_CONFIG, lookback: 4, epochs: 3 },
        "gru",
        () => {},
        signal.signal,
      ),
    ).rejects.toThrow(/cancelled/);
    await expect(
      trainNeural(
        [1, 2, 3, 4, 5],
        { ...DEFAULT_CONFIG, lookback: 30 },
        "rnn",
        () => {},
        new AbortController().signal,
      ),
    ).rejects.toThrow(/Lookback/);
  });
});

describe("Trusted CTSA statistical fitting engine", () => {
  it("ARIMA(1,0,0) on a zero-AR fixture forecasts the sample mean with finite prediction variance", async () => {
    const model = new ARIMA({ p: 1, d: 0, q: 0, verbose: false });
    const values = Array.from(
      { length: 40 },
      (_, i) => 10 + [-1, 0, 1, 0][i % 4],
    );
    try {
      model.train(values);
      const [forecast, variance] = model.predict(4);
      forecast.forEach((v) => expect(v).toBeCloseTo(10, 3));
      expect(variance.every((v) => v >= 0 && Number.isFinite(v))).toBe(true);
    } finally {
      model.destroy();
    }
  });
});

it("integrated white-noise closed forms match constant, random walk, double integration, and seasonal random walk", () => {
  const c = {
    ...DEFAULT_CONFIG,
    p: 0,
    q: 0,
    P: 0,
    Q: 0,
    d: 0,
    D: 0,
    horizon: 3,
  };
  expect(
    integratedWhiteNoise([9, 10, 11, 10, 9, 10, 11, 10], c).forecast,
  ).toEqual([10, 10, 10]);
  const walk = integratedWhiteNoise([1, 2, 4, 3, 5, 6, 5, 7], { ...c, d: 1 });
  expect(walk.forecast).toEqual([7, 7, 7]);
  expect(walk.variance[2]).toBeCloseTo(walk.variance[0] * 3);
  expect(
    integratedWhiteNoise([1, 3, 6, 10, 15, 21, 28, 36], { ...c, d: 2 })
      .forecast,
  ).toEqual([44, 52, 60]);
  expect(
    integratedWhiteNoise([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {
      ...c,
      D: 1,
      season: 4,
    }).forecast,
  ).toEqual([9, 10, 11]);
});

it("CTSA ARIMA likelihood forecasts agree with trusted statsmodels reference fits", () => {
  for (const item of reference.cases) {
    const [p, d, q] = item.order;
    const model = new ARIMA({ p, d, q, verbose: false });
    try {
      model.train(reference.values);
      const [forecast, variance] = model.predict(4);
      forecast.forEach((v: number, i: number) =>
        expect(Math.abs(v - item.forecast[i])).toBeLessThan(0.005),
      );
      variance.forEach((v: number, i: number) =>
        expect(Math.abs(v - item.variance[i])).toBeLessThan(0.005),
      );
    } finally {
      model.destroy();
    }
  }
});
it("Holt-Winters bootstrap is deterministic, conditional, and ordered; custom initialization changes states", () => {
  const values = Array.from(
    { length: 100 },
    (_, i) =>
      100 + i * 0.1 + 10 * Math.sin((i * Math.PI) / 2) + Math.sin(i * 1.73),
  );
  const config = { ...DEFAULT_CONFIG, season: 4, horizon: 8 };
  const a = classicalFit("holt-winters", values, config),
    b = classicalFit("holt-winters", values, config);
  expect(a.lower).toHaveLength(8);
  expect(a.lower).toEqual(b.lower);
  expect(a.lower.every((v, i) => v <= a.upper[i])).toBe(true);
  const custom = classicalFit("holt-winters", values, {
    ...config,
    initialLevel: 80,
    initialTrend: 0,
    seasonalInit: "neutral",
  });
  expect(custom.components.Level[0]).not.toBe(a.components.Level[0]);
});
it("detects missing timestamps and requires explicit policies when regularizing gaps", () => {
  const data = STUDIO_DATASETS.find((d) => d.id === "missing-timestamps")!;
  const prepared = prepareDataset(data, "value", "date", DEFAULT_POLICY);
  expect(prepared.gaps).toBe(7);
  expect(prepared.regular).toBe(false);
  expect(() =>
    prepareDataset(data, "value", "date", {
      ...DEFAULT_POLICY,
      resample: "daily",
    }),
  ).toThrow(/missing/);
  const fixed = prepareDataset(data, "value", "date", {
    ...DEFAULT_POLICY,
    resample: "daily",
    missing: "forward",
  });
  expect(fixed.points).toHaveLength(40);
  expect(fixed.regular).toBe(true);
  expect(data.table.data).toHaveLength(33);
});
it("releases optimizer and model tensors after a completed training session", async () => {
  const values = Array.from({ length: 40 }, (_, i) => Math.sin(i / 3));
  const config = {
    ...DEFAULT_CONFIG,
    lookback: 4,
    units: 3,
    epochs: 1,
    horizon: 2,
  };
  const before = tf.memory().numTensors;
  const { session } = await trainNeural(
    values,
    config,
    "gru",
    () => {},
    new AbortController().signal,
  );
  session.dispose();
  expect(tf.memory().numTensors).toBe(before);
});
it("rejects impossible or ambiguous dates and boolean target cells", () => {
  const rows = Array.from(
    { length: 15 },
    (_, i) => `2024-01-${String(i + 1).padStart(2, "0")},${i}`,
  );
  const bad = uploadDataset(
    "bad-date.csv",
    "date,value\n" + ["2024-02-31,1", ...rows].join("\n"),
  );
  expect(() => prepareDataset(bad, "value", "date", DEFAULT_POLICY)).toThrow(
    /invalid timestamp/,
  );
  const ambiguous = uploadDataset(
    "ambiguous.csv",
    "date,value\n" + ["01/02/2024,1", ...rows].join("\n"),
  );
  expect(() =>
    prepareDataset(ambiguous, "value", "date", DEFAULT_POLICY),
  ).toThrow(/invalid timestamp/);
  const boolean = uploadDataset(
    "bool.csv",
    "date,value\n" + ["2024-03-01,true", ...rows].join("\n"),
  );
  expect(() =>
    prepareDataset(boolean, "value", "date", DEFAULT_POLICY),
  ).toThrow(/missing/);
});
it("connects layers, units, optimizer, loss, activation and scaling to a real training graph", async () => {
  const values = Array.from({ length: 40 }, (_, i) => 20 + Math.sin(i / 3));
  const c = {
    ...DEFAULT_CONFIG,
    lookback: 4,
    units: 4,
    layers: 2,
    epochs: 1,
    horizon: 2,
    optimizer: "rmsprop" as const,
    loss: "meanAbsoluteError" as const,
    activation: "relu" as const,
    scaling: "minmax" as const,
  };
  const before = tf.memory().numTensors;
  const { session, result } = await trainNeural(
    values,
    c,
    "gru",
    () => {},
    new AbortController().signal,
  );
  expect(session.model.layers).toHaveLength(3);
  expect(session.model.loss).toBe("meanAbsoluteError");
  expect(session.model.layers[0].getConfig().activation).toBe("relu");
  expect(session.parameters).toBe(185);
  expect(result.forecast).toHaveLength(2);
  session.dispose();
  expect(tf.memory().numTensors).toBe(before);
});
