import { useEffect, useState } from "react";
import type { LoadedAlgorithmDataset } from "../../data/algorithmDatasets";

const KEY = "mlSuite.activeAlgorithmDatasets";

export function seriesFromLoaded(dataset: LoadedAlgorithmDataset) {
  return dataset.data
    .map((row) => ({
      date: String(row.date ?? row.time ?? row.period ?? ""),
      value: Number(
        row.value ??
          row.sales ??
          row.demand ??
          row.orders ??
          row.target ??
          row.passengers ??
          0,
      ),
    }))
    .filter((point) => Number.isFinite(point.value));
}

export function persistAlgorithmDataset(
  route: string,
  dataset: LoadedAlgorithmDataset,
) {
  if (typeof localStorage === "undefined") return;
  const current = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
    string,
    LoadedAlgorithmDataset
  >;
  current[route] = dataset;
  localStorage.setItem(KEY, JSON.stringify(current));
  window.dispatchEvent(
    new CustomEvent("ml:algorithm-dataset-loaded", { detail: { route, dataset } }),
  );
}

export function readLoadedDataset(route: string): LoadedAlgorithmDataset | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const current = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
      string,
      LoadedAlgorithmDataset
    >;
    return current[route] ?? null;
  } catch {
    return null;
  }
}

export function useActiveLoadedDataset(route: string) {
  const [dataset, setDataset] = useState<LoadedAlgorithmDataset | null>(() =>
    readLoadedDataset(route),
  );

  useEffect(() => {
    const read = () => setDataset(readLoadedDataset(route));
    read();
    window.addEventListener("ml:algorithm-dataset-loaded", read);
    return () => window.removeEventListener("ml:algorithm-dataset-loaded", read);
  }, [route]);

  return dataset;
}

export function useActiveTimeSeries(route: string) {
  const [handoff, setHandoff] = useState<{
    name: string;
    points: Array<{ date: string; value: number }>;
  } | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const current = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<
          string,
          LoadedAlgorithmDataset
        >;
        const dataset = current[route];
        if (!dataset?.data?.length) return;
        const points = seriesFromLoaded(dataset);
        if (points.length >= 8) setHandoff({ name: dataset.name, points });
      } catch {
        /* ignore corrupt storage */
      }
    };
    read();
    window.addEventListener("ml:algorithm-dataset-loaded", read);
    return () => window.removeEventListener("ml:algorithm-dataset-loaded", read);
  }, [route]);

  return handoff;
}
