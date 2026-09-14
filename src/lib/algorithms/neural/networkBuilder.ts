export type NetworkLayer =
  | { id: string; type: "input"; shape: [number, number, number] }
  | {
      id: string;
      type: "conv";
      filters: number;
      kernel: number;
      stride: number;
      padding: "same" | "valid";
      activation: string;
      bias: boolean;
    }
  | { id: string; type: "batchnorm" }
  | { id: string; type: "pool"; size: number; stride: number }
  | { id: string; type: "globalavg" }
  | { id: string; type: "dropout"; rate: number }
  | {
      id: string;
      type: "dense";
      units: number;
      activation: string;
      bias: boolean;
    };
export interface NetworkLayerResult {
  layer: NetworkLayer;
  input: number[];
  output: number[];
  parameters: number;
  valid: boolean;
}
export function evaluateNetwork(layers: NetworkLayer[]): NetworkLayerResult[] {
  const results: NetworkLayerResult[] = [];
  let shape: number[] = [];
  for (const layer of layers) {
    const input = [...shape];
    let output: number[],
      parameters = 0,
      valid = true;
    if (layer.type === "input") output = [...layer.shape];
    else if (layer.type === "conv") {
      valid = shape.length === 3;
      const [h = 0, w = 0, c = 0] = shape;
      output =
        layer.padding === "same"
          ? [
              Math.ceil(h / layer.stride),
              Math.ceil(w / layer.stride),
              layer.filters,
            ]
          : [
              Math.floor((h - layer.kernel) / layer.stride) + 1,
              Math.floor((w - layer.kernel) / layer.stride) + 1,
              layer.filters,
            ];
      parameters =
        layer.kernel * layer.kernel * c * layer.filters +
        (layer.bias ? layer.filters : 0);
    } else if (layer.type === "batchnorm") {
      valid = shape.length === 3;
      output = [...shape];
      parameters = (shape.at(-1) ?? 0) * 4;
    } else if (layer.type === "pool") {
      valid = shape.length === 3;
      output = [
        Math.floor(((shape[0] ?? 0) - layer.size) / layer.stride) + 1,
        Math.floor(((shape[1] ?? 0) - layer.size) / layer.stride) + 1,
        shape[2] ?? 0,
      ];
    } else if (layer.type === "globalavg") {
      valid = shape.length === 3;
      output = [shape[2] ?? 0];
    } else if (layer.type === "dropout") output = [...shape];
    else {
      valid = shape.length === 1;
      const inputs = shape.reduce((a, b) => a * b, 1);
      output = [layer.units];
      parameters = inputs * layer.units + (layer.bias ? layer.units : 0);
    }
    valid =
      valid && output.every((value) => Number.isFinite(value) && value > 0);
    shape = output;
    results.push({ layer, input, output, parameters, valid });
  }
  return results;
}
