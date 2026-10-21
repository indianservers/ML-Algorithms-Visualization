import ARIMA from "arima";
import type { LabConfig } from "./types";
import { integratedWhiteNoise } from "./integratedWhiteNoise";
self.onmessage = (
  event: MessageEvent<{ values: number[]; config: LabConfig }>,
) => {
  const start = performance.now();
  let model: InstanceType<typeof ARIMA> | undefined;
  try {
    const { values, config: c } = event.data;
    const analytic = c.p + c.q + c.P + c.Q === 0;
    if (!analytic)
      model = new ARIMA({
        p: c.p,
        d: c.d,
        q: c.q,
        P: c.P,
        D: c.D,
        Q: c.Q,
        s: c.season,
        method: 0,
        optimizer: 6,
        verbose: false,
      });
    if (model) model.train(values);
    const output = analytic ? integratedWhiteNoise(values, c) : null;
    const [forecast, variance] = output
      ? [output.forecast, output.variance]
      : model!.predict(c.horizon);
    if (
      !forecast.every(Number.isFinite) ||
      !variance.every((v) => Number.isFinite(v) && v >= 0)
    )
      throw new Error(
        "Fitting failed or produced invalid variance. Try lower orders or a stationary transformation.",
      );
    const z =
      c.confidence >= 0.99 ? 2.576 : c.confidence >= 0.95 ? 1.96 : 1.645;
    self.postMessage({
      result: {
        fitted: [],
        forecast,
        lower: forecast.map((v, i) => v - z * Math.sqrt(variance[i])),
        upper: forecast.map((v, i) => v + z * Math.sqrt(variance[i])),
        components: {},
        duration: performance.now() - start,
        note:
          (analytic
            ? "Exact integrated white-noise special case (zero drift after differencing). "
            : "CTSA ARIMA/SARIMA maximum-likelihood engine. ") +
          " Gaussian model-based forecast intervals. Fitted values, likelihood and convergence diagnostics are not exposed by this browser binding; they are unavailable, not estimated from a different model.",
      },
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    model?.destroy();
  }
};
