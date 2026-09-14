export type MeanShiftKernel = "epanechnikov" | "gaussian" | "flat";

export interface MeanShiftResult {
  centers: number[][];
  assignments: number[];
  trajectories: number[][][];
  displacementHistory: number[];
  iterations: number;
  converged: boolean;
}

const distance = (a: number[], b: number[]) =>
  Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));

function kernelWeight(
  distanceValue: number,
  bandwidth: number,
  kernel: MeanShiftKernel,
) {
  const ratio = distanceValue / bandwidth;
  if (kernel === "gaussian") return Math.exp(-0.5 * ratio * ratio);
  if (ratio > 1) return 0;
  return kernel === "flat" ? 1 : Math.max(0, 1 - ratio * ratio);
}

export function meanShift(
  X: number[][],
  bandwidth = 1.25,
  maxIterations = 40,
  tolerance = 0.001,
  kernel: MeanShiftKernel = "epanechnikov",
): MeanShiftResult {
  if (!X.length || !X[0]?.length)
    throw new Error("Mean Shift requires a non-empty matrix.");
  if (!(bandwidth > 0) || maxIterations < 1 || !(tolerance > 0))
    throw new Error(
      "Mean Shift requires positive bandwidth, iterations, and tolerance.",
    );
  let shifted = X.map((row) => [...row]);
  const trajectories = X.map((row) => [[...row]]);
  const displacementHistory: number[] = [];
  let converged = false;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxDisplacement = 0;
    const next = shifted.map((point) => {
      const weights = X.map((sample) =>
        kernelWeight(distance(point, sample), bandwidth, kernel),
      );
      const total = weights.reduce((sum, value) => sum + value, 0) || 1;
      const target = X[0].map(
        (_, dimension) =>
          X.reduce(
            (sum, sample, index) => sum + weights[index] * sample[dimension],
            0,
          ) / total,
      );
      const moved = target.map(
        (value, dimension) =>
          point[dimension] + (value - point[dimension]) * 0.5,
      );
      maxDisplacement = Math.max(maxDisplacement, distance(point, moved));
      return moved;
    });
    shifted = next;
    shifted.forEach((point, index) => trajectories[index].push([...point]));
    displacementHistory.push(maxDisplacement);
    if (maxDisplacement <= tolerance) {
      converged = true;
      break;
    }
  }
  const centers: number[][] = [];
  const assignments = shifted.map((point) => {
    let best = centers.findIndex(
      (center) => distance(center, point) < bandwidth * 0.45,
    );
    if (best < 0) {
      centers.push([...point]);
      best = centers.length - 1;
    }
    return best;
  });
  centers.forEach((center, cluster) => {
    const members = shifted.filter(
      (_, index) => assignments[index] === cluster,
    );
    center.forEach((_, dimension) => {
      center[dimension] =
        members.reduce((sum, point) => sum + point[dimension], 0) /
        members.length;
    });
  });
  return {
    centers,
    assignments,
    trajectories,
    displacementHistory,
    iterations: displacementHistory.length,
    converged,
  };
}
