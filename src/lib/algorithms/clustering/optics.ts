export type OpticsMetric = "euclidean" | "manhattan";

export interface OpticsResult {
  ordering: number[];
  reachability: number[];
  coreDistances: number[];
  labels: number[];
  core: boolean[];
  clusterCount: number;
  noiseCount: number;
}

const distance = (a: number[], b: number[], metric: OpticsMetric) =>
  metric === "manhattan"
    ? a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0)
    : Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0));

class MinHeap {
  private values: Array<{ index: number; priority: number }> = [];
  push(value: { index: number; priority: number }) {
    this.values.push(value);
    let i = this.values.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.values[parent].priority <= value.priority) break;
      this.values[i] = this.values[parent];
      i = parent;
    }
    this.values[i] = value;
  }
  pop() {
    const first = this.values[0],
      last = this.values.pop();
    if (!this.values.length || !last) return first;
    let i = 0;
    while (true) {
      const left = i * 2 + 1,
        right = left + 1;
      if (left >= this.values.length) break;
      const child =
        right < this.values.length &&
        this.values[right].priority < this.values[left].priority
          ? right
          : left;
      if (this.values[child].priority >= last.priority) break;
      this.values[i] = this.values[child];
      i = child;
    }
    this.values[i] = last;
    return first;
  }
  get length() {
    return this.values.length;
  }
}

export function optics(
  X: number[][],
  minPts = 15,
  maxDistance = Infinity,
  epsilon = 0.62,
  metric: OpticsMetric = "euclidean",
): OpticsResult {
  const n = X.length;
  if (!n) throw new Error("OPTICS requires at least one sample.");
  if (n > 800)
    throw new Error(
      "OPTICS is capped at 800 samples in the browser lab because of the all-pairs neighbor search.",
    );
  if (minPts < 2 || minPts > n)
    throw new Error("minPts must be between 2 and the sample count.");
  const distances = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1)
    for (let j = i + 1; j < n; j += 1)
      distances[i][j] = distances[j][i] = distance(X[i], X[j], metric);
  const neighbors = distances.map((row, i) =>
    row
      .map((d, index) => ({ index, d }))
      .filter((item) => item.index !== i && item.d <= maxDistance)
      .sort((a, b) => a.d - b.d),
  );
  const coreDistances = neighbors.map((list) =>
    list.length >= minPts - 1 ? list[minPts - 2].d : Infinity,
  );
  const processed = Array(n).fill(false),
    reachByIndex = Array(n).fill(Infinity),
    ordering: number[] = [];
  const update = (point: number, heap: MinHeap) => {
    if (!Number.isFinite(coreDistances[point])) return;
    for (const neighbor of neighbors[point]) {
      if (processed[neighbor.index]) continue;
      const next = Math.max(coreDistances[point], neighbor.d);
      if (next < reachByIndex[neighbor.index]) {
        reachByIndex[neighbor.index] = next;
        heap.push({ index: neighbor.index, priority: next });
      }
    }
  };
  for (let start = 0; start < n; start += 1) {
    if (processed[start]) continue;
    processed[start] = true;
    ordering.push(start);
    const heap = new MinHeap();
    update(start, heap);
    while (heap.length) {
      const next = heap.pop();
      if (
        !next ||
        processed[next.index] ||
        next.priority !== reachByIndex[next.index]
      )
        continue;
      processed[next.index] = true;
      ordering.push(next.index);
      update(next.index, heap);
    }
  }
  const labels = Array(n).fill(-1);
  let cluster = -1;
  for (const index of ordering) {
    if (reachByIndex[index] > epsilon) {
      if (coreDistances[index] <= epsilon) {
        cluster += 1;
        labels[index] = cluster;
      }
    } else if (cluster >= 0) labels[index] = cluster;
  }
  return {
    ordering,
    reachability: ordering.map((index) => reachByIndex[index]),
    coreDistances,
    labels,
    core: coreDistances.map((value) => value <= epsilon),
    clusterCount: cluster + 1,
    noiseCount: labels.filter((label) => label < 0).length,
  };
}
