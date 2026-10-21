import type { LabConfig } from "./types";
import type { ForecastResult } from "./engine";
export function fitStatistical(
  values: number[],
  config: LabConfig,
  signal?: AbortSignal,
): Promise<ForecastResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./arima.worker.ts", import.meta.url), {
      type: "module",
    });
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      finish();
      reject(new Error("Model fitting cancelled."));
    };
    const timer = setTimeout(() => {
      finish();
      reject(
        new Error(
          "ARIMA fitting exceeded 30 seconds. Reduce orders or the seasonal period.",
        ),
      );
    }, 30000);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    worker.onmessage = (e) => {
      finish();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = (e) => {
      finish();
      reject(new Error(e.message || "ARIMA worker failed."));
    };
    worker.postMessage({ values, config });
  });
}
