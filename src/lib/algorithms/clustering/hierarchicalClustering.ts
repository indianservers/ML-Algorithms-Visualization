export type LinkageMethod = "single" | "complete" | "average" | "ward";
export type HierarchicalMetric = "euclidean" | "manhattan";
export interface HierarchicalMerge {
  step: number;
  left: number;
  right: number;
  id: number;
  distance: number;
  size: number;
  members: number[];
}
export interface HierarchicalModel {
  sampleCount: number;
  merges: HierarchicalMerge[];
  maxDistance: number;
}
type Cluster = { id: number; members: number[]; centroid: number[] };
const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
function distance(a: number[], b: number[], metric: HierarchicalMetric) {
  if (metric === "manhattan")
    return a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}
function centroid(X: number[][], members: number[]) {
  return X[0].map(
    (_, d) => members.reduce((s, i) => s + X[i][d], 0) / members.length,
  );
}
export function trainHierarchicalClustering(
  X: number[][],
  linkage: LinkageMethod = "ward",
  metric: HierarchicalMetric = "euclidean",
): HierarchicalModel {
  if (X.length < 2 || !X[0]?.length)
    throw new Error("Hierarchical clustering requires at least two samples.");
  if (X.length > 360)
    throw new Error(
      "Hierarchical clustering is capped at 360 samples in the browser lab because of O(n²) merge cost.",
    );
  if (linkage === "ward" && metric !== "euclidean")
    throw new Error("Ward linkage requires Euclidean distance.");
  let clusters: Cluster[] = X.map((row, i) => ({
    id: i,
    members: [i],
    centroid: [...row],
  }));
  const distances = new Map<string, number>();
  for (let i = 0; i < X.length; i++)
    for (let j = i + 1; j < X.length; j++) {
      const euclid = distance(X[i], X[j], metric);
      distances.set(
        key(i, j),
        linkage === "ward" ? 0.5 * euclid * euclid : euclid,
      );
    }
  const merges: HierarchicalMerge[] = [];
  let nextId = X.length;
  while (clusters.length > 1) {
    let bestA = 0,
      bestB = 1,
      best = Infinity;
    for (let i = 0; i < clusters.length; i++)
      for (let j = i + 1; j < clusters.length; j++) {
        const value =
          distances.get(key(clusters[i].id, clusters[j].id)) ?? Infinity;
        if (value < best) {
          best = value;
          bestA = i;
          bestB = j;
        }
      }
    const a = clusters[bestA],
      b = clusters[bestB],
      members = [...a.members, ...b.members],
      merged: Cluster = {
        id: nextId++,
        members,
        centroid: centroid(X, members),
      };
    merges.push({
      step: merges.length + 1,
      left: a.id,
      right: b.id,
      id: merged.id,
      distance: linkage === "ward" ? Math.sqrt(Math.max(0, 2 * best)) : best,
      size: members.length,
      members: [...members],
    });
    for (const other of clusters) {
      if (other === a || other === b) continue;
      const da = distances.get(key(a.id, other.id))!,
        db = distances.get(key(b.id, other.id))!;
      let value: number;
      if (linkage === "single") value = Math.min(da, db);
      else if (linkage === "complete") value = Math.max(da, db);
      else if (linkage === "average")
        value =
          (da * a.members.length + db * b.members.length) /
          (a.members.length + b.members.length);
      else {
        const dab = distances.get(key(a.id, b.id)) ?? 0;
        const na = a.members.length;
        const nb = b.members.length;
        const nc = other.members.length;
        value =
          ((na + nc) * da + (nb + nc) * db - nc * dab) / (na + nb + nc);
      }
      distances.set(key(merged.id, other.id), value);
    }
    clusters = clusters.filter((_, i) => i !== bestA && i !== bestB);
    clusters.push(merged);
  }
  return {
    sampleCount: X.length,
    merges,
    maxDistance: Math.max(...merges.map((m) => m.distance)),
  };
}
export function cutHierarchy(
  model: HierarchicalModel,
  height: number,
  maxClusters?: number,
) {
  let clusters = Array.from({ length: model.sampleCount }, (_, i) => ({
    id: i,
    members: [i],
  }));
  for (const merge of model.merges) {
    const heightReached = merge.distance > height;
    const capReached = !maxClusters || clusters.length <= maxClusters;
    if (heightReached && capReached) break;
    const left = clusters.find((c) => c.id === merge.left),
      right = clusters.find((c) => c.id === merge.right);
    if (!left || !right) continue;
    clusters = clusters.filter((c) => c !== left && c !== right);
    clusters.push({
      id: merge.id,
      members: [...left.members, ...right.members],
    });
  }
  const assignments = Array(model.sampleCount).fill(0);
  clusters.forEach((cluster, index) =>
    cluster.members.forEach((member) => (assignments[member] = index)),
  );
  return { clusters, assignments };
}
