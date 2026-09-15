import { useEffect, useMemo, useRef, useState } from "react";
import { dimensionalityLibraryDatasets, nlpLibraryDatasets, timeSeriesLibraryDatasets } from "../../data/algorithmDatasets";
import { getAlgorithmDatasetSuggestions } from "../../data/algorithmDatasets";
import { profileTimeSeries } from "../../lib/timeSeries/timeSeriesProfile";
import { recommendTimeSeriesAlgorithms } from "../../lib/timeSeries/timeSeriesRecommend";
import { recommendDimensionalityAlgorithms } from "../../lib/dimensionality/dimensionalityRecommend";
import { profileTextDataset, textsFromTable } from "../../lib/nlp/nlpDatasets";
import { recommendNlpAlgorithms } from "../../lib/nlp/nlpRecommend";
import { persistAlgorithmDataset } from "../../lib/timeSeries/useActiveTimeSeries";
import {
  fillMissingDaily,
  resampleSeries,
  resolveDuplicateTimestamps,
  sortChronologically,
} from "../../lib/timeSeries/timeSeriesPrep";
import { getAllAlgorithms } from "../../data/implementationStatus";
import {
  allSampleDatasets,
  type Dataset,
} from "../../data/sampleDatasets";
import {
  parseCSV,
  parseJSONDataset,
  toCSV,
} from "../../lib/preprocessing/datasetIO";
import { saveDataset } from "../../stores/experimentStore";

type LibraryTab = "Browse" | "Preview" | "Profile" | "Versions";
type LibraryShelf = "library" | "collections" | "favorites" | "sources";
type DatasetVersion = {
  id: string;
  label: string;
  savedAt: number;
  columns: string[];
  data: Record<string, unknown>[];
};

const COLLECTION_KEY = "mlSuite.datasetCollections";
const FAVORITE_KEY = "mlSuite.datasetFavorites";
const UPLOAD_KEY = "mlSuite.uploadedDatasets";
const VERSION_KEY = "mlSuite.datasetVersions";
const datasetNameAliases: Record<string, string> = {
  "Customer Churn": "customer-churn",
  "Customer Churn Dataset": "customer-churn",
  "Heart Disease Dataset": "medical-risk",
  "Titanic Survival Dataset": "loan",
  "House Prices Dataset": "housing",
  "Iris Dataset": "iris",
  "Fraud Detection": "fraud-transactions",
  "Market Basket": "retail-basket",
  "Medical Imaging": "medical-risk",
  "Text Analytics": "sentiment",
};

