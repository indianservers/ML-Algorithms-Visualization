import type { TimeSeriesProfile } from "./timeSeriesProfile";

export const TIME_SERIES_ALGORITHMS = [
  {
    route: "/ml/time-series/moving-average",
    label: "Moving Average",
    needs: "short-or-noisy",
  },
  {
    route: "/ml/time-series/exponential-smoothing",
    label: "Exponential Smoothing",
    needs: "short-or-noisy",
  },
  {
    route: "/ml/time-series/holt-winters",
    label: "Holt-Winters",
    needs: "seasonal",
  },
  { route: "/ml/time-series/arima-concept", label: "ARIMA", needs: "trend" },
  {
    route: "/ml/time-series/anomaly-detection",
    label: "Anomaly Detection",
    needs: "anomaly",
  },
  {
    route: "/ml/time-series/rnn-forecasting",
    label: "RNN Forecasting",
    needs: "neural",
  },
  {
    route: "/ml/time-series/lstm-forecasting",
    label: "LSTM Forecasting",
    needs: "neural",
  },
  {
    route: "/ml/time-series/gru-forecasting",
    label: "GRU Forecasting",
    needs: "neural",
  },
] as const;

export function recommendTimeSeriesAlgorithms(profile: TimeSeriesProfile) {
  const short = profile.observations < 36;
  const neuralLimited = profile.observations < 48;
  const irregular = profile.frequency === "unknown" || profile.missingTimestamps > 0;
  return TIME_SERIES_ALGORITHMS.map((algorithm) => {
    let rank: "Highly recommended" | "Recommended" | "Limited" = "Recommended";
    const why: string[] = [];
    if (algorithm.needs === "seasonal") {
      if (profile.seasonalityHint === "likely") {
        rank = "Highly recommended";
        why.push(
          `Seasonality looks likely (dominant lag ${profile.dominantLag ?? "?"}).`,
        );
      } else {
        rank = "Recommended";
        why.push("Use when a repeating cycle is expected, even if ACF is weak.");
      }
      if (profile.trendHint === "yes") why.push("Trend is present; Holt-Winters can track level and slope.");
    }
    if (algorithm.needs === "trend" && profile.trendHint === "yes") {
      rank = "Recommended";
      why.push("Non-stationary trend series often need differencing (d ≥ 1).");
    }
    if (algorithm.needs === "short-or-noisy") {
      rank = short ? "Highly recommended" : "Recommended";
      why.push(
        short
          ? `Only ${profile.observations} observations; smoothing methods are more stable than deep nets.`
          : "Useful baseline smoother / local mean.",
      );
    }
    if (algorithm.needs === "neural") {
      if (neuralLimited) {
        rank = "Limited";
        why.push(
          `Only ${profile.observations} observations. Recurrent nets need enough windows after lookback.`,
        );
      } else {
        rank = profile.seasonalityHint === "likely" ? "Recommended" : "Recommended";
        why.push("Can learn nonlinear lag structure if the series is long enough.");
      }
    }
    if (algorithm.needs === "anomaly") {
      rank = "Recommended";
      why.push("Use rolling z-score / residual methods; one detector does not catch every anomaly type.");
    }
    if (irregular) {
      why.push("Irregular or missing timestamps: resample before treating the series as evenly spaced.");
    }
    if (!profile.sorted) {
      why.push("Sort chronologically before training. Unsorted timestamps are not used silently.");
    }
    return { ...algorithm, rank, why };
  });
}
