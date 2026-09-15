import { useEffect, useState } from "react";
import type { LoadedAlgorithmDataset } from "../../data/algorithmDatasets";

const KEY = "mlSuite.activeAlgorithmDatasets";

export function matrixFromLoaded(dataset: LoadedAlgorithmDataset) {
  const numeric = dataset.columns.filter((column) => {
    if (column === dataset.target) return false;
    return dataset.data.every((row) => {
      const value = row[column];
      return value === null || value === undefined || value === "" || Number.isFinite(Number(value));
    });
  });
  const X = dataset.data.map((row) => numeric.map((column) => Number(row[column])));
  const labels = dataset.target
    ? dataset.data.map((row) => {
        const raw = row[dataset.target!];
        const asNumber = Number(raw);
        return Number.isFinite(asNumber) ? asNumber : String(raw);
      })
    : undefined;
  const classIndex =
    labels?.every((value) => typeof value === "number")
      ? (labels as number[])
      : labels
        ? (() => {
            const levels = [...new Set(labels.map(String))];
            return labels.map((value) => levels.indexOf(String(value)));
          })()
        : undefined;
  return {
    name: dataset.name,
    X,
    featureNames: numeric,
    y: classIndex,
    ignored: dataset.columns.filter((column) => !numeric.includes(column)),
    target: dataset.target,
  };
}

export function useActiveDimensionality(route: string) {
  const [handoff, setHandoff] = useState<ReturnType<typeof matrixFromLoaded> | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const current = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
          string,
          LoadedAlgorithmDataset
        >;
        const dataset = current[route];
        if (!dataset?.data?.length) return;
        const parsed = matrixFromLoaded(dataset);
        if (parsed.X.length >= 3 && parsed.featureNames.length >= 1) setHandoff(parsed);
      } catch {
        /* ignore */
      }
    };
    read();
    window.addEventListener("ml:algorithm-dataset-loaded", read);
    return () => window.removeEventListener("ml:algorithm-dataset-loaded", read);
  }, [route]);

  return handoff;
}
