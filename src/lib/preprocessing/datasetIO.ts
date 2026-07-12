import type { DataRow } from './dataProfile';

export interface ParsedDataset {
  columns: string[];
  data: DataRow[];
}

export function isMissingValue(value: unknown) {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

export function displayCellValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function cloneDataset<T extends { columns: string[]; data: DataRow[] }>(dataset: T): T {
  return {
    ...dataset,
    columns: [...dataset.columns],
    data: dataset.data.map(row => ({ ...row })),
  };
}

export function dedupeColumnNames(columns: string[]) {
  const seen = new Map<string, number>();
  return columns.map((column, index) => {
    const trimmed = column.trim() || `column_${index + 1}`;
    const count = seen.get(trimmed) ?? 0;
    seen.set(trimmed, count + 1);
    return count === 0 ? trimmed : `${trimmed}_${count + 1}`;
  });
}

export function coerceCellValue(value: string) {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(trimmed) ? numeric : trimmed;
}

export function parseCSV(text: string): ParsedDataset {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some(value => value.trim() !== '')) rows.push(row);
  }

  if (!rows.length) return { columns: [], data: [] };
  const columns = dedupeColumnNames(rows[0]);
  const data = rows.slice(1).map(values =>
    Object.fromEntries(columns.map((column, columnIndex) => [column, coerceCellValue(values[columnIndex] ?? '')])),
  );
  return { columns, data };
}

export function escapeCSV(value: unknown) {
  const text = displayCellValue(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(columns: string[], data: DataRow[]) {
  return [
    columns.map(escapeCSV).join(','),
    ...data.map(row => columns.map(column => escapeCSV(row[column])).join(',')),
  ].join('\n');
}

export function parseJSONDataset(text: string): ParsedDataset {
  const parsed = JSON.parse(text) as unknown;
  const source = Array.isArray(parsed)
    ? { data: parsed }
    : parsed && typeof parsed === 'object'
      ? parsed as { columns?: unknown; data?: unknown }
      : null;

  if (!source || !Array.isArray(source.data)) {
    throw new Error('JSON must be an array of rows or an object with a data array.');
  }

  const data = source.data.map(row => row && typeof row === 'object' ? { ...row as DataRow } : { value: row });
  const sourceColumns = Array.isArray(source.columns) ? source.columns.map(String) : [];
  const columns = dedupeColumnNames(sourceColumns.length ? sourceColumns : Array.from(new Set(data.flatMap(row => Object.keys(row)))));
  return { columns, data };
}

export function validateParsedDataset(dataset: ParsedDataset) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!dataset.columns.length) errors.push('No columns were found.');
  if (!dataset.data.length) warnings.push('No data rows were found.');
  const duplicateLabels = dataset.columns.filter((column, index) => dataset.columns.indexOf(column) !== index);
  if (duplicateLabels.length) warnings.push(`Duplicate columns were renamed: ${Array.from(new Set(duplicateLabels)).join(', ')}.`);
  const sparseRows = dataset.data.filter(row => dataset.columns.every(column => isMissingValue(row[column]))).length;
  if (sparseRows) warnings.push(`${sparseRows} empty row(s) were ignored or loaded as blank records.`);
  return { errors, warnings };
}

export function inferTargetColumn(columns: string[], preferred?: string) {
  if (preferred && columns.includes(preferred)) return preferred;
  return columns.find(column => /^(label|class|target|category|species|approved|churned|fraud|rating|reward)$/i.test(column))
    ?? columns.find(column => /label|class|target|category|species|approved|churn|fraud|risk|price|sales|demand|reward|rating/i.test(column))
    ?? columns.at(-1)
    ?? '';
}

export function rowKey(row: DataRow, columns: string[]) {
  return JSON.stringify(columns.map(column => displayCellValue(row[column]).trim()));
}
