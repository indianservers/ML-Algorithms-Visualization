import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, ClipboardCheck, Database, Download, FileText, Filter, Grid3X3, LineChart, Save, Search, Sparkles, Table2, Trash2, Upload } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { allSampleDatasets } from '../../../data/sampleDatasets';
import { getAlgorithmSampleDatasets } from '../../../data/algorithmDatasets';
import { getAllAlgorithms } from '../../../data/implementationStatus';
import { deleteDataset, loadDatasets, saveDataset, SavedDataset } from '../../../stores/experimentStore';
import { EditableDataGrid } from '../../../components/dataset/EditableDataGrid';

type Row = Record<string, unknown>;
const ACTIVE_DATASETS_KEY = 'mlSuite.activeAlgorithmDatasets';
const DATASET_VERSION_KEY = 'mlSuite.datasetVersionHistory';

const topMenu = [
  { label: 'Saved', id: 'saved-datasets', icon: Database },
  { label: 'Create', id: 'create-dataset', icon: Upload },
  { label: 'Preprocess', id: 'preprocessing-steps', icon: Filter },
  { label: 'Quality', id: 'quality-inspector', icon: ClipboardCheck },
  { label: 'Grid', id: 'editable-grid', icon: Grid3X3 },
  { label: 'Export', id: 'export-dataset', icon: Download },
  { label: 'Enhancements', id: 'ui-enhancements', icon: Sparkles },
];

const workflowSteps = [
  'Pick a saved dataset, upload CSV/JSON, or start from an algorithm sample.',
  'Clean the draft with preprocessing actions, then inspect quality warnings.',
  'Save and load the dataset for the selected algorithm from the top menu flow.',
];

const preprocessingSteps = [
  'Trim extra spaces from text cells',
  'Fill missing numeric values with the column mean',
  'Fill missing categorical values with the most common value',
  'Remove duplicate rows',
  'Remove IQR outlier rows',
  'Scale numeric columns to 0-1',
  'Encode categorical columns as integer labels',
  'Confirm target column and class balance',
  'Save a clean browser-local version',
  'Load the clean version into the selected algorithm',
];

const uiEnhancementGroups = [
  {
    title: 'Top Menu and Navigation',
    items: [
      'Sticky top menu for Saved, Create, Preprocess, Quality, Grid, Export, and Enhancements',
      'Short labels that match the learner workflow',
      'Icons on every primary navigation action',
      'Visible active dataset state',
      'One-click return to the selected algorithm',
      'Clear next-step buttons after save/load',
      'Mobile-friendly top anchors',
      'Search box before saved dataset list',
      'Saved datasets shown before samples',
      'No duplicate side navigation inside the page',
    ],
  },
  {
    title: 'Dataset Understanding',
    items: [
      'Beginner workflow summary',
      'Rows, columns, missing, numeric, and categorical counters',
      'Plain-language health status',
      'Column type detection',
      'Suspicious type warnings',
      'Missing value heatmap',
      'Class balance chart',
      'Duplicate row count',
      'Outlier count per column',
      'Target-column hints',
    ],
  },
  {
    title: 'Preprocessing',
    items: [
      'Trim whitespace action',
      'Fill numeric missing values with mean',
      'Fill categorical missing values with mode',
      'Remove duplicate rows',
      'Remove IQR outlier rows',
      'Min-max scale numeric features',
      'Label encode categorical columns',
      'Preprocessing checklist',
      'Action result messages',
      'Draft-only changes until save',
    ],
  },
  {
    title: 'Editing and Saving',
    items: [
      'Editable data grid',
      'Rename dataset before saving',
      'Tag datasets for search',
      'Save to IndexedDB',
      'Save and load into selected algorithm',
      'Delete saved datasets',
      'Version history stored locally',
      'CSV import',
      'JSON import',
      'Browser-only privacy-friendly workflow',
    ],
  },
  {
    title: 'Export and Reuse',
    items: [
      'Download CSV',
      'Download JSON',
      'Open preprocessing lessons',
      'Open algorithm comparison dashboard',
      'Open selected visualization route',
      'Reusable algorithm dataset event',
      'Quality warning before training',
      'Compact cards for scanning',
      'Accessible button labels',
      'Responsive layout for classroom use',
    ],
  },
];

