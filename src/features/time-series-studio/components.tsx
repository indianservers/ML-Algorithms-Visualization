import { useState, type ReactNode } from "react";
import { Upload, Database, ExternalLink } from "lucide-react";
import { ScientificChart } from "./ScientificChart";
import {
  STUDIO_DATASETS,
  inferFrequency,
  uploadDataset,
  csvCell,
  download,
  type StudioDataset,
  type DataPolicy,
} from "./datasets";
import { profileTimeSeries } from "../../lib/timeSeries/timeSeriesProfile";
import { fmt } from "./types";
export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`tsw-panel ${className}`}>
      <header>
        <h2>{title}</h2>
      </header>
      <div className="tsw-panel-body">{children}</div>
    </section>
  );
}
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="tsw-field">
      <label>
        <span>{label}</span>
        <input
          aria-label={`${label} value`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value !== "" && Number.isFinite(+e.target.value))
              onChange(Math.max(min, Math.min(max, +e.target.value)));
          }}
        />
      </label>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
      />
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="tsw-select">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="tsw-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function DatasetExplorer({
  dataset,
  uploads,
  onDataset,
  onUpload,
  target,
  onTarget,
  dateColumn,
  onDateColumn,
  policy,
  onPolicy,
  points,
  error,
}: {
  dataset: StudioDataset;
  uploads: StudioDataset[];
  onDataset: (id: string) => void;
  onUpload: (d: StudioDataset) => void;
  target: string;
  onTarget: (v: string) => void;
  dateColumn: string;
  onDateColumn: (v: string) => void;
  policy: DataPolicy;
  onPolicy: (p: DataPolicy) => void;
  points: Array<{ date: string; value: number }>;
  error: string;
}) {
  const [uploadError, setUploadError] = useState(""),
    [page, setPage] = useState(0);
  const profile = points.length
    ? profileTimeSeries(
        dataset.name,
        points,
        inferFrequency(points.map((p) => p.date)),
      )
    : null;
  const rawMissing = dataset.table.data.filter(
    (r) =>
      r[target] === null ||
      r[target] === "" ||
      typeof r[target] !== "number" ||
      !Number.isFinite(r[target]),
  ).length;
  return (
    <div className="tsw-dataset">
      <Panel title="Dataset Explorer">
        <div className="tsw-data-head">
          <Database size={30} />
          <div>
            <h3>{dataset.name}</h3>
            <p>{dataset.description}</p>
          </div>
        </div>
        <div className="tsw-form-grid">
          <Select
            label="Dataset"
            value={dataset.id}
            options={[...STUDIO_DATASETS, ...uploads].map((d) => ({
              value: d.id,
              label: d.name,
            }))}
            onChange={onDataset}
          />
          <Select
            label="Timestamp column"
            value={dateColumn}
            options={dataset.table.columns}
            onChange={onDateColumn}
          />
          <Select
            label="Target variable"
            value={target}
            options={dataset.table.columns.filter((c) => c !== dateColumn)}
            onChange={onTarget}
          />
          <label className="tsw-upload">
            <Upload size={18} /> Upload CSV
            <input
              aria-label="Upload CSV"
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 10 * 1024 * 1024)
                    throw new Error("CSV files must be smaller than 10 MB.");
                  onUpload(uploadDataset(file.name, await file.text()));
                  setUploadError("");
                  setPage(0);
                } catch (error) {
                  setUploadError(
                    String(error instanceof Error ? error.message : error),
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="tsw-notice">
          {dataset.synthetic
            ? "Synthetic educational data."
            : dataset.sourceUrl
              ? "Sourced historical observations."
              : "User-provided observations; provenance supplied by the user."}{" "}
          {dataset.source} · {dataset.license}{" "}
          {dataset.sourceUrl && (
            <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">
              Source <ExternalLink size={12} />
            </a>
          )}
        </div>
        <p className="tsw-muted">
          Original values remain immutable. Column mapping, duplicate handling,
          interpolation and resampling below create a derived series. CSV upload
          is supported; XLSX is unavailable in this application.
        </p>
        <div className="tsw-form-grid">
          <Select
            label="Missing observations"
            value={policy.missing}
            options={[
              { value: "reject", label: "Reject missing values" },
              {
                value: "linear",
                label: "Linear interpolation (retrospective)",
              },
              { value: "forward", label: "Forward fill (causal)" },
            ]}
            onChange={(v) =>
              onPolicy({ ...policy, missing: v as DataPolicy["missing"] })
            }
          />
          <Select
            label="Duplicate timestamps"
            value={policy.duplicates}
            options={[
              { value: "reject", label: "Reject duplicates" },
              { value: "keep-first", label: "Keep first" },
              { value: "keep-last", label: "Keep last" },
              { value: "mean", label: "Average duplicate values" },
            ]}
            onChange={(v) =>
              onPolicy({ ...policy, duplicates: v as DataPolicy["duplicates"] })
            }
          />
          <Select
            label="Resample (mean per bucket)"
            value={policy.resample}
            options={[
              "original",
              "daily",
              "weekly",
              "monthly",
              "quarterly",
              "yearly",
            ]}
            onChange={(v) =>
              onPolicy({ ...policy, resample: v as DataPolicy["resample"] })
            }
          />
        </div>
        {policy.missing === "linear" && (
          <p className="tsw-warning">
            Interpolation uses observations on both sides. Missing values
            spanning a split boundary must be repaired before upload to avoid
            evaluation leakage; forecasting is disabled while retrospective
            interpolation is selected.
          </p>
        )}
        {(error || uploadError) && (
          <p role="alert" className="tsw-error">
            {error || uploadError}
          </p>
        )}
        <div className="tsw-stat-grid">
          {[
            ["Original records", dataset.table.data.length],
            ["Usable records", points.length],
            ["Missing targets", rawMissing],
            ["Frequency", profile?.frequency ?? dataset.frequency],
            ["Mean", fmt(profile?.mean)],
            ["Std deviation", fmt(profile?.std)],
            ["Minimum", fmt(profile?.min)],
            ["Maximum", fmt(profile?.max)],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {profile && (
          <p className="tsw-muted">
            {profile.start.slice(0, 10)} → {profile.end.slice(0, 10)} · Trend:{" "}
            {profile.trendHint} · Seasonality: {profile.seasonalityHint}. These
            are exploratory heuristics, not formal tests.{" "}
            {profile.warnings.join(" ")}
          </p>
        )}
        <p>
          Suitability: use seasonal methods only with at least two complete
          training cycles. Neural networks need enough windows after lookback;
          small datasets are educational demonstrations, not evidence of
          generalization.
        </p>
        <button
          onClick={() =>
            download(
              "dataset.csv",
              [
                "date,value",
                ...points.map((p) => `${csvCell(p.date)},${p.value}`),
              ].join("\n"),
              "text/csv",
            )
          }
        >
          Export derived dataset CSV
        </button>
      </Panel>
      {points.length > 0 && (
        <ScientificChart
          title="Dataset preview"
          dates={points.map((p) => p.date)}
          lines={[
            {
              name: target,
              values: points.map((p) => p.value),
              color: "#2b9fff",
            },
          ]}
          group="ts-data-preview"
          unit={dataset.unit}
        />
      )}
      <Panel title="Original data · before transformations">
        <div className="tsw-table-wrap">
          <table>
            <thead>
              <tr>
                {dataset.table.columns.map((c) => (
                  <th key={c} data-i18n-protect>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.table.data
                .slice(page * 15, page * 15 + 15)
                .map((row, i) => (
                  <tr key={i}>
                    {dataset.table.columns.map((c) => (
                      <td key={c}>{String(row[c] ?? "Missing")}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="tsw-inline">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Previous rows
          </button>
          <span>
            Page {page + 1} of {Math.ceil(dataset.table.data.length / 15)}
          </span>
          <button
            disabled={(page + 1) * 15 >= dataset.table.data.length}
            onClick={() => setPage(page + 1)}
          >
            Next rows
          </button>
        </div>
      </Panel>
    </div>
  );
}
