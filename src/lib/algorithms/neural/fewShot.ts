export type FewShotMetric = "euclidean" | "cosine";
export interface FewShotPoint {
  x: number;
  y: number;
  classIndex: number;
  support: boolean;
}
export interface FewShotEpisode {
  points: FewShotPoint[];
  prototypes: Array<{ x: number; y: number; classIndex: number }>;
  queries: FewShotPoint[];
  predictions: Array<{
    classIndex: number;
    distance: number;
    probability: number;
    confidence: number;
    distances: number[];
  }>;
}

const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  metric: FewShotMetric,
) => {
  if (metric === "euclidean") return Math.hypot(a.x - b.x, a.y - b.y);
  const dot = a.x * b.x + a.y * b.y,
    denom = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y) || 1;
  return 1 - dot / denom;
};
export function createFewShotEpisode(
  nWay: number,
  kShot: number,
  queryCount: number,
  metric: FewShotMetric,
  seed: number,
): FewShotEpisode {
  const points: FewShotPoint[] = [],
    prototypes: Array<{ x: number; y: number; classIndex: number }> = [],
    queries: FewShotPoint[] = [];
  for (let cls = 0; cls < nWay; cls++) {
    const angle = (cls * Math.PI * 2) / nWay + 0.18,
      centerX = Math.cos(angle) * 3.2,
      centerY = Math.sin(angle) * 2.5;
    const classPoints = Array.from({ length: kShot }, (_, i) => ({
      x: centerX + Math.sin(seed * 3 + cls * 17 + i * 7) * 0.55,
      y: centerY + Math.cos(seed * 5 + cls * 11 + i * 13) * 0.48,
      classIndex: cls,
      support: true,
    }));
    points.push(...classPoints);
    prototypes.push({
      x: classPoints.reduce((s, p) => s + p.x, 0) / kShot,
      y: classPoints.reduce((s, p) => s + p.y, 0) / kShot,
      classIndex: cls,
    });
  }
  for (let i = 0; i < queryCount; i++) {
    const cls = (seed + i * 3) % nWay,
      p = prototypes[cls],
      query = {
        x: p.x + Math.sin(seed * 19 + i * 5) * 0.72,
        y: p.y + Math.cos(seed * 23 + i * 9) * 0.68,
        classIndex: cls,
        support: false,
      };
    queries.push(query);
    points.push(query);
  }
  const predictions = queries.map((query) => {
    const distances = prototypes.map((p) => distance(query, p, metric)),
      best = Math.min(...distances),
      classIndex = distances.indexOf(best),
      scores = distances.map((d) => Math.exp(-d)),
      total = scores.reduce((s, v) => s + v, 0);
    return {
      classIndex,
      distance: best,
      probability: scores[classIndex] / total,
      confidence: scores[classIndex] / total,
      distances,
    };
  });
  return { points, prototypes, queries, predictions };
}
