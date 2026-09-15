import type { LoadedAlgorithmDataset } from "../../data/algorithmDatasets";
import { persistAlgorithmDataset } from "../timeSeries/useActiveTimeSeries";

export function matrixToLoadedDataset(options: {
  id: string;
  name: string;
  history: string;
  vocabulary: string[];
  matrix: number[][];
  labels?: string[];
  sendRoute?: string;
}): LoadedAlgorithmDataset {
  const columns = [
    "sample_id",
    ...options.vocabulary.slice(0, 80).map((_, i) => options.vocabulary[i]),
    ...(options.labels ? ["target"] : []),
  ];
  const data = options.matrix.map((row, i) => {
    const record: Record<string, unknown> = { sample_id: i };
    options.vocabulary.slice(0, 80).forEach((term, j) => {
      record[term] = row[j] ?? 0;
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
