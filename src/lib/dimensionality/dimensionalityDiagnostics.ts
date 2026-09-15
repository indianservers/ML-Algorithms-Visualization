import { neighborhoodPreservation } from "./dimensionalityPrep";

export function componentOrthogonality(components: number[][]) {
  const off = [] as number[];
  for (let i = 0; i < components.length; i += 1) {
    const ni = Math.sqrt(components[i].reduce((s, v) => s + v * v, 0)) || 1;
    for (let j = i + 1; j < components.length; j += 1) {
      const nj = Math.sqrt(components[j].reduce((s, v) => s + v * v, 0)) || 1;
      off.push(
        Math.abs(components[i].reduce((s, v, k) => s + v * components[j][k], 0) / (ni * nj)),
      );
    }
  }
  return off.length ? Math.max(...off) : 0;
}

export function sameDirectionUpToSign(a: number[], b: number[], tol = 0.05) {
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1;
  const cosine = Math.abs(a.reduce((s, v, i) => s + v * b[i], 0) / (na * nb));
  return cosine >= 1 - tol;
}

export function kernelIsSymmetric(K: number[][], tol = 1e-9) {
  for (let i = 0; i < K.length; i += 1)
    for (let j = i + 1; j < K.length; j += 1)
      if (Math.abs(K[i][j] - K[j][i]) > tol) return false;
  return true;
}

export function kernelCenteredMeans(Kc: number[][]) {
  const n = Kc.length;
  const row = Kc.map((rowValues) => rowValues.reduce((s, v) => s + v, 0) / n);
  const col = Kc[0].map((_, j) => Kc.reduce((s, rowValues) => s + rowValues[j], 0) / n);
  return {
    maxAbsRowMean: Math.max(...row.map(Math.abs)),
    maxAbsColMean: Math.max(...col.map(Math.abs)),
  };
}

export function distancePreservation(high: number[][], low: number[][]) {
  const n = high.length;
  if (n < 3) return 0;
  const pairs: Array<[number, number]> = [];
  const step = Math.max(1, Math.floor(n / 25));
  for (let i = 0; i < n; i += step) {
    for (let j = i + 1; j < n; j += step) {
      const dh = high[i].reduce((s, v, k) => s + (v - high[j][k]) ** 2, 0);
      const dl = low[i].reduce((s, v, k) => s + (v - low[j][k]) ** 2, 0);
      pairs.push([Math.sqrt(dh), Math.sqrt(dl)]);
    }
  }
  const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  let cov = 0;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of pairs) {
    cov += (x - mx) * (y - my);
    sx += (x - mx) ** 2;
    sy += (y - my) ** 2;
  }
  return cov / Math.max(1e-12, Math.sqrt(sx * sy));
}

export function posthocKnnAccuracy(embedding: number[][], labels: number[], k = 5) {
  if (embedding.length !== labels.length || embedding.length < 3) return null;
  const neighbors = Math.max(1, Math.min(k, embedding.length - 1));
  let correct = 0;
  for (let i = 0; i < embedding.length; i += 1) {
    const ranked = embedding
      .map((other, j) => ({
        j,
        d: i === j ? Infinity : other.reduce((s, v, dim) => s + (v - embedding[i][dim]) ** 2, 0),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, neighbors);
    const votes = new Map<number, number>();
    ranked.forEach((item) => votes.set(labels[item.j], (votes.get(labels[item.j]) ?? 0) + 1));
    let best = labels[i];
    let bestCount = -1;
    votes.forEach((count, label) => {
      if (count > bestCount) {
        bestCount = count;
        best = label;
      }
    });
    if (best === labels[i]) correct += 1;
  }
  return correct / embedding.length;
}

export function neighborhoodAtK(high: number[][], low: number[][], k = 10) {
  return neighborhoodPreservation(high, low, k);
}

export function alignedIds(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}
