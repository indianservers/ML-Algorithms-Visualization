export interface NeighborhoodQuality {
  trustworthiness: number;
  continuity: number;
}

const squaredDistance = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0);

function neighborRanks(space: number[][]): number[][] {
  return space.map((point, i) => {
    const ordered = space
      .map((other, j) => ({ j, distance: i === j ? Infinity : squaredDistance(point, other) }))
      .sort((a, b) => a.distance - b.distance || a.j - b.j);
    const ranks = Array(space.length).fill(0) as number[];
    ordered.forEach((item, rank) => {
      if (item.j !== i) ranks[item.j] = rank + 1;
    });
    return ranks;
  });
}

function rankPenalty(referenceRanks: number[][], candidateRanks: number[][], k: number) {
  let penalty = 0;
  for (let i = 0; i < referenceRanks.length; i += 1) {
    for (let j = 0; j < referenceRanks.length; j += 1) {
      if (i !== j && candidateRanks[i][j] <= k && referenceRanks[i][j] > k)
        penalty += referenceRanks[i][j] - k;
    }
  }
  const n = referenceRanks.length;
  const denominator = n * k * (2 * n - 3 * k - 1);
  return denominator > 0 ? Math.max(0, Math.min(1, 1 - (2 * penalty) / denominator)) : 1;
}

/** Standard rank-based trustworthiness and continuity from manifold learning. */
export function neighborhoodQuality(
  highDimensional: number[][],
  lowDimensional: number[][],
  requestedNeighbors = 10,
): NeighborhoodQuality {
  if (highDimensional.length !== lowDimensional.length || highDimensional.length < 2)
    throw new Error("Neighborhood quality requires aligned spaces with at least two samples");
  const n = highDimensional.length;
  const k = Math.max(1, Math.min(Math.floor(requestedNeighbors), Math.floor((n - 1) / 2)));
  const highRanks = neighborRanks(highDimensional);
  const lowRanks = neighborRanks(lowDimensional);
  return {
    trustworthiness: rankPenalty(highRanks, lowRanks, k),
    continuity: rankPenalty(lowRanks, highRanks, k),
  };
}