function parseCSV(text: string): { columns: string[]; data: Row[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const columns = lines[0]?.split(',').map(item => item.trim()) ?? [];
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    return Object.fromEntries(columns.map((col, i) => [col, values[i]?.trim() === '' ? null : values[i]?.trim() ?? null]));
  });
  return { columns, data };
}

function toCSV(columns: string[], data: Row[]) {
  return [columns.join(','), ...data.map(row => columns.map(col => row[col] ?? '').join(','))].join('\n');
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isMissing(value: unknown) {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

function numericValues(rows: Row[], column: string) {
  return rows.map(row => Number(row[column])).filter(value => Number.isFinite(value));
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}

export default function DatasetManagerPage() {
  const navigate = useNavigate();
  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const [algorithmRoute, setAlgorithmRoute] = useState('/ml/supervised/logistic-regression');
  const selectedAlgorithm = algorithms.find(item => item.route === algorithmRoute) ?? algorithms[0];
  const algorithmSamples = useMemo(() =>
    getAlgorithmSampleDatasets(selectedAlgorithm.route, selectedAlgorithm.category),
  [selectedAlgorithm]);
  const [saved, setSaved] = useState<SavedDataset[]>([]);
  const [selectedId, setSelectedId] = useState(algorithmSamples[0]?.id ?? allSampleDatasets[0].id);
  const [name, setName] = useState(algorithmSamples[0]?.name ?? allSampleDatasets[0].name);
  const [tags, setTags] = useState('sample, local');
  const [draft, setDraft] = useState<{ columns: string[]; data: Row[] }>({
    columns: algorithmSamples[0]?.columns ?? allSampleDatasets[0].columns,
    data: algorithmSamples[0]?.data ?? allSampleDatasets[0].data,
  });
  const [message, setMessage] = useState('');
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [savedSearch, setSavedSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => setSaved(await loadDatasets());
  useEffect(() => {
    let active = true;
    loadDatasets().then(items => {
      if (active) setSaved(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const profile = useMemo(() => {
    const missing = draft.data.reduce((sum, row) => sum + draft.columns.filter(col => row[col] === null || row[col] === undefined || row[col] === '').length, 0);
    const numeric = draft.columns.filter(col => draft.data.some(row => !Number.isNaN(Number(row[col])) && row[col] !== null && row[col] !== '')).length;
    return { rows: draft.data.length, columns: draft.columns.length, missing, numeric, categorical: draft.columns.length - numeric };
  }, [draft]);

  const quality = useMemo(() => {
    const labelColumn = draft.columns.find(col => ['label', 'class', 'target', 'category'].includes(col.toLowerCase()));
    const classCounts = labelColumn
      ? Object.entries(draft.data.reduce<Record<string, number>>((counts, row) => {
        const key = String(row[labelColumn] ?? 'missing');
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {})).map(([label, count]) => ({ label, count }))
      : [];
    const missingCells = draft.data.reduce((sum, row) => sum + draft.columns.filter(col => isMissing(row[col])).length, 0);
    const totalCells = Math.max(1, draft.data.length * draft.columns.length);
    const duplicateMap = new Map<string, number>();
    draft.data.forEach(row => {
      const key = JSON.stringify(draft.columns.map(col => String(row[col] ?? '').trim()));
      duplicateMap.set(key, (duplicateMap.get(key) ?? 0) + 1);
    });
    const duplicateRows = [...duplicateMap.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const types = draft.columns.map(column => {
      const present = draft.data.map(row => row[column]).filter(value => !isMissing(value));
      const numeric = present.length > 0 && present.every(value => Number.isFinite(Number(value)));
      const datetime = present.length > 0 && present.every(value => !Number.isNaN(Date.parse(String(value))));
      const kind = numeric ? 'Numeric' : datetime ? 'DateTime' : present.some(value => String(value).length > 40) ? 'Text' : 'Categorical';
      const values = numericValues(draft.data, column);
      const q1 = percentile(values, 0.25);
      const q3 = percentile(values, 0.75);
      const iqr = q3 - q1;
      const outliers = values.filter(value => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length;
      const suspicious = /age|price|amount|score|income|weight|height/i.test(column) && !numeric;
      return { column, kind, outliers, suspicious };
    });
    const counts = classCounts.map(item => item.count);
    const minClass = Math.min(...counts, Infinity);
    const maxClass = Math.max(...counts, 0);
    const imbalanceRatio = counts.length ? maxClass / Math.max(1, minClass) : 1;
    const missingRate = missingCells / totalCells;
    const duplicateRate = duplicateRows / Math.max(1, draft.data.length);
    const health = imbalanceRatio > 3 || missingRate > 0.15 || duplicateRate > 0.1
      ? 'Poor'
      : imbalanceRatio > 1.5 || missingRate > 0.05 || duplicateRate > 0.02 ? 'Fair' : 'Good';
    return { labelColumn, classCounts, missingCells, missingRate, duplicateRows, duplicateRate, types, imbalanceRatio, health };
  }, [draft]);

  const loadSample = (id: string) => {
    const dataset = algorithmSamples.find(item => item.id === id) ?? allSampleDatasets.find(item => item.id === id) ?? allSampleDatasets[0];
    setSelectedId(id);
    setName(dataset.name);
    setDraft({ columns: dataset.columns, data: dataset.data });
  };

  const setActiveDataset = (dataset: SavedDataset, route = '/ml/lab/dataset-manager') => {
    const current = JSON.parse(localStorage.getItem(ACTIVE_DATASETS_KEY) ?? '{}') as Record<string, unknown>;
    current[route] = {
      id: dataset.id,
      name: dataset.name,
      description: `${dataset.data.length} saved rows from your browser storage.`,
      columns: dataset.columns,
      data: dataset.data,
      kind: 'upload',
    };
    localStorage.setItem(ACTIVE_DATASETS_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('ml:algorithm-dataset-loaded', { detail: { route, dataset } }));
    setActiveDatasetId(dataset.id);
  };

  const loadSavedDataset = (dataset: SavedDataset, shouldNavigate = false) => {
    setName(dataset.name);
    setTags(dataset.tags?.join(', ') || 'saved, local');
    setDraft({ columns: dataset.columns, data: dataset.data });
    setActiveDataset(dataset);
    setMessage(`${dataset.name} is active.`);
    if (shouldNavigate) navigate('/ml/lab/dataset-manager');
  };

  const loadAlgorithm = (route: string) => {
    const algorithm = algorithms.find(item => item.route === route) ?? algorithms[0];
    const samples = getAlgorithmSampleDatasets(algorithm.route, algorithm.category);
    const dataset = samples[0] ?? allSampleDatasets[0];
    setAlgorithmRoute(route);
    setSelectedId(dataset.id);
    setName(dataset.name);
    setTags(`${algorithm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, sample, local`);
    setDraft({ columns: dataset.columns, data: dataset.data });
  };

  const handleUpload = async (file: File) => {
    const text = await file.text();
    if (file.name.endsWith('.json')) {
      const parsed = JSON.parse(text);
      const data = Array.isArray(parsed) ? parsed : parsed.data;
      const columns = parsed.columns ?? Object.keys(data[0] ?? {});
      setDraft({ columns, data });
    } else {
      setDraft(parseCSV(text));
    }
    setName(file.name.replace(/\.(csv|json)$/i, ''));
  };

  const handleSave = async () => {
    const dataset: SavedDataset = {
      id: `dataset_${Date.now()}`,
      name,
      columns: draft.columns,
      data: draft.data,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      savedAt: Date.now(),
    };
    await saveDataset(dataset);
    const versions = JSON.parse(localStorage.getItem(DATASET_VERSION_KEY) ?? '[]') as Array<{ id: string; name: string; rows: number; columns: number; savedAt: number }>;
    localStorage.setItem(DATASET_VERSION_KEY, JSON.stringify([{ id: dataset.id, name: dataset.name, rows: dataset.data.length, columns: dataset.columns.length, savedAt: dataset.savedAt }, ...versions].slice(0, 20)));
    setMessage('Dataset saved to IndexedDB');
    await refresh();
    return dataset;
  };

  const handleSaveAndLoad = async () => {
    const dataset = await handleSave();
    setActiveDataset(dataset, algorithmRoute);
    setActiveDatasetId(dataset.id);
    setMessage(`${dataset.name} saved and loaded for ${selectedAlgorithm.label}`);
  };

  const removeDuplicateRows = () => {
    const seen = new Set<string>();
    setDraft(previous => ({
      ...previous,
      data: previous.data.filter(row => {
        const key = JSON.stringify(previous.columns.map(col => String(row[col] ?? '').trim()));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }));
    setMessage('Duplicate rows removed from the current draft.');
  };

  const trimTextCells = () => {
    setDraft(previous => ({
      ...previous,
      data: previous.data.map(row => Object.fromEntries(previous.columns.map(column => {
        const value = row[column];
        return [column, typeof value === 'string' ? value.trim() : value];
      }))),
    }));
    setMessage('Text cells trimmed in the current draft.');
  };

  const fillMissingValues = () => {
    setDraft(previous => {
      const replacements = Object.fromEntries(previous.columns.map(column => {
        const present = previous.data.map(row => row[column]).filter(value => !isMissing(value));
        const numeric = present.length > 0 && present.every(value => Number.isFinite(Number(value)));
        if (numeric) {
          const values = present.map(Number);
          const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
          return [column, Number(mean.toFixed(4))];
        }
        const counts = present.reduce<Record<string, number>>((items, value) => {
          const key = displayValue(value);
          items[key] = (items[key] ?? 0) + 1;
          return items;
        }, {});
        const mode = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
        return [column, mode];
      }));
      return {
        ...previous,
        data: previous.data.map(row => Object.fromEntries(previous.columns.map(column => [
          column,
          isMissing(row[column]) ? replacements[column] : row[column],
        ]))),
      };
    });
    setMessage('Missing values filled with mean or most common values.');
  };

  const scaleNumericColumns = () => {
    setDraft(previous => {
      const numericColumns = previous.columns.filter(column => {
        const present = previous.data.map(row => row[column]).filter(value => !isMissing(value));
        return present.length > 0 && present.every(value => Number.isFinite(Number(value)));
      });
      const ranges = Object.fromEntries(numericColumns.map(column => {
        const values = numericValues(previous.data, column);
        return [column, { min: Math.min(...values), max: Math.max(...values) }];
      }));
      return {
        ...previous,
        data: previous.data.map(row => ({
          ...row,
          ...Object.fromEntries(numericColumns.map(column => {
            const { min, max } = ranges[column];
            const spread = max - min;
            const scaled = spread === 0 ? 0 : (Number(row[column]) - min) / spread;
            return [column, Number(scaled.toFixed(4))];
          })),
        })),
      };
    });
    setMessage('Numeric columns scaled from 0 to 1.');
  };

  const encodeCategoricalColumns = () => {
    setDraft(previous => {
      const categoricalColumns = previous.columns.filter(column => {
        const present = previous.data.map(row => row[column]).filter(value => !isMissing(value));
        return present.length > 0 && !present.every(value => Number.isFinite(Number(value)));
      });
      const maps = Object.fromEntries(categoricalColumns.map(column => {
        const values = Array.from(new Set(previous.data.map(row => displayValue(row[column])).filter(Boolean))).sort();
        return [column, Object.fromEntries(values.map((value, index) => [value, index])) as Record<string, number>];
      }));
      return {
        ...previous,
        data: previous.data.map(row => ({
          ...row,
          ...Object.fromEntries(categoricalColumns.map(column => [column, maps[column][displayValue(row[column])] ?? null])),
        })),
      };
    });
    setMessage('Categorical columns encoded as integer labels.');
  };

  const removeOutlierRows = () => {
    setDraft(previous => {
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
          if (!Number.isFinite(value)) return true;
          return value >= fences[column].low && value <= fences[column].high;
        })),
      };
    });
    setMessage('Rows with IQR outliers removed from the current draft.');
  };

  const filteredSaved = saved.filter(dataset => {
    const text = `${dataset.name} ${dataset.tags?.join(' ') ?? ''} ${dataset.columns.join(' ')}`.toLowerCase();
    return text.includes(savedSearch.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Dataset Manager" subtitle="Use the top menu: choose data, preprocess it, inspect quality, edit rows, save, then load into an algorithm." badge="Beginner" category="Lab" icon={<Database size={22} />} />

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

      <section className="grid gap-3 md:grid-cols-3" aria-label="Dataset manager workflow">
        {workflowSteps.map((step, index) => (
          <div key={step} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-blue-600 text-xs font-black text-white">{index + 1}</span>
            <p className="font-semibold text-gray-700 dark:text-gray-200">{step}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <section id="saved-datasets">
          <Card title="Saved Datasets" subtitle="Start here when you already saved a clean dataset.">
            <div className="space-y-2">
              <label className="flex min-h-10 items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                <Search size={14} className="shrink-0 text-gray-400" />
              <input
                value={savedSearch}
                onChange={event => setSavedSearch(event.target.value)}
                placeholder="Search saved datasets"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              </label>
              {filteredSaved.map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => loadSavedDataset(dataset, true)}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors ${
                    activeDatasetId === dataset.id
                      ? 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{dataset.name}</span>
                    <span className="block text-xs text-gray-500">{dataset.data.length} rows, {dataset.columns.length} columns</span>
                  </span>
                  <Upload size={14} className="shrink-0" />
                </button>
              ))}
              {saved.length === 0 && (
                <p className="text-sm text-gray-500">No saved datasets yet. Upload a CSV/JSON file or save one of the samples below.</p>
              )}
              {saved.length > 0 && filteredSaved.length === 0 && (
                <p className="text-sm text-gray-500">No saved datasets match this search.</p>
              )}
            </div>
          </Card>
          </section>

          <section id="create-dataset">
          <Card title="Upload and Save" subtitle="Choose an algorithm first so sample data and save/load behavior are aligned.">
            <div className="space-y-3 text-sm">
              <select value={algorithmRoute} onChange={event => loadAlgorithm(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                {algorithms.map(algorithm => <option key={algorithm.route} value={algorithm.route}>{algorithm.category} - {algorithm.label}</option>)}
              </select>
              <select value={selectedId} onChange={event => loadSample(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                {algorithmSamples.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
              </select>
              <input value={name} onChange={event => setName(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" />
              <input value={tags} onChange={event => setTags(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" placeholder="tags" />
              <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={event => event.target.files?.[0] && handleUpload(event.target.files[0])} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"><Upload size={14} /> Upload</button>
                <button onClick={handleSave} className="flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 font-semibold text-white"><Save size={14} /> Save</button>
              </div>
              <button onClick={handleSaveAndLoad} className="flex min-h-10 w-full items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 font-semibold text-white">
                Save & Load for Selected Algorithm
              </button>
              {message && <p className="text-xs text-green-600">{message}</p>}
            </div>
          </Card>
          </section>

          <Card title="Data Profile">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(profile).map(([key, value]) => (
                <div key={key} className="rounded bg-gray-50 p-2 dark:bg-gray-900">
                  <p className="text-xs capitalize text-gray-500">{key}</p>
                  <p className="font-mono text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <section id="export-dataset">
          <Card title="Export">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button onClick={() => download(`${name}.csv`, toCSV(draft.columns, draft.data), 'text/csv')} className="flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"><Download size={14} /> CSV</button>
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

          <section id="preprocessing-steps">
          <Card title="Preprocessing Steps" subtitle="These actions update the current draft. Save after you like the result.">
            <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button onClick={trimTextCells} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30"><FileText size={14} /> Trim text</button>
                <button onClick={fillMissingValues} disabled={quality.missingCells === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><CheckCircle2 size={14} /> Fill missing</button>
                <button onClick={removeDuplicateRows} disabled={quality.duplicateRows === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><Grid3X3 size={14} /> Remove duplicates</button>
                <button onClick={removeOutlierRows} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-amber-300 hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-amber-950/20"><Filter size={14} /> Remove outliers</button>
                <button onClick={scaleNumericColumns} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30"><BarChart3 size={14} /> Scale numeric</button>
                <button onClick={encodeCategoricalColumns} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-950/20"><ClipboardCheck size={14} /> Encode categories</button>
              </div>
              <ol className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {preprocessingSteps.map(step => (
                  <li key={step} className="flex gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
          </section>

          <section id="quality-inspector">
          <Card title="Quality Inspector" subtitle="Class balance, missing values, duplicates, outliers, and inferred column types">
            <div className="grid gap-3 md:grid-cols-4">
              <div className={`rounded p-3 ${quality.health === 'Good' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-200' : quality.health === 'Fair' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-200' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-200'}`}>
                <p className="text-xs font-bold uppercase">Dataset Health</p>
                <p className="text-2xl font-black">{quality.health}</p>
              </div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Missing cells</p><p className="text-2xl font-black">{quality.missingCells}</p><p className="text-xs">{(quality.missingRate * 100).toFixed(1)}%</p></div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Duplicate rows</p><p className="text-2xl font-black">{quality.duplicateRows}</p><p className="text-xs">{(quality.duplicateRate * 100).toFixed(1)}%</p></div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Class ratio</p><p className="text-2xl font-black">{quality.imbalanceRatio.toFixed(1)}x</p><p className="text-xs">{quality.labelColumn ?? 'no label column'}</p></div>
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
                    {draft.data.slice(0, 20).flatMap((row, rowIndex) => draft.columns.map(col => <span key={`${rowIndex}-${col}`} title={`${rowIndex + 1}: ${col}`} className={`h-4 rounded-sm ${isMissing(row[col]) ? 'bg-red-500' : 'bg-green-500'}`} />))}
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">Column Types and Outliers</p>
                  <button onClick={removeDuplicateRows} disabled={quality.duplicateRows === 0} className="rounded border border-gray-200 px-2 py-1 text-xs font-bold disabled:opacity-50 dark:border-gray-700">Remove duplicates</button>
                </div>
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {quality.types.map(item => (
                    <div key={item.column} className="flex items-center justify-between gap-3 rounded bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
                      <span className="min-w-0 truncate font-semibold">{item.column}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.kind === 'Numeric' ? 'bg-blue-100 text-blue-700' : item.kind === 'DateTime' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>{item.kind}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.outliers ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{item.outliers} outliers</span>
                      {item.suspicious && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">check type</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          </section>

          <section id="editable-grid">
          <Card title="Editable Data Grid">
            <EditableDataGrid
              columns={draft.columns}
              rows={draft.data}
              maxRows={draft.data.length}
              onColumnsChange={columns => setDraft(previous => ({ ...previous, columns }))}
              onChange={data => setDraft(previous => ({ ...previous, data }))}
            />
          </Card>
          </section>

          <Card title="Saved IndexedDB Datasets">
            <div className="space-y-2">
              {filteredSaved.map(dataset => (
                <div key={dataset.id} className="flex flex-col gap-3 rounded border border-gray-200 p-3 text-sm dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => loadSavedDataset(dataset)} className="min-w-0 text-left">
                    <p className="font-semibold">{dataset.name}</p>
                    <p className="text-xs text-gray-500">{dataset.data.length} rows, {dataset.columns.length} columns, tags: {dataset.tags?.join(', ') || 'none'}</p>
                  </button>
                  <button onClick={async () => { await deleteDataset(dataset.id); await refresh(); }} className="grid min-h-10 min-w-10 place-items-center self-start rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 sm:self-auto" aria-label={`Delete ${dataset.name}`}><Trash2 size={16} /></button>
                </div>
              ))}
              {saved.length === 0 && <p className="text-sm text-gray-500">No saved datasets yet.</p>}
            </div>
          </Card>

          <InfoBox type="info" title="Real Logic Cross-Check">
            CSV/JSON files are parsed in the browser, data is profiled from actual cells, saves go to IndexedDB through the shared store, and delete/export operations run locally.
          </InfoBox>

          <section id="ui-enhancements">
          <Card title="50 UI Enhancements" subtitle="A practical checklist for making the Dataset Manager easier to understand and navigate.">
            <div className="grid gap-3 md:grid-cols-2">
              {uiEnhancementGroups.map(group => (
                <div key={group.title} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">{group.title}</h3>
                  <ol className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    {group.items.map(item => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
