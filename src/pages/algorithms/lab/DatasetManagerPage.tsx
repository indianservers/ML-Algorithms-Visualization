import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Columns3,
  Copy,
  Database,
  Download,
  FileText,
  Filter,
  Grid3X3,
  HelpCircle,
  LineChart,
  RotateCcw,
  Save,
  Search,
  Table2,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { EditableDataGrid } from '../../../components/dataset/EditableDataGrid';
import { allSampleDatasets } from '../../../data/sampleDatasets';
import { getAlgorithmSampleDatasets } from '../../../data/algorithmDatasets';
import type { LoadedAlgorithmDataset } from '../../../data/algorithmDatasets';
import { getAllAlgorithms } from '../../../data/implementationStatus';
import { checkDatasetCompatibility } from '../../../lib/preprocessing/datasetCompatibility';
import { profileDataset } from '../../../lib/preprocessing/dataProfile';
import type { DataRow } from '../../../lib/preprocessing/dataProfile';
import {
  cloneDataset,
  displayCellValue,
  inferTargetColumn,
  isMissingValue,
  parseCSV,
  parseJSONDataset,
  rowKey,
  toCSV,
  validateParsedDataset,
} from '../../../lib/preprocessing/datasetIO';
import { deleteDataset, loadDatasets, saveDataset, SavedDataset } from '../../../stores/experimentStore';

type Row = DataRow;

interface DraftDataset {
  columns: string[];
  data: Row[];
  target: string;
}

interface VersionRecord {
  id: string;
  name: string;
  rows: number;
  columns: number;
  savedAt: number;
  target?: string;
  data: Row[];
  columnNames: string[];
}

const ACTIVE_DATASETS_KEY = 'mlSuite.activeAlgorithmDatasets';
const DATASET_VERSION_KEY = 'mlSuite.datasetVersionHistory';

const topMenu = [
  { label: 'Guide', id: 'user-guide', icon: HelpCircle },
  { label: 'Saved', id: 'saved-datasets', icon: Database },
  { label: 'Create', id: 'create-dataset', icon: Upload },
  { label: 'Schema', id: 'schema-tools', icon: Columns3 },
  { label: 'Compare', id: 'before-after', icon: ClipboardCheck },
  { label: 'Preprocess', id: 'preprocessing-steps', icon: Filter },
  { label: 'Quality', id: 'quality-inspector', icon: ClipboardCheck },
  { label: 'Grid', id: 'editable-grid', icon: Grid3X3 },
  { label: 'Export', id: 'export-dataset', icon: Download },
];

const userGuideSteps = [
  ['Choose data', 'Load a saved dataset, upload CSV/JSON, or start from a sample matched to an algorithm.'],
  ['Set schema', 'Pick a target column, select usable features, and mark columns that should be ignored.'],
  ['Clean draft', 'Apply preprocessing steps with undo/redo and compare every change against the raw data.'],
  ['Inspect quality', 'Review missing cells, duplicates, class balance, inferred types, outliers, and compatibility warnings.'],
  ['Edit details', 'Use the paginated grid for row, cell, and column edits without rendering a huge table at once.'],
  ['Save or use', 'Save locally, overwrite a selected dataset, clone a branch, export files, or load into an algorithm.'],
];

function numericValues(rows: Row[], column: string) {
  return rows.map(row => Number(row[column])).filter(Number.isFinite);
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}

function datasetFromSample(dataset: { columns: string[]; data: Row[]; name?: string }, preferredTarget?: string): DraftDataset {
  return {
    columns: [...dataset.columns],
    data: dataset.data.map(row => ({ ...row })),
    target: inferTargetColumn(dataset.columns, preferredTarget),
  };
}

function datasetFromSaved(dataset: SavedDataset): DraftDataset {
  return {
    columns: [...dataset.columns],
    data: dataset.data.map(row => ({ ...row })),
    target: inferTargetColumn(dataset.columns, dataset.target),
  };
}

