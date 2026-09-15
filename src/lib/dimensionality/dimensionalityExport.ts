import type { LoadedAlgorithmDataset } from "../../data/algorithmDatasets";
import { persistAlgorithmDataset } from "../timeSeries/useActiveTimeSeries";

export function embeddingToLoadedDataset(options: {
  id: string;
  name: string;
  prefix: string;
  embedding: number[][];
  labels?: Array<string | number>;
  sampleIds?: Array<string | number>;
  history: string;
  sendRoute?: string;
}): LoadedAlgorithmDataset {
  const columns = [
    "sample_id",
    ...options.embedding[0].map((_, i) => `${options.prefix}${i + 1}`),
    ...(options.labels ? ["target"] : []),
  ];
  const data = options.embedding.map((row, i) => {
    const record: Record<string, unknown> = { sample_id: options.sampleIds?.[i] ?? i };
    row.forEach((value, j) => {
      record[`${options.prefix}${j + 1}`] = Number(value.toFixed(8));
    });
    if (options.labels) record.target = options.labels[i];
    return record;
  });
  const dataset: LoadedAlgorithmDataset = {
    id: options.id,
    name: options.name,
    description: options.history,
    type: options.labels ? "classification" : "clustering",
    columns,
    data,
    target: options.labels ? "target" : undefined,
    kind: "synthetic",
  };
  if (options.sendRoute) persistAlgorithmDataset(options.sendRoute, dataset);
  return dataset;
}

export function downloadEmbeddingCsv(filename: string, dataset: LoadedAlgorithmDataset) {
  const lines = [
    dataset.columns.join(","),
    ...dataset.data.map((row) => dataset.columns.map((column) => String(row[column] ?? "")).join(",")),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
