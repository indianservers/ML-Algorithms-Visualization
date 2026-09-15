import { useState } from "react";
import { compareReductionMethods, type ReductionCompareRow } from "../../lib/dimensionality/dimensionalityCompare";

export function DimensionalityComparePanel({
  X,
  labels,
}: {
  X: number[][];
  labels?: number[];
}) {
  const [rows, setRows] = useState<ReductionCompareRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (X.length < 8) return null;
  return (
    <div className="overflow-x-auto text-xs">
      <p className="mb-2 text-gray-600 dark:text-gray-300">
        Same subsample and selected features. Axes are not comparable across methods. No universal ranking.
        kNN in embedding space is post-hoc evaluation using labels; labels did not enter unsupervised fits.
      </p>
      <button
        type="button"
        className="mb-2 rounded bg-slate-800 px-3 py-1 text-white"
        onClick={() => {
          try {
            setError(null);
            setRows(compareReductionMethods(X, labels, { maxSamples: 24 }));
          } catch (cause) {
            setRows(null);
            setError(cause instanceof Error ? cause.message : "Comparison failed");
          }
        }}
      >
        Run comparison on this matrix
      </button>
      {error && <p className="text-amber-700">{error}</p>}
      {rows && (
      <table className="w-full">
        <thead>
          <tr>
            <th className="p-2 text-left">Method</th>
            <th className="p-2">Dims</th>
            <th className="p-2">ms</th>
            <th className="p-2">Supervised</th>
            <th className="p-2">Transform new</th>
            <th className="p-2">Neighborhood @5</th>
            <th className="p-2">Distance preservation</th>
            <th className="p-2">Post-hoc kNN</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.method}>
              <td className="p-2">{row.method}</td>
              <td className="p-2 text-center">{row.dimensions}</td>
              <td className="p-2 text-center">{row.runtimeMs.toFixed(0)}</td>
              <td className="p-2 text-center">{row.supervised ? "yes" : "no"}</td>
              <td className="p-2 text-center">{row.transformNew}</td>
              <td className="p-2 text-center">{row.neighborhoodK.toFixed(2)}</td>
              <td className="p-2 text-center">{row.distancePreservation.toFixed(2)}</td>
              <td className="p-2 text-center">{row.posthocKnn == null ? "—" : row.posthocKnn.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}

export function DimensionalitySummary({
  items,
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-gray-200 p-2 dark:border-gray-700">
          <dt className="text-gray-500">{item.label}</dt>
          <dd className="font-mono font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
