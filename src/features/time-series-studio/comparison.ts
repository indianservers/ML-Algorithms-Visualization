import { classicalFit } from "./engine";
import type { LabConfig } from "./types";

export function alphaScenarios(
  history: number[],
  config: LabConfig,
  choices: number[],
) {
  if (!history.length) return [];
  return [...new Set(choices)].map((alpha) => ({
    name: `α = ${alpha}`,
    result: classicalFit("exponential-smoothing", history, {
      ...config,
      alpha,
    }),
  }));
}

export type InjectedEvent = { index: number; type: string };
/** Scores only observations already replayed; alert suppression is applied by the caller. */
export function replayBenchmark(
  length: number,
  alerts: number[],
  events: InjectedEvent[],
  period: number,
  nativeLabels: number[] = [],
) {
  const affected = (event: InjectedEvent, i: number) =>
    i >= event.index &&
    (event.type === "shift" ||
      (event.type === "seasonal"
        ? i < event.index + period &&
          Math.abs(Math.sin(((i - event.index + 1) * Math.PI) / 2)) > 1e-9
        : i === event.index));
  const truth = new Set(nativeLabels.filter((i) => i >= 0 && i < length));
  for (let i = 0; i < length; i++)
    if (events.some((event) => affected(event, i))) truth.add(i);
  const predicted = new Set(alerts.filter((i) => i >= 0 && i < length));
  const tp = [...predicted].filter((i) => truth.has(i)).length;
  const fp = predicted.size - tp,
    fn = truth.size - tp;
  const precision = predicted.size ? tp / predicted.size : null;
  const recall = truth.size ? tp / truth.size : null;
  const visibleEvents = events.filter((event) => event.index < length);
  return {
    tp,
    fp,
    fn,
    precision,
    recall,
    f1:
      precision !== null && recall !== null
        ? precision + recall
          ? (2 * precision * recall) / (precision + recall)
          : 0
        : null,
    labelled: truth.size,
    events: visibleEvents.length,
    detectedEvents: visibleEvents.filter((event) =>
      [...predicted].some((i) => affected(event, i)),
    ).length,
  };
}