function buildQuality(dataset: DraftDataset) {
  const profile = profileDataset(dataset.data, dataset.target);
  const classCounts = dataset.target
    ? Object.entries(dataset.data.reduce<Record<string, number>>((counts, row) => {
      const key = displayCellValue(row[dataset.target]) || 'missing';
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {})).map(([label, count]) => ({ label, count }))
    : [];
  const totalCells = Math.max(1, dataset.data.length * dataset.columns.length);
  const duplicateRows = profile.duplicates;
  const types = dataset.columns.map(column => {
    const values = dataset.data.map(row => row[column]).filter(value => !isMissingValue(value));
    const numeric = values.length > 0 && values.every(value => Number.isFinite(Number(value)));
    const datetime = values.length > 0 && values.every(value => !Number.isNaN(Date.parse(String(value))));
    const kind = numeric ? 'Numeric' : datetime ? 'DateTime' : values.some(value => String(value).length > 40) ? 'Text' : values.length ? 'Categorical' : 'Empty';
    const nums = numericValues(dataset.data, column);
    const q1 = percentile(nums, 0.25);
    const q3 = percentile(nums, 0.75);
    const iqr = q3 - q1;
    const outliers = iqr > 0 ? nums.filter(value => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length : 0;
    const suspicious = /age|price|amount|score|income|weight|height|rate|cost/i.test(column) && !numeric && values.length > 0;
    const unique = new Set(values.map(displayCellValue)).size;
    return { column, kind, outliers, suspicious, missing: dataset.data.length - values.length, unique };
  });
  const counts = classCounts.map(item => item.count);
  const minClass = Math.min(...counts, Infinity);
  const maxClass = Math.max(...counts, 0);
  const imbalanceRatio = counts.length ? maxClass / Math.max(1, minClass) : 1;
  const missingRate = profile.missing / totalCells;
  const duplicateRate = duplicateRows / Math.max(1, dataset.data.length);
  const health = imbalanceRatio > 3 || missingRate > 0.15 || duplicateRate > 0.1
    ? 'Poor'
    : imbalanceRatio > 1.5 || missingRate > 0.05 || duplicateRate > 0.02 ? 'Fair' : 'Good';
  return { profile, classCounts, missingRate, duplicateRows, duplicateRate, types, imbalanceRatio, health };
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 MB';
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function loadedDatasetFromDraft(dataset: SavedDataset, target: string): LoadedAlgorithmDataset {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description || `${dataset.data.length} saved rows from your browser storage.`,
    columns: dataset.columns,
    data: dataset.data,
    target,
    kind: 'upload',
  };
}

export default function DatasetManagerPage() {
  const navigate = useNavigate();
  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const [algorithmRoute, setAlgorithmRoute] = useState('/ml/supervised/logistic-regression');
  const selectedAlgorithm = algorithms.find(item => item.route === algorithmRoute) ?? algorithms[0];
  const algorithmSamples = useMemo(
    () => getAlgorithmSampleDatasets(selectedAlgorithm.route, selectedAlgorithm.category),
    [selectedAlgorithm],
  );
  const firstSample = algorithmSamples[0] ?? allSampleDatasets[0];
  const [saved, setSaved] = useState<SavedDataset[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(firstSample.id);
  const [name, setName] = useState(firstSample.name);
  const [description, setDescription] = useState(firstSample.description ?? '');
  const [tags, setTags] = useState('sample, local');
  const [draft, setDraft] = useState<DraftDataset>(() => datasetFromSample(firstSample));
  const [rawDraft, setRawDraft] = useState<DraftDataset>(() => datasetFromSample(firstSample));
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() => firstSample.columns.filter(column => column !== inferTargetColumn(firstSample.columns)));
  const [preprocessingLog, setPreprocessingLog] = useState<string[]>([]);
  const [history, setHistory] = useState<DraftDataset[]>([]);
  const [redoHistory, setRedoHistory] = useState<DraftDataset[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedSearch, setSavedSearch] = useState('');
  const [versionHistory, setVersionHistory] = useState<VersionRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DATASET_VERSION_KEY) ?? '[]') as VersionRecord[];
    } catch {
      return [];
    }
  });
  const [storageEstimate, setStorageEstimate] = useState<{ usage?: number; quota?: number }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const items = await loadDatasets();
    setSaved(items.sort((a, b) => (b.updatedAt ?? b.savedAt) - (a.updatedAt ?? a.savedAt)));
  };

  useEffect(() => {
    let active = true;
    loadDatasets().then(items => {
      if (active) setSaved(items.sort((a, b) => (b.updatedAt ?? b.savedAt) - (a.updatedAt ?? a.savedAt)));
    });
    navigator.storage?.estimate?.().then(estimate => {
      if (active) setStorageEstimate({ usage: estimate.usage, quota: estimate.quota });
    });
    return () => {
      active = false;
    };
  }, []);

  const quality = useMemo(() => buildQuality(draft), [draft]);
  const rawQuality = useMemo(() => buildQuality(rawDraft), [rawDraft]);
  const compatibility = useMemo(() => checkDatasetCompatibility({
    id: selectedSavedId ?? selectedId,
    name,
    description,
    columns: draft.columns,
    data: draft.data,
    target: draft.target || undefined,
    kind: 'upload',
  }, algorithmRoute, selectedAlgorithm.category), [algorithmRoute, description, draft, name, selectedAlgorithm.category, selectedId, selectedSavedId]);
  const comparisonMetrics = [
    { label: 'Rows', before: rawDraft.data.length, after: draft.data.length, delta: draft.data.length - rawDraft.data.length },
    { label: 'Missing cells', before: rawQuality.profile.missing, after: quality.profile.missing, delta: quality.profile.missing - rawQuality.profile.missing },
    { label: 'Duplicate rows', before: rawQuality.duplicateRows, after: quality.duplicateRows, delta: quality.duplicateRows - rawQuality.duplicateRows },
    { label: 'Outlier flags', before: rawQuality.types.reduce((sum, item) => sum + item.outliers, 0), after: quality.types.reduce((sum, item) => sum + item.outliers, 0), delta: quality.types.reduce((sum, item) => sum + item.outliers, 0) - rawQuality.types.reduce((sum, item) => sum + item.outliers, 0) },
  ];
  const diffSummary = {
    rowsRemoved: Math.max(0, rawDraft.data.length - draft.data.length),
    cellsChanged: draft.data.reduce((sum, row, rowIndex) => sum + draft.columns.filter(column => displayCellValue(row[column]) !== displayCellValue(rawDraft.data[rowIndex]?.[column])).length, 0),
    columnsChanged: draft.columns.filter((column, index) => rawDraft.columns[index] !== column || !rawDraft.columns.includes(column)).length,
  };
  const filteredSaved = saved.filter(dataset => {
    const text = `${dataset.name} ${dataset.description ?? ''} ${dataset.tags?.join(' ') ?? ''} ${dataset.columns.join(' ')}`.toLowerCase();
    return text.includes(savedSearch.toLowerCase());
  });
  const activeFeatures = selectedFeatures.filter(column => draft.columns.includes(column) && column !== draft.target);

  const commitDraft = (label: string, updater: (previous: DraftDataset) => DraftDataset) => {
    setDraft(previous => {
      setHistory(current => [cloneDataset(previous), ...current].slice(0, 40));
      setRedoHistory([]);
      return updater(cloneDataset(previous));
    });
    setPreprocessingLog(current => [label, ...current].slice(0, 20));
    setMessage(label);
    setError('');
  };

  const replaceWorkingDataset = (dataset: DraftDataset, nextName: string, nextDescription = '', nextTags = 'sample, local', savedId: string | null = null) => {
    const cloned = cloneDataset(dataset);
    setDraft(cloned);
    setRawDraft(cloneDataset(cloned));
    setName(nextName);
    setDescription(nextDescription);
    setTags(nextTags);
    setSelectedSavedId(savedId);
    setSelectedFeatures(cloned.columns.filter(column => column !== cloned.target));
    setHistory([]);
    setRedoHistory([]);
    setPreprocessingLog([]);
    setMessage('');
    setError('');
  };

  const loadSample = (id: string) => {
    const dataset = algorithmSamples.find(item => item.id === id) ?? allSampleDatasets.find(item => item.id === id) ?? allSampleDatasets[0];
    setSelectedId(id);
    replaceWorkingDataset(datasetFromSample(dataset), dataset.name, dataset.description ?? '', `${selectedAlgorithm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, sample, local`);
  };

  const loadAlgorithm = (route: string) => {
    const algorithm = algorithms.find(item => item.route === route) ?? algorithms[0];
    const samples = getAlgorithmSampleDatasets(algorithm.route, algorithm.category);
    const dataset = samples[0] ?? allSampleDatasets[0];
    setAlgorithmRoute(route);
    setSelectedId(dataset.id);
    replaceWorkingDataset(datasetFromSample(dataset), dataset.name, dataset.description ?? '', `${algorithm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, sample, local`);
  };

  const setActiveDataset = (dataset: SavedDataset, route = algorithmRoute) => {
    const current = JSON.parse(localStorage.getItem(ACTIVE_DATASETS_KEY) ?? '{}') as Record<string, unknown>;
    current[route] = loadedDatasetFromDraft(dataset, draft.target);
    localStorage.setItem(ACTIVE_DATASETS_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('ml:algorithm-dataset-loaded', { detail: { route, dataset } }));
  };

  const loadSavedDataset = (dataset: SavedDataset, shouldNavigate = false) => {
    replaceWorkingDataset(datasetFromSaved(dataset), dataset.name, dataset.description ?? '', dataset.tags?.join(', ') || 'saved, local', dataset.id);
    setActiveDataset(dataset);
    setMessage(`${dataset.name} is active.`);
    if (shouldNavigate) navigate('/ml/lab/dataset-manager');
  };

  const restoreVersion = (version: VersionRecord) => {
    replaceWorkingDataset({
      columns: version.columnNames,
      data: version.data,
      target: inferTargetColumn(version.columnNames, version.target),
    }, `${version.name} restored`, 'Restored from local version history.', 'restored, local');
    setMessage(`${version.name} restored from version history.`);
  };

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = file.name.endsWith('.json') ? parseJSONDataset(text) : parseCSV(text);
      const validation = validateParsedDataset(parsed);
      if (validation.errors.length) {
        setError(validation.errors.join(' '));
        return;
      }
      const next = { ...parsed, target: inferTargetColumn(parsed.columns) };
      replaceWorkingDataset(next, file.name.replace(/\.(csv|json)$/i, ''), `Uploaded from ${file.name}.`, 'upload, local');
      setMessage(validation.warnings.length ? validation.warnings.join(' ') : `${file.name} loaded.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The file could not be loaded.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const buildSavedDataset = (id: string, savedAt = Date.now()): SavedDataset => ({
    id,
    name: name.trim() || 'Untitled dataset',
    description,
    columns: draft.columns,
    data: draft.data,
    target: draft.target || undefined,
    algorithmRoute,
    algorithmLabel: selectedAlgorithm.label,
    taskType: compatibility.expectedTask,
    tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
    preprocessingHistory: preprocessingLog,
    savedAt,
    updatedAt: Date.now(),
  });

  const rememberVersion = (dataset: SavedDataset) => {
    const next: VersionRecord[] = [{
      id: dataset.id,
      name: dataset.name,
      rows: dataset.data.length,
      columns: dataset.columns.length,
      savedAt: dataset.updatedAt ?? dataset.savedAt,
      target: dataset.target,
      data: dataset.data,
      columnNames: dataset.columns,
    }, ...versionHistory].slice(0, 20);
    setVersionHistory(next);
    localStorage.setItem(DATASET_VERSION_KEY, JSON.stringify(next));
  };

  const handleSave = async (mode: 'new' | 'update' = 'new') => {
    const existing = mode === 'update' && selectedSavedId ? saved.find(dataset => dataset.id === selectedSavedId) : undefined;
    const dataset = buildSavedDataset(existing?.id ?? `dataset_${Date.now()}`, existing?.savedAt);
    await saveDataset(dataset);
    rememberVersion(dataset);
    setSelectedSavedId(dataset.id);
    setMessage(existing ? 'Dataset updated in IndexedDB.' : 'Dataset saved to IndexedDB.');
    setError('');
    await refresh();
    return dataset;
  };

  const handleSaveAndLoad = async () => {
    const dataset = await handleSave(selectedSavedId ? 'update' : 'new');
    setActiveDataset(dataset, algorithmRoute);
    setMessage(`${dataset.name} saved and loaded for ${selectedAlgorithm.label}.`);
  };

  const cloneCurrentDataset = async () => {
    const previousName = name;
    setName(`${name} copy`);
    const dataset = buildSavedDataset(`dataset_${Date.now()}`);
    dataset.name = `${previousName} copy`;
    await saveDataset(dataset);
    rememberVersion(dataset);
    setSelectedSavedId(dataset.id);
    setMessage(`${dataset.name} saved as a separate copy.`);
    await refresh();
  };

  const confirmDelete = async (dataset: SavedDataset) => {
    if (!window.confirm(`Delete "${dataset.name}" from browser storage?`)) return;
    await deleteDataset(dataset.id);
    if (selectedSavedId === dataset.id) setSelectedSavedId(null);
    await refresh();
  };

  const trimTextCells = () => commitDraft('Trimmed text cells', previous => ({
    ...previous,
    data: previous.data.map(row => Object.fromEntries(previous.columns.map(column => {
      const value = row[column];
      return [column, typeof value === 'string' ? value.trim() : value];
    }))),
  }));

  const fillMissingValues = (strategy: 'mean' | 'median' | 'mode' | 'custom' = 'mean', customValue = 'unknown') => commitDraft(`Filled missing values (${strategy})`, previous => {
    const replacements = Object.fromEntries(previous.columns.map(column => {
      const present = previous.data.map(row => row[column]).filter(value => !isMissingValue(value));
      const numeric = present.length > 0 && present.every(value => Number.isFinite(Number(value)));
      if (strategy === 'custom') return [column, customValue];
      if (numeric && strategy !== 'mode') {
        const values = present.map(Number).sort((a, b) => a - b);
        const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
        const median = percentile(values, 0.5);
        return [column, Number((strategy === 'median' ? median : mean).toFixed(4))];
      }
      const counts = present.reduce<Record<string, number>>((items, value) => {
        const key = displayCellValue(value);
        items[key] = (items[key] ?? 0) + 1;
        return items;
      }, {});
      return [column, Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? customValue];
    }));
    return {
      ...previous,
      data: previous.data.map(row => Object.fromEntries(previous.columns.map(column => [
        column,
        isMissingValue(row[column]) ? replacements[column] : row[column],
      ]))),
    };
  });

  const removeDuplicateRows = () => commitDraft('Removed duplicate rows', previous => {
    const seen = new Set<string>();
    return {
      ...previous,
      data: previous.data.filter(row => {
        const key = rowKey(row, previous.columns);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    };
  });

  const scaleNumericColumns = (mode: 'minmax' | 'standard' = 'minmax') => commitDraft(mode === 'minmax' ? 'Scaled numeric columns (0-1)' : 'Standardized numeric columns', previous => {
    const numericColumns = previous.columns.filter(column => {
      const present = previous.data.map(row => row[column]).filter(value => !isMissingValue(value));
      return present.length > 0 && present.every(value => Number.isFinite(Number(value)));
    });
    const stats = Object.fromEntries(numericColumns.map(column => {
      const values = numericValues(previous.data, column);
      const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
      const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length);
      return [column, { min: Math.min(...values), max: Math.max(...values), mean, sd: Math.sqrt(variance) }];
    }));
    return {
      ...previous,
      data: previous.data.map(row => ({
        ...row,
        ...Object.fromEntries(numericColumns.map(column => {
          const stat = stats[column];
          const value = Number(row[column]);
          const scaled = mode === 'standard'
            ? (stat.sd === 0 ? 0 : (value - stat.mean) / stat.sd)
            : (stat.max === stat.min ? 0 : (value - stat.min) / (stat.max - stat.min));
          return [column, Number(scaled.toFixed(4))];
        })),
      })),
    };
  });

  const encodeCategoricalColumns = (mode: 'label' | 'onehot' = 'label') => commitDraft(mode === 'label' ? 'Encoded categorical columns (labels)' : 'One-hot encoded categorical columns', previous => {
    const categoricalColumns = previous.columns.filter(column => {
      if (column === previous.target) return false;
      const present = previous.data.map(row => row[column]).filter(value => !isMissingValue(value));
      return present.length > 0 && !present.every(value => Number.isFinite(Number(value)));
    });
    if (mode === 'label') {
      const maps = Object.fromEntries(categoricalColumns.map(column => {
        const values = Array.from(new Set(previous.data.map(row => displayCellValue(row[column])).filter(Boolean))).sort();
        return [column, Object.fromEntries(values.map((value, index) => [value, index])) as Record<string, number>];
      }));
      return {
        ...previous,
        data: previous.data.map(row => ({
          ...row,
          ...Object.fromEntries(categoricalColumns.map(column => [column, maps[column][displayCellValue(row[column])] ?? null])),
        })),
      };
    }
    const additions = categoricalColumns.flatMap(column => Array.from(new Set(previous.data.map(row => displayCellValue(row[column])).filter(Boolean))).slice(0, 12).map(value => ({ column, value, name: `${column}_${value.replace(/[^a-z0-9]+/gi, '_')}` })));
    return {
      ...previous,
      columns: [...previous.columns.filter(column => !categoricalColumns.includes(column)), ...additions.map(item => item.name)],
      data: previous.data.map(row => {
        const base = { ...row };
        categoricalColumns.forEach(column => { delete base[column]; });
        additions.forEach(item => { base[item.name] = displayCellValue(row[item.column]) === item.value ? 1 : 0; });
        return base;
      }),
    };
  });

  const removeOutlierRows = () => commitDraft('Removed IQR outlier rows', previous => {
    const numericColumns = previous.columns.filter(column => numericValues(previous.data, column).length > 3);
    const fences = Object.fromEntries(numericColumns.map(column => {
      const values = numericValues(previous.data, column);
      const q1 = percentile(values, 0.25);
      const q3 = percentile(values, 0.75);
      const iqr = q3 - q1;
      return [column, { low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr }];
    }));
    return {
      ...previous,
      data: previous.data.filter(row => numericColumns.every(column => {
        const value = Number(row[column]);
        return !Number.isFinite(value) || (value >= fences[column].low && value <= fences[column].high);
      })),
    };
  });

  const dropSelectedColumns = () => {
    const ignored = draft.columns.filter(column => column !== draft.target && !activeFeatures.includes(column));
    if (!ignored.length) return;
    commitDraft(`Dropped ${ignored.length} ignored column(s)`, previous => ({
      ...previous,
      columns: previous.columns.filter(column => !ignored.includes(column)),
      data: previous.data.map(row => {
        const next = { ...row };
        ignored.forEach(column => { delete next[column]; });
        return next;
      }),
    }));
  };

  const castColumn = (column: string, type: 'number' | 'text' | 'boolean') => commitDraft(`Cast ${column} to ${type}`, previous => ({
    ...previous,
    data: previous.data.map(row => {
      const value = row[column];
      const nextValue = type === 'number'
        ? (Number.isFinite(Number(value)) ? Number(value) : null)
        : type === 'boolean'
          ? /^(true|1|yes)$/i.test(String(value))
          : displayCellValue(value);
      return { ...row, [column]: nextValue };
    }),
  }));

  const undoPreprocessing = () => {
    const [last, ...rest] = history;
    if (!last) return;
    setRedoHistory(current => [cloneDataset(draft), ...current].slice(0, 40));
    setDraft(cloneDataset(last));
    setHistory(rest);
    setPreprocessingLog(current => [`Undo: ${current[0] ?? 'change'}`, ...current.slice(1)].slice(0, 20));
  };

  const redoPreprocessing = () => {
    const [next, ...rest] = redoHistory;
    if (!next) return;
    setHistory(current => [cloneDataset(draft), ...current].slice(0, 40));
    setDraft(cloneDataset(next));
    setRedoHistory(rest);
    setPreprocessingLog(current => ['Redo change', ...current].slice(0, 20));
  };

  const resetToRawDataset = () => {
    setHistory(current => [cloneDataset(draft), ...current].slice(0, 40));
    setDraft(cloneDataset(rawDraft));
    setRedoHistory([]);
    setPreprocessingLog([]);
    setMessage('Cleaned draft reset to the original before-preprocessing dataset.');
  };

  const setTarget = (target: string) => {
    setDraft(previous => ({ ...previous, target }));
    setSelectedFeatures(draft.columns.filter(column => column !== target));
  };

  const toggleFeature = (column: string) => {
    setSelectedFeatures(current => current.includes(column) ? current.filter(item => item !== column) : [...current, column]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Dataset Manager" subtitle="Prepare, validate, version, edit, save, and load browser-local datasets for ML algorithm pages." badge="Enhanced" category="Lab" icon={<Database size={22} />} />

      <nav className="sticky top-0 z-20 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95" aria-label="Dataset manager top menu">
        <div className="flex gap-2 overflow-x-auto">
          {topMenu.map(({ label, id, icon: Icon }) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-blue-950/30">
              <Icon size={14} />
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id="user-guide">
        <Card title="How to Use Dataset Manager" subtitle="A short workflow for preparing data before training or visualization." icon={<HelpCircle size={14} />}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {userGuideSteps.map(([title, text], index) => (
              <div key={title} className="flex gap-3 rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-gray-900 text-xs font-black text-white dark:bg-gray-100 dark:text-gray-900">{index + 1}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section id="saved-datasets">
            <Card title="Saved Datasets" subtitle="Search, load, clone, update, or delete IndexedDB datasets.">
              <div className="space-y-3">
                <label className="flex min-h-10 items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <Search size={14} className="shrink-0 text-gray-400" />
                  <input value={savedSearch} onChange={event => setSavedSearch(event.target.value)} placeholder="Search saved datasets, tags, columns" className="min-w-0 flex-1 bg-transparent outline-none" />
                </label>
                <div className="max-h-96 space-y-2 overflow-auto pr-1">
                  {filteredSaved.map(dataset => (
                    <div key={dataset.id} className={`rounded border p-3 text-sm ${selectedSavedId === dataset.id ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700'}`}>
                      <button onClick={() => loadSavedDataset(dataset, true)} className="w-full text-left">
                        <p className="truncate font-semibold text-gray-900 dark:text-white">{dataset.name}</p>
                        <p className="text-xs text-gray-500">{dataset.data.length} rows, {dataset.columns.length} columns, target: {dataset.target ?? 'unset'}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">tags: {dataset.tags?.join(', ') || 'none'}</p>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button onClick={() => loadSavedDataset(dataset)} className="inline-flex min-h-8 items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-bold dark:border-gray-700"><Upload size={12} /> Load</button>
                        <button onClick={() => confirmDelete(dataset)} className="inline-flex min-h-8 items-center gap-1 rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                {saved.length === 0 && <p className="text-sm text-gray-500">No saved datasets yet. Upload a file or save one of the samples.</p>}
                {saved.length > 0 && filteredSaved.length === 0 && <p className="text-sm text-gray-500">No saved datasets match this search.</p>}
              </div>
            </Card>
          </section>

          <section id="create-dataset">
            <Card title="Upload, Metadata, and Save" subtitle="Choose an algorithm so samples and compatibility checks stay aligned.">
              <div className="space-y-3 text-sm">
                <select value={algorithmRoute} onChange={event => loadAlgorithm(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                  {algorithms.map(algorithm => <option key={algorithm.route} value={algorithm.route}>{algorithm.category} - {algorithm.label}</option>)}
                </select>
                <select value={selectedId} onChange={event => loadSample(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                  {algorithmSamples.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
                </select>
                <input value={name} onChange={event => setName(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" placeholder="Dataset name" />
                <textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" placeholder="Description" />
                <input value={tags} onChange={event => setTags(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" placeholder="tags" />
                <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={event => event.target.files?.[0] && handleUpload(event.target.files[0])} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => fileRef.current?.click()} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"><Upload size={14} /> Upload</button>
                  <button onClick={() => handleSave('new')} className="flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 font-semibold text-white"><Save size={14} /> Save New</button>
                  <button onClick={() => handleSave('update')} disabled={!selectedSavedId} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-gray-700"><Save size={14} /> Update</button>
                  <button onClick={cloneCurrentDataset} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 font-semibold dark:border-gray-700"><Copy size={14} /> Clone</button>
                </div>
                <button onClick={handleSaveAndLoad} className="flex min-h-10 w-full items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 font-semibold text-white">
                  Save & Load for Selected Algorithm
                </button>
                {message && <InfoBox type="success">{message}</InfoBox>}
                {error && <InfoBox type="error">{error}</InfoBox>}
              </div>
            </Card>
          </section>

          <Card title="Data Profile">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Rows', quality.profile.rows],
                ['Columns', draft.columns.length],
                ['Missing', quality.profile.missing],
                ['Numeric', quality.profile.numericColumns.length],
                ['Categorical', quality.profile.categoricalColumns.length],
                ['Duplicates', quality.duplicateRows],
                ['Target', draft.target || 'unset'],
                ['Storage', `${formatBytes(storageEstimate.usage ?? 0)} / ${formatBytes(storageEstimate.quota ?? 0)}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded bg-gray-50 p-2 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="truncate font-mono text-base font-bold">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Version Restore" subtitle="Recent local save snapshots.">
            <div className="max-h-56 space-y-2 overflow-auto text-sm">
              {versionHistory.map(version => (
                <button key={`${version.id}-${version.savedAt}`} onClick={() => restoreVersion(version)} className="w-full rounded border border-gray-200 px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                  <p className="truncate font-semibold">{version.name}</p>
                  <p className="text-xs text-gray-500">{version.rows} rows, {version.columns} columns, {new Date(version.savedAt).toLocaleString()}</p>
                </button>
              ))}
              {versionHistory.length === 0 && <p className="text-sm text-gray-500">No saved versions yet.</p>}
            </div>
          </Card>

          <section id="export-dataset">
            <Card title="Export">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={() => download(`${name}.csv`, toCSV(draft.columns, draft.data), 'text/csv;charset=utf-8')} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"><Download size={14} /> CSV</button>
                <button onClick={() => download(`${name}.json`, JSON.stringify(draft, null, 2), 'application/json')} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"><Download size={14} /> JSON</button>
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-4">
          <Card title="Next Steps">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Visualize', to: selectedAlgorithm.route, icon: LineChart },
                { label: 'Dashboard', to: '/ml/lab/algorithm-comparison', icon: BarChart3 },
                { label: 'Statistics', to: '/ml/preprocessing/missing-values', icon: Table2 },
                { label: 'Data Grid', to: '/ml/lab/dataset-manager', icon: Grid3X3 },
              ].map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <section id="schema-tools">
            <Card title="Schema and Compatibility" subtitle="Choose the answer column, usable features, type casts, and algorithm fit.">
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3 text-sm">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Target column</span>
                    <select value={draft.target} onChange={event => setTarget(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                      <option value="">No target</option>
                      {draft.columns.map(column => <option key={column} value={column}>{column}</option>)}
                    </select>
                  </label>
                  <button onClick={dropSelectedColumns} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><Trash2 size={14} /> Drop ignored columns</button>
                  <div className={`rounded-lg border p-3 text-xs ${compatibility.errors.length ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200' : compatibility.warnings.length ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
                    <p className="mb-2 flex items-center gap-1 font-bold uppercase"><AlertTriangle size={13} /> Dataset fit: {compatibility.expectedTask}</p>
                    {[...compatibility.errors, ...compatibility.warnings, ...compatibility.notes].slice(0, 5).map(item => <p key={item} className="mt-1">{item}</p>)}
                  </div>
                </div>
                <div className="max-h-80 overflow-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <th className="p-2 text-left">Use</th>
                        <th className="p-2 text-left">Column</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">Missing</th>
                        <th className="p-2 text-left">Cast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quality.types.map(item => (
                        <tr key={item.column} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="p-2"><input type="checkbox" checked={item.column === draft.target || activeFeatures.includes(item.column)} disabled={item.column === draft.target} onChange={() => toggleFeature(item.column)} /></td>
                          <td className="p-2 font-semibold">{item.column}{item.column === draft.target ? ' (target)' : ''}</td>
                          <td className="p-2">{item.kind}</td>
                          <td className="p-2">{item.missing}</td>
                          <td className="p-2">
                            <select onChange={event => event.target.value && castColumn(item.column, event.target.value as 'number' | 'text' | 'boolean')} defaultValue="" className="min-h-8 rounded border border-gray-200 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
                              <option value="">Cast</option>
                              <option value="number">Number</option>
                              <option value="text">Text</option>
                              <option value="boolean">Boolean</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </section>

          <section id="before-after">
            <Card
              title="Before and After Preprocessing"
              subtitle="Original data stays on the left. Cleaning actions update the after view on the right."
              actions={(
                <div className="flex flex-wrap gap-2">
                  <button onClick={undoPreprocessing} disabled={!history.length} className="inline-flex min-h-9 items-center gap-2 rounded border border-gray-200 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40 dark:border-gray-700"><Undo2 size={13} /> Undo</button>
                  <button onClick={redoPreprocessing} disabled={!redoHistory.length} className="inline-flex min-h-9 items-center gap-2 rounded border border-gray-200 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40 dark:border-gray-700"><RotateCcw size={13} /> Redo</button>
                  <button onClick={resetToRawDataset} className="inline-flex min-h-9 items-center gap-2 rounded border border-gray-200 px-2.5 py-1.5 text-xs font-bold dark:border-gray-700"><RotateCcw size={13} /> Reset after</button>
                </div>
              )}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {[
                  { title: 'Before preprocessing', tone: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20', dataset: rawDraft, quality: rawQuality },
                  { title: 'After preprocessing', tone: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20', dataset: draft, quality },
                ].map(panel => (
                  <div key={panel.title} className={`rounded-lg border p-3 ${panel.tone}`}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">{panel.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{panel.dataset.data.length} rows, {panel.dataset.columns.length} columns, {panel.quality.health} health</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-gray-950 dark:text-gray-200">{panel.quality.profile.missing} missing</span>
                    </div>
                    <div className="overflow-auto rounded border border-white/70 bg-white text-xs dark:border-gray-800 dark:bg-gray-950">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr>{panel.dataset.columns.slice(0, 6).map(column => <th key={column} className="border-b border-gray-200 px-2 py-1.5 text-left font-bold text-gray-500 dark:border-gray-800">{column}</th>)}</tr>
                        </thead>
                        <tbody>
                          {panel.dataset.data.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>{panel.dataset.columns.slice(0, 6).map(column => <td key={column} className={`border-b border-gray-100 px-2 py-1.5 dark:border-gray-800 ${isMissingValue(row[column]) ? 'font-bold text-red-600 dark:text-red-300' : 'text-gray-700 dark:text-gray-200'}`}>{isMissingValue(row[column]) ? 'missing' : String(row[column])}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-4">
                {comparisonMetrics.map(metric => {
                  const improved = metric.delta <= 0;
                  return (
                    <div key={metric.label} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                      <p className="text-xs font-bold uppercase text-gray-500">{metric.label}</p>
                      <p className="mt-1 font-mono text-lg font-black">{metric.before} {'->'} {metric.after}</p>
                      <p className={`text-xs font-bold ${metric.delta === 0 ? 'text-gray-500' : improved ? 'text-emerald-600' : 'text-amber-600'}`}>{metric.delta === 0 ? 'No change' : `${metric.delta > 0 ? '+' : ''}${metric.delta} change`}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <div className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"><p className="text-xs font-bold uppercase text-gray-500">Rows removed</p><p className="font-mono text-lg font-black">{diffSummary.rowsRemoved}</p></div>
                <div className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"><p className="text-xs font-bold uppercase text-gray-500">Cells changed</p><p className="font-mono text-lg font-black">{diffSummary.cellsChanged}</p></div>
                <div className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"><p className="text-xs font-bold uppercase text-gray-500">Columns changed</p><p className="font-mono text-lg font-black">{diffSummary.columnsChanged}</p></div>
              </div>

              <div className="mt-3 rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                <p className="mb-2 font-bold text-gray-900 dark:text-white">Preprocessing history</p>
                {preprocessingLog.length ? <div className="flex flex-wrap gap-2">{preprocessingLog.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{item}</span>)}</div> : <p className="text-xs text-gray-500">No preprocessing applied yet.</p>}
              </div>
            </Card>
          </section>

          <section id="preprocessing-steps">
            <Card title="Preprocessing Steps" subtitle="Configurable actions update the current draft. Save after the comparison looks right.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={trimTextCells} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><FileText size={14} /> Trim text</button>
                <button onClick={() => fillMissingValues('mean')} disabled={quality.profile.missing === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><CheckCircle2 size={14} /> Fill mean</button>
                <button onClick={() => fillMissingValues('median')} disabled={quality.profile.missing === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><CheckCircle2 size={14} /> Fill median</button>
                <button onClick={() => fillMissingValues('mode')} disabled={quality.profile.missing === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><CheckCircle2 size={14} /> Fill mode</button>
                <button onClick={removeDuplicateRows} disabled={quality.duplicateRows === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><Grid3X3 size={14} /> Remove duplicates</button>
                <button onClick={removeOutlierRows} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><Filter size={14} /> Remove outliers</button>
                <button onClick={() => scaleNumericColumns('minmax')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><BarChart3 size={14} /> Min-max scale</button>
                <button onClick={() => scaleNumericColumns('standard')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><BarChart3 size={14} /> Standardize</button>
                <button onClick={() => encodeCategoricalColumns('label')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><ClipboardCheck size={14} /> Label encode</button>
                <button onClick={() => encodeCategoricalColumns('onehot')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><ClipboardCheck size={14} /> One-hot encode</button>
              </div>
            </Card>
          </section>

          <section id="quality-inspector">
            <Card title="Quality Inspector" subtitle="Class balance, missing values, duplicates, outliers, inferred column types, and validation risks.">
              <div className="grid gap-3 md:grid-cols-4">
                <div className={`rounded p-3 ${quality.health === 'Good' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-200' : quality.health === 'Fair' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-200' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-200'}`}><p className="text-xs font-bold uppercase">Dataset Health</p><p className="text-2xl font-black">{quality.health}</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Missing cells</p><p className="text-2xl font-black">{quality.profile.missing}</p><p className="text-xs">{(quality.missingRate * 100).toFixed(1)}%</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Duplicate rows</p><p className="text-2xl font-black">{quality.duplicateRows}</p><p className="text-xs">{(quality.duplicateRate * 100).toFixed(1)}%</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Class ratio</p><p className="text-2xl font-black">{quality.imbalanceRatio.toFixed(1)}x</p><p className="truncate text-xs">{draft.target || 'no target'}</p></div>
              </div>

              {quality.classCounts.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold">Class Balance</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={quality.classCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {quality.classCounts.map(item => {
                          const min = Math.min(...quality.classCounts.map(entry => entry.count));
                          const ratio = item.count / Math.max(1, min);
                          return <Cell key={item.label} fill={ratio <= 1.5 ? '#059669' : ratio <= 3 ? '#d97706' : '#dc2626'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {quality.imbalanceRatio > 1.5 && <InfoBox type="warning">Largest class has {quality.imbalanceRatio.toFixed(1)}x more rows than the smallest class. Consider augmentation, upsampling, or collecting more minority-class examples.</InfoBox>}
                </div>
              )}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-bold">Missing Value Heatmap</p>
                  <div className="overflow-auto rounded border border-gray-200 p-2 dark:border-gray-700">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${draft.columns.length}, minmax(18px, 1fr))` }}>
                      {draft.columns.map(col => <span key={col} className="truncate text-[10px] font-bold text-gray-500" title={col}>{col.slice(0, 3)}</span>)}
                      {draft.data.slice(0, 24).flatMap((row, rowIndex) => draft.columns.map(col => <span key={`${rowIndex}-${col}`} title={`${rowIndex + 1}: ${col}`} className={`h-4 rounded-sm ${isMissingValue(row[col]) ? 'bg-red-500' : 'bg-green-500'}`} />))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold">Column Types and Outliers</p>
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {quality.types.map(item => (
                      <div key={item.column} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
                        <span className="min-w-0 truncate font-semibold">{item.column}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.kind === 'Numeric' ? 'bg-blue-100 text-blue-700' : item.kind === 'DateTime' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>{item.kind}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.outliers ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{item.outliers} outliers</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section id="editable-grid">
            <Card title="Editable Data Grid" subtitle="Search, paginate, add/delete rows and columns, rename fields, and export edits.">
              <EditableDataGrid
                columns={draft.columns}
                rows={draft.data}
                maxRows={24}
                onColumnsChange={columns => setDraft(previous => ({
                  ...previous,
                  columns,
                  target: previous.target && columns.includes(previous.target) ? previous.target : inferTargetColumn(columns),
                }))}
                onChange={data => setDraft(previous => ({ ...previous, data }))}
              />
            </Card>
          </section>

          <InfoBox type="info" title="Implementation Coverage">
            The manager now uses robust CSV/JSON I/O, shared profiling, compatibility checks, target/features, preprocessing undo/redo, version restore, richer saved metadata, safe delete confirmation, storage status, schema tools, and a paginated searchable grid.
          </InfoBox>
        </div>
      </div>
    </div>
  );
}