const datasetTaskLabels: Record<Dataset["type"], string> = {
  regression: "Regression",
  classification: "Classification",
  clustering: "Clustering",
  timeSeries: "Time Series",
  nlp: "NLP",
  recommendation: "Recommendation",
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function inferUploadedType(columns: string[]): Dataset["type"] {
  const joined = columns.join(" ").toLowerCase();
  if (/text|review|message|email|sentiment/.test(joined)) return "nlp";
  if (/date|time|week|hour|month/.test(joined)) return "timeSeries";
  if (/user|item|rating/.test(joined)) return "recommendation";
  if (/label|class|species|churn|approved|spam/.test(joined))
    return "classification";
  return "regression";
}

function cloneDatasetRecord(dataset: Dataset): Dataset {
  return {
    ...dataset,
    columns: [...dataset.columns],
    data: dataset.data.map((row) => ({ ...row })),
  };
}

function columnType(value: unknown) {
  if (typeof value === "number")
    return Number.isInteger(value) ? "int64" : "float64";
  if (typeof value === "boolean") return "bool";
  return "object";
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number")
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

function datasetProfile(dataset: Dataset) {
  const totalCells = Math.max(dataset.data.length * dataset.columns.length, 1);
  const typeCounts = { numeric: 0, categorical: 0, boolean: 0 };
  const missingByColumn = dataset.columns.map((column) => {
    const values = dataset.data.map((row) => row[column]);
    const sample = values.find(
      (value) => value !== null && value !== undefined && value !== "",
    );
    if (typeof sample === "number") typeCounts.numeric += 1;
    else if (typeof sample === "boolean") typeCounts.boolean += 1;
    else typeCounts.categorical += 1;
    const missing = values.filter(
      (value) => value === null || value === undefined || value === "",
    ).length;
    return { column, missing };
  });
  const missingTotal = missingByColumn.reduce(
    (sum, item) => sum + item.missing,
    0,
  );
  const target =
    dataset.type === "clustering" || dataset.type === "recommendation"
      ? undefined
      : dataset.columns.at(-1);
  const classCounts = new Map<string, number>();
  if (target && dataset.type === "classification") {
    dataset.data.forEach((row) => {
      const key = String(row[target] ?? "unknown");
      classCounts.set(key, (classCounts.get(key) ?? 0) + 1);
    });
  }
  const classes = [...classCounts.entries()].sort((a, b) => b[1] - a[1]);
  const majority = classes[0]?.[1] ?? 0;
  const minority = classes[1]?.[1] ?? 0;
  return {
    typeCounts,
    missingByColumn: missingByColumn
      .filter((item) => item.missing > 0)
      .sort((a, b) => b.missing - a.missing),
    missingTotal,
    missingPct: ((missingTotal / totalCells) * 100).toFixed(1),
    target,
    classes,
    imbalance: minority > 0 ? `${(majority / minority).toFixed(2)}:1` : "n/a",
    sizeKb: Math.max(
      1,
      Math.round(JSON.stringify(dataset.data).length / 1024),
    ),
  };
}

function PreviewTable({
  dataset,
  columns,
  rows,
  target,
}: {
  dataset: Dataset;
  columns: string[];
  rows: Record<string, unknown>[];
  target?: string;
}) {
  return (
    <div
      className="table"
      style={{
        ["--preview-cols" as string]: `repeat(${Math.max(columns.length, 1)}, minmax(72px, 1fr))`,
      }}
    >
      <header>
        {columns.map((column) => (
          <b key={column}>
            {column}
            <small>{columnType(dataset.data[0]?.[column])}</small>
          </b>
        ))}
      </header>
      {rows.map((row, i) => (
        <p key={i}>
          {columns.map((column) => {
            const value = formatCell(row[column]);
            const isPositiveClass =
              column === target && /yes|churn|spam|fraud|1/i.test(value);
            return (
              <span className={isPositiveClass ? "danger" : ""} key={column}>
                {value}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export default function DatasetLibrary({
  act,
  command,
  onCommandHandled,
  headerSearch,
  onShelfChange,
}: {
  act: (x: string) => void;
  command?: string | null;
  onCommandHandled?: () => void;
  headerSearch?: string;
  onShelfChange?: (label: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(allSampleDatasets[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<"All" | Dataset["type"]>("All");
  const [tab, setTab] = useState<LibraryTab>("Browse");
  const [shelf, setShelf] = useState<LibraryShelf>("library");
  const [uploads, setUploads] = useState<Dataset[]>(() =>
    readJson<Dataset[]>(UPLOAD_KEY, []),
  );
  const [collections, setCollections] = useState<string[]>(() =>
    readJson<string[]>(COLLECTION_KEY, []),
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readJson<string[]>(FAVORITE_KEY, []),
  );
  const [versions, setVersions] = useState<Record<string, DatasetVersion[]>>(
    () => readJson(VERSION_KEY, {}),
  );
  const [importUrl, setImportUrl] = useState("");
  const [importText, setImportText] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(
    () => [...allSampleDatasets, ...timeSeriesLibraryDatasets, ...dimensionalityLibraryDatasets, ...nlpLibraryDatasets, ...uploads],
    [uploads],
  );

  const setShelfAndNotify = (next: LibraryShelf) => {
    setShelf(next);
    onShelfChange?.(
      next === "collections"
        ? "My Collections"
        : next === "favorites"
          ? "Favorites"
          : next === "sources"
            ? "Data Sources"
            : "Dataset Library",
    );
  };

  const persistUploads = (next: Dataset[]) => {
    setUploads(next);
    writeJson(UPLOAD_KEY, next);
  };

  const persistVersions = (next: Record<string, DatasetVersion[]>) => {
    setVersions(next);
    writeJson(VERSION_KEY, next);
  };

  const addVersion = (dataset: Dataset, label: string) => {
    const entry: DatasetVersion = {
      id: `${dataset.id}-${Date.now()}`,
      label,
      savedAt: Date.now(),
      columns: [...dataset.columns],
      data: dataset.data.map((row) => ({ ...row })),
    };
    persistVersions({
      ...versions,
      [dataset.id]: [entry, ...(versions[dataset.id] ?? [])].slice(0, 12),
    });
  };

  const ingestParsed = (
    name: string,
    parsed: { columns: string[]; data: Record<string, unknown>[] },
    source: string,
  ) => {
    if (!parsed.columns.length) {
      act("No columns found in the imported file");
      return;
    }
    const dataset: Dataset = {
      id: `upload-${Date.now()}`,
      name,
      description: `Imported from ${source}`,
      type: inferUploadedType(parsed.columns),
      columns: parsed.columns,
      data: parsed.data,
    };
    persistUploads([dataset, ...uploads]);
    addVersion(dataset, "Imported v1");
    setSelectedId(dataset.id);
    setShelfAndNotify("library");
    setTab("Preview");
    act(`Loaded ${dataset.name}`);
  };

  const parseFileText = (filename: string, text: string) => {
    const parsed = filename.toLowerCase().endsWith(".json")
      ? parseJSONDataset(text)
      : parseCSV(text);
    ingestParsed(filename.replace(/\.[^.]+$/, ""), parsed, filename);
  };

  const openSelected = async (dataset: Dataset, target?: string) => {
    await saveDataset({
      id: dataset.id,
      name: dataset.name,
      columns: dataset.columns,
      data: dataset.data,
      savedAt: Date.now(),
      description: dataset.description,
      target,
      taskType: dataset.type,
    });
    window.open("/ml/lab/dataset-manager", "_blank", "noopener,noreferrer");
    act(`Opened ${dataset.name} in Dataset Manager`);
  };

  const handleCommand = (raw: string) => {
    if (raw === "Browse" || raw === "Preview" || raw === "Profile" || raw === "Versions") {
      setTab(raw);
      if (raw === "Versions") setTab("Versions");
      return;
    }
    if (raw === "Dataset Library") {
      setShelfAndNotify("library");
      setTab("Browse");
      return;
    }
    if (raw === "My Collections") {
      setShelfAndNotify("collections");
      setTab("Browse");
      return;
    }
    if (raw === "Favorites") {
      setShelfAndNotify("favorites");
      setTab("Browse");
      return;
    }
    if (raw === "Data Sources" || raw === "Import from Source") {
      setShelfAndNotify("sources");
      setTab("Browse");
      return;
    }
    if (raw === "Upload Dataset") {
      uploadRef.current?.click();
      return;
    }
    if (raw === "Manage Storage") {
      setShelfAndNotify("sources");
      act(
        `${catalog.length} datasets in library · ${collections.length} in collections · ${favorites.length} favorites`,
      );
      return;
    }
    if (raw === "Open Dataset") {
      const dataset =
        catalog.find((item) => item.id === selectedId) ?? catalog[0];
      if (dataset) void openSelected(dataset, datasetProfile(dataset).target);
      return;
    }
    if (raw === "Add to Collection") {
      const id = selectedId || catalog[0]?.id;
      if (!id) return;
      const next = collections.includes(id)
        ? collections.filter((item) => item !== id)
        : [...collections, id];
      setCollections(next);
      writeJson(COLLECTION_KEY, next);
      act(
        collections.includes(id)
          ? "Removed from collection"
          : "Added to collection",
      );
      return;
    }
    if (raw === "Download Parquet") {
      const dataset =
        catalog.find((item) => item.id === selectedId) ?? catalog[0];
      if (!dataset) return;
      downloadFile(
        `${dataset.id}.json`,
        JSON.stringify(
          { name: dataset.name, columns: dataset.columns, rows: dataset.data },
          null,
          2,
        ),
        "application/json",
      );
      act(`Downloaded ${dataset.name} as JSON`);
      return;
    }
    if (raw === "New Project") {
      const dataset: Dataset = {
        id: `project-${Date.now()}`,
        name: "New Project Dataset",
        description: "Blank project created from the Dataset Library.",
        type: "regression",
        columns: ["feature", "value"],
        data: [
          { feature: "example", value: 1 },
          { feature: "sample", value: 2 },
        ],
      };
      persistUploads([dataset, ...uploads]);
      addVersion(dataset, "Created v1");
      setSelectedId(dataset.id);
      setShelfAndNotify("library");
      setTab("Preview");
      act("Created New Project Dataset");
      return;
    }
    const aliasId = datasetNameAliases[raw];
    const match =
      catalog.find((item) => item.id === aliasId) ??
      catalog.find((item) => item.name.toLowerCase() === raw.toLowerCase()) ??
      catalog.find((item) =>
        item.name.toLowerCase().includes(raw.toLowerCase()),
      );
    if (match) {
      setSelectedId(match.id);
      setShelfAndNotify("library");
      setTab("Preview");
      act(`Selected ${match.name}`);
    }
  };

  useEffect(() => {
    if (!command) return;
    handleCommand(command);
    onCommandHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  const filtered = useMemo(() => {
    const search = `${query} ${headerSearch ?? ""}`.trim().toLowerCase();
    return catalog.filter((dataset) => {
      const onShelf =
        shelf === "collections"
          ? collections.includes(dataset.id)
          : shelf === "favorites"
            ? favorites.includes(dataset.id)
            : true;
      const matchesTask = taskFilter === "All" || dataset.type === taskFilter;
      const matchesSearch =
        !search ||
        dataset.name.toLowerCase().includes(search) ||
        dataset.description.toLowerCase().includes(search) ||
        dataset.columns.some((column) => column.toLowerCase().includes(search));
      return onShelf && matchesTask && matchesSearch;
    });
  }, [catalog, collections, favorites, headerSearch, query, shelf, taskFilter]);

  const selected =
    filtered.find((dataset) => dataset.id === selectedId) ??
    catalog.find((dataset) => dataset.id === selectedId) ??
    filtered[0] ??
    catalog[0];
  const profile = selected ? datasetProfile(selected) : null;
  const numericPct = selected
    ? ((profile?.typeCounts.numeric ?? 0) / selected.columns.length) * 100
    : 0;
  const compatible = useMemo(() => {
    if (!selected) return [];
    if (selected.type === "timeSeries") {
      return getAllAlgorithms().filter((algorithm) =>
        algorithm.route.includes("/time-series/"),
      );
    }
    return getAllAlgorithms()
      .filter((algorithm) =>
        getAlgorithmDatasetSuggestions(algorithm.route, algorithm.category).some(
          (item) => item.id === selected.id,
        ),
      )
      .slice(0, 8);
  }, [selected]);
  const selectedVersions = selected
    ? (versions[selected.id] ?? [
        {
          id: `${selected.id}-original`,
          label: "Original sample",
          savedAt: Date.now(),
          columns: selected.columns,
          data: selected.data,
        },
      ])
    : [];

  if (!selected || !profile) return null;
  const tsPoints = selected.data.map((row) => ({
    date: String(row.date ?? row.time ?? row.period ?? ""),
    value: Number(row.value ?? row.sales ?? row.demand ?? row.orders ?? 0),
  })).filter((point) => Number.isFinite(point.value));
  const tsProfile =
    selected.type === "timeSeries"
      ? profileTimeSeries(selected.name, tsPoints, "unknown")
      : null;
  const sendToAlgorithm = (route: string) => {
    persistAlgorithmDataset(route, {
      id: selected.id,
      name: selected.name,
      description: selected.description,
      type: selected.type,
      columns: selected.columns,
      data: selected.data,
      target: route.includes("time-series") ? "value" : profile.target,
      kind: "sample",
    });
  };
  const textRows = textsFromTable(selected.columns, selected.data, profile.target);
  const nlpProfile = textRows.length ? profileTextDataset(textRows) : null;
  const isAudioTable = selected.columns.includes("clip_id") || selected.id === "j-audio-tones";
  const applyTsPoints = (
    points: Array<{ date: string; value: number }>,
    label: string,
  ) => {
    const next: Dataset = {
      ...selected,
      id: `${selected.id}-${Date.now()}`,
      name: `${selected.name} (${label})`,
      columns: ["date", "value"],
      data: points.map((point) => ({ date: point.date, value: point.value })),
      type: "timeSeries",
    };
    persistUploads([next, ...uploads]);
    setSelectedId(next.id);
    act(label);
  };
  const colCount = selected.columns.length;
  const typeShare = (count: number) =>
    `${count} (${((count / colCount) * 100).toFixed(1)}%)`;
  const inCollection = collections.includes(selected.id);
  const isFavorite = favorites.includes(selected.id);
  const previewLimit = tab === "Preview" ? 25 : 5;
  const previewColumns =
    tab === "Preview" ? selected.columns : selected.columns.slice(0, 8);
  const previewRows = selected.data.slice(0, previewLimit);

  const toggleCollection = () => {
    const next = inCollection
      ? collections.filter((id) => id !== selected.id)
      : [...collections, selected.id];
    setCollections(next);
    writeJson(COLLECTION_KEY, next);
    act(
      inCollection
        ? `Removed ${selected.name} from collection`
        : `Added ${selected.name} to collection`,
    );
  };

  const toggleFavorite = () => {
    const next = isFavorite
      ? favorites.filter((id) => id !== selected.id)
      : [...favorites, selected.id];
    setFavorites(next);
    writeJson(FAVORITE_KEY, next);
    act(
      isFavorite
        ? `Removed ${selected.name} from favorites`
        : `Starred ${selected.name}`,
    );
  };

  const snapshotVersion = () => {
    addVersion(selected, `Snapshot v${(versions[selected.id]?.length ?? 0) + 1}`);
    setTab("Versions");
    act(`Saved a new version of ${selected.name}`);
  };

  const restoreVersion = (version: DatasetVersion) => {
    const restored = cloneDatasetRecord({
      ...selected,
      columns: version.columns,
      data: version.data,
    });
    if (uploads.some((item) => item.id === selected.id)) {
      persistUploads(
        uploads.map((item) => (item.id === selected.id ? restored : item)),
      );
    }
    act(`Restored ${version.label}`);
    setTab("Preview");
  };

  const importFromUrl = async () => {
    if (!importUrl.trim()) {
      act("Enter a CSV or JSON URL first");
      return;
    }
    try {
      const response = await fetch(importUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      parseFileText(importUrl.split("/").pop() || "imported.csv", text);
    } catch (error) {
      act(
        error instanceof Error
          ? `Import failed: ${error.message}. Paste the file below instead.`
          : "Import failed. Paste the file below instead.",
      );
    }
  };

  const importFromPaste = () => {
    if (!importText.trim()) {
      act("Paste CSV or JSON first");
      return;
    }
    try {
      parseFileText(
        importText.trim().startsWith("{") || importText.trim().startsWith("[")
          ? "pasted.json"
          : "pasted.csv",
        importText,
      );
      setImportText("");
    } catch (error) {
      act(error instanceof Error ? error.message : "Could not parse pasted data");
    }
  };

  return (
    <>
      <nav className="pp-tabs">
        {(["Browse", "Preview", "Profile", "Versions"] as const).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
        <span className="pp-dataset-actions">
          <button onClick={() => handleCommand("Import from Source")}>
            ＋ Import from Source
          </button>
          <button onClick={() => uploadRef.current?.click()}>
            ↑ Upload Dataset
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".csv,.json,.tsv,.txt"
            aria-label="Upload dataset file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => parseFileText(file.name, text));
              event.target.value = "";
            }}
          />
        </span>
      </nav>
      {tab === "Browse" && (
        <section className="pp-dataset-tools">
          <input
            aria-label="Search datasets"
            placeholder="Search datasets..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label>
            Task
            <select
              aria-label="Task filter"
              value={taskFilter}
              onChange={(event) =>
                setTaskFilter(event.target.value as "All" | Dataset["type"])
              }
            >
              <option value="All">All</option>
              {Object.entries(datasetTaskLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {shelf === "sources" && tab === "Browse" && (
        <section className="card pp-import">
          <h3>Data Sources</h3>
          <p>Fetch a public CSV/JSON URL or paste table text. Uploaded files stay in this browser.</p>
          <div>
            <input
              aria-label="Dataset source URL"
              placeholder="https://example.com/data.csv"
              value={importUrl}
              onChange={(event) => setImportUrl(event.target.value)}
            />
            <button onClick={() => void importFromUrl()}>Fetch URL</button>
            <button onClick={() => uploadRef.current?.click()}>Upload file</button>
          </div>
          <textarea
            aria-label="Paste CSV or JSON"
            placeholder="Paste CSV or JSON here"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={6}
          />
          <button onClick={importFromPaste}>Import pasted data</button>
        </section>
      )}
      {tab === "Browse" && (
        <section className="pp-library">
          <article className="card pp-dataset-list">
            <header>
              <span>DATASET</span>
              <span>TASK</span>
              <span>ROWS</span>
              <span>COLUMNS</span>
              <span>ID</span>
            </header>
            {filtered.map((dataset) => (
              <button
                className={selected.id === dataset.id ? "selected" : ""}
                key={dataset.id}
                onClick={() => setSelectedId(dataset.id)}
              >
                {dataset.name}
                <span>{datasetTaskLabels[dataset.type]}</span>
                <b>{dataset.data.length.toLocaleString()}</b>
                <small>{dataset.columns.length}</small>
                <em>{dataset.id}</em>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="pp-empty">No datasets in this view. Upload one or switch shelves.</p>
            )}
            <footer>
              <span>
                {filtered.length} of {catalog.length} datasets
                {shelf !== "library" ? ` · ${shelf}` : ""}
              </span>
            </footer>
          </article>
          <article className="card pp-preview">
            <h3>
              Preview: {selected.name}{" "}
              <small>{datasetTaskLabels[selected.type]}</small>
            </h3>
            <PreviewTable
              dataset={selected}
              columns={previewColumns}
              rows={previewRows}
              target={profile.target}
            />
            <footer>
              <span>
                Showing first {previewRows.length} of {selected.data.length} rows
              </span>
              <span>
                {selected.data.length.toLocaleString()} rows × {colCount} columns
              </span>
            </footer>
          </article>
          <aside>
            <section className="card">
              <h3>Dataset Actions</h3>
              <button onClick={() => void openSelected(selected, profile.target)}>
                ↗ Open in New Tab
              </button>
              <button onClick={toggleCollection}>
                {inCollection ? "★ In Collection" : "☆ Add to Collection"}
              </button>
              <button onClick={toggleFavorite}>
                {isFavorite ? "♥ Favorited" : "♡ Add to Favorites"}
              </button>
              <button
                onClick={() => {
                  downloadFile(
                    `${selected.id}.csv`,
                    toCSV(selected.columns, selected.data),
                    "text/csv;charset=utf-8",
                  );
                  act(`Downloaded ${selected.name}.csv`);
                }}
              >
                ↓ Download CSV
              </button>
              <button
                onClick={() => {
                  downloadFile(
                    `${selected.id}.json`,
                    JSON.stringify(
                      {
                        name: selected.name,
                        columns: selected.columns,
                        rows: selected.data,
                      },
                      null,
                      2,
                    ),
                    "application/json",
                  );
                  act(
                    `Downloaded ${selected.name} as JSON (Parquet isn't available in the browser)`,
                  );
                }}
              >
                ↓ Download Parquet
              </button>
              <button onClick={snapshotVersion}>▣ Create New Version</button>
            </section>
            <section className="card pp-dataset-info">
              <h3>Dataset Info</h3>
              <p>
                Source <b>{selected.id.startsWith("upload") || selected.id.startsWith("project") ? "Local import" : "Sample library"}</b>
              </p>
              <p>
                File Format <b>CSV</b>
              </p>
              <p>
                Size <b>{profile.sizeKb} KB</b>
              </p>
              <p>
                Rows × Columns{" "}
                <b>
                  {selected.data.length.toLocaleString()} × {colCount}
                </b>
              </p>
              <p>
                Target Column <b>{profile.target ?? "None"}</b>
              </p>
              <p>
                Task <b>{datasetTaskLabels[selected.type]}</b>
              </p>
            </section>
          </aside>
        </section>
      )}
      {tab === "Preview" && (
        <section className="card pp-preview pp-preview-full">
          <h3>
            Preview: {selected.name}{" "}
            <small>{datasetTaskLabels[selected.type]}</small>
          </h3>
          <p>{selected.description}</p>
          <PreviewTable
            dataset={selected}
            columns={previewColumns}
            rows={previewRows}
            target={profile.target}
          />
          <footer>
            <button onClick={() => void openSelected(selected, profile.target)}>
              Open in Dataset Manager
            </button>
            <span>
              {selected.data.length.toLocaleString()} rows × {colCount} columns
            </span>
          </footer>
        </section>
      )}
      {tab === "Profile" && (
        <>
          <section className="pp-profile">
            <article className="card">
              <h3>Schema Overview</h3>
              <div className="ring">{colCount}</div>
              <p>
                ● Numeric <b>{typeShare(profile.typeCounts.numeric)}</b>
                <br />● Categorical <b>{typeShare(profile.typeCounts.categorical)}</b>
                <br />● Boolean <b>{typeShare(profile.typeCounts.boolean)}</b>
              </p>
            </article>
            <article className="card">
              <h3>Missing Values</h3>
              <div className="bars">
                {(profile.missingByColumn.length
                  ? profile.missingByColumn.slice(0, 4)
                  : [{ column: "none", missing: 0 }]
                ).map((item) => (
                  <i key={item.column}>
                    <span
                      style={{
                        width: `${Math.max(4, (item.missing / Math.max(selected.data.length, 1)) * 100)}%`,
                      }}
                    />
                  </i>
                ))}
              </div>
              <p>
                Overall Missing{" "}
                <b>
                  {profile.missingTotal} / {selected.data.length * colCount}
                </b>
                <br />
                {profile.missingByColumn[0]
                  ? `${profile.missingByColumn[0].column} ${((profile.missingByColumn[0].missing / selected.data.length) * 100).toFixed(1)}%`
                  : "No missing values"}
              </p>
            </article>
            <article className="card">
              <h3>
                {profile.target
                  ? `Class / Target (${profile.target})`
                  : "Unsupervised Data"}
              </h3>
              <div className="ring">
                {profile.classes[0]
                  ? `${Math.round((profile.classes[0][1] / selected.data.length) * 100)}%`
                  : `${selected.data.length}`}
              </div>
              <p>
                {profile.classes.length > 0 ? (
                  <>
                    {profile.classes.slice(0, 3).map(([label, count]) => (
                      <span key={label}>
                        ● {label} <b>{count}</b>
                        <br />
                      </span>
                    ))}
                    Imbalance Ratio <b>{profile.imbalance}</b>
                  </>
                ) : (
                  <>
                    Rows <b>{selected.data.length}</b>
                    <br />
                    Features <b>{colCount}</b>
                  </>
                )}
              </p>
            </article>
            <article className="card">
              <h3>Feature Types</h3>
              <div className="bars">
                {[
                  profile.typeCounts.numeric,
                  profile.typeCounts.categorical,
                  profile.typeCounts.boolean,
                ].map((count, index) => (
                  <i key={index}>
                    <span
                      style={{ width: `${Math.max(4, (count / colCount) * 100)}%` }}
                    />
                  </i>
                ))}
              </div>
              <p>
                Numeric <b>{typeShare(profile.typeCounts.numeric)}</b>
                <br />
                Categorical <b>{typeShare(profile.typeCounts.categorical)}</b>
                <br />
                Boolean <b>{typeShare(profile.typeCounts.boolean)}</b>
              </p>
            </article>
          </section>
          <section className="card pp-insights">
            <h3>Insights</h3>
            <p>
              {[
                [
                  "✓",
                  selected.data.length ? "Rows loaded" : "Empty dataset",
                  `${selected.data.length} sample rows available in the browser.`,
                ],
                [
                  profile.missingTotal ? "⚠" : "✓",
                  profile.missingTotal ? "Missing values" : "Complete cells",
                  profile.missingTotal
                    ? `${profile.missingPct}% of cells are empty.`
                    : "No missing values in this sample.",
                ],
                [
                  "ⓘ",
                  profile.target ? "Target column" : "Unsupervised",
                  profile.target
                    ? `${profile.target} is the predicted field.`
                    : "No target column; use clustering or recommendation modules.",
                ],
                [
                  "♧",
                  "Columns",
                  `${colCount} features, ${numericPct.toFixed(0)}% numeric.`,
                ],
                [
                  "ϟ",
                  "Compatible modules",
                  compatible.length
                    ? `${compatible.length} algorithm pages accept this dataset.`
                    : "Open Dataset Manager to use this table.",
                ],
              ].map((item) => (
                <span key={item[1]}>
                  <i>{item[0]}</i>
                  <b>{item[1]}</b>
                  <small>{item[2]}</small>
                </span>
              ))}
            </p>
          </section>
          {compatible.length > 0 && (
            <section className="card pp-compatible">
              <h3>Open in an algorithm</h3>
              {compatible.map((item) => (
                <a
                  href={item.route}
                  key={item.route}
                  onClick={() => sendToAlgorithm(item.route)}
                >
                  {item.label}
                  <small>{item.category}</small>
                </a>
              ))}
            </section>
          )}
          {profile.typeCounts.numeric >= 2 && (
            <section className="card pp-compatible">
              <h3>Dimensionality reduction</h3>
              <p>
                High-dimensional numeric tables can be compressed or visualized with PCA, Kernel PCA, t-SNE, UMAP, LDA (if labels exist), or an autoencoder. No method is universally best.
              </p>
              {recommendDimensionalityAlgorithms({
                rows: selected.data.length,
                numericFeatures: profile.typeCounts.numeric,
                hasClassLabels: selected.type === "classification" && Boolean(profile.target),
                classes: profile.classes.length,
              }).map((item) => (
                <a
                  href={item.route}
                  key={`dr-${item.route}`}
                  onClick={() => sendToAlgorithm(item.route)}
                >
                  {item.label}
                  <small>
                    {item.rank}: {item.why[0]}
                  </small>
                </a>
              ))}
            </section>
          )}
          {(nlpProfile || isAudioTable) && (
            <section className="card pp-compatible">
              <h3>{isAudioTable ? "Audio dataset" : "Text / NLP"}</h3>
              {nlpProfile && (
                <p>
                  Documents: {nlpProfile.documents} · Empty: {nlpProfile.empty} · Average tokens: {nlpProfile.averageTokens.toFixed(1)} ·
                  Median: {nlpProfile.medianTokens} · Min/max: {nlpProfile.minTokens}/{nlpProfile.maxTokens} · Unique tokens: {nlpProfile.uniqueTokens}
                  · Hapax: {nlpProfile.hapax} · Exact duplicates: {nlpProfile.exactDuplicates} · Label case conflicts: {nlpProfile.labelCaseConflicts}
                  · Length bins (≤5 / ≤15 / ≤40 / ≤100 / 100+): {nlpProfile.lengthHistogram.join("/")}
                  {Object.keys(nlpProfile.classCounts).length > 0 && ` · Classes: ${JSON.stringify(nlpProfile.classCounts)}`}
                  {nlpProfile.warnings.map((warning) => ` · ${warning}`).join("")}
                </p>
              )}
              {isAudioTable && (
                <p>Clip metadata only. Audio Classification generates the labelled 440 Hz / 880 Hz / noise PCM in the browser.</p>
              )}
              {recommendNlpAlgorithms({
                hasText: Boolean(nlpProfile),
                hasLabels: textRows.some((row) => Boolean(row.label)),
                labels: [...new Set(textRows.map((row) => row.label).filter(Boolean) as string[])],
                audio: isAudioTable,
              }).map((item) => (
                <a
                  href={item.route}
                  key={`nlp-${item.route}`}
                  onClick={() => sendToAlgorithm(item.route)}
                >
                  {item.label}
                  <small>
                    {item.rank}: {item.why[0]}
                  </small>
                </a>
              ))}
            </section>
          )}
          {selected.type === "timeSeries" && tsProfile && (
            <section className="card pp-compatible">
              <h3>Time series profile</h3>
              <p>
                Time column: date · Target: value · Frequency: {tsProfile.frequency} ·
                Range: {tsProfile.start} – {tsProfile.end} · Observations:{" "}
                {tsProfile.observations} · Missing periods: {tsProfile.missingTimestamps} ·
                Duplicate timestamps: {tsProfile.duplicateTimestamps} · Trend:{" "}
                {tsProfile.trendHint} · Seasonality: {tsProfile.seasonalityHint} ·
                Suggested period: {tsProfile.suggestedSeasonalPeriod ?? "n/a"} · Sufficiency:{" "}
                {tsProfile.sufficiency}
              </p>
              <h3>Prepare series</h3>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(sortChronologically(tsPoints).points, "sorted")
                }
              >
                Sort timestamps
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(
                    resolveDuplicateTimestamps(tsPoints, "keep-last").points,
                    "deduped last",
                  )
                }
              >
                Duplicates: keep last
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(
                    resolveDuplicateTimestamps(tsPoints, "mean").points,
                    "deduped mean",
                  )
                }
              >
                Duplicates: mean
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(
                    resampleSeries(tsPoints, "weekly", "mean"),
                    "weekly mean",
                  )
                }
              >
                Resample daily→weekly (mean)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(
                    resampleSeries(tsPoints, "monthly", "sum"),
                    "monthly sum",
                  )
                }
              >
                Resample → monthly (sum)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTsPoints(fillMissingDaily(tsPoints, "ffill").points, "ffill")
                }
              >
                Fill missing days (ffill)
              </button>
              <h3>Time series suitability</h3>
              {recommendTimeSeriesAlgorithms(tsProfile).map((item) => (
                <a
                  href={item.route}
                  key={`${item.route}-why`}
                  onClick={() => sendToAlgorithm(item.route)}
                >
                  {item.label}
                  <small>
                    {item.rank}: {item.why[0]}
                  </small>
                </a>
              ))}
            </section>
          )}
        </>
      )}
      {tab === "Versions" && (
        <section className="card pp-versions">
          <header>
            <h3>Versions · {selected.name}</h3>
            <button onClick={snapshotVersion}>▣ Create New Version</button>
          </header>
          {selectedVersions.map((version) => (
            <article key={version.id}>
              <div>
                <b>{version.label}</b>
                <small>{new Date(version.savedAt).toLocaleString()}</small>
              </div>
              <span>
                {version.data.length} rows × {version.columns.length} columns
              </span>
              <button onClick={() => restoreVersion(version)}>Restore</button>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
