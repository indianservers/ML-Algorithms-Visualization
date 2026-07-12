import React from 'react';
import { ChevronLeft, ChevronRight, Columns3, Download, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import type { DataRow } from '../../lib/preprocessing/dataProfile';
import { toCSV } from '../../lib/preprocessing/datasetIO';

interface EditableDataGridProps {
  rows: DataRow[];
  onChange: (rows: DataRow[]) => void;
  columns?: string[];
  onColumnsChange?: (columns: string[]) => void;
  maxRows?: number;
}

export function EditableDataGrid({ rows, onChange, columns: providedColumns, onColumnsChange, maxRows = 12 }: EditableDataGridProps) {
  const [history, setHistory] = React.useState<DataRow[][]>([]);
  const [page, setPage] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [newColumnName, setNewColumnName] = React.useState('');
  const columns = providedColumns?.length ? providedColumns : Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  const pageSize = Math.max(8, Math.min(100, maxRows));
  const filteredRows = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows.map((row, index) => ({ row, index }));
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => columns.some(column => String(row[column] ?? '').toLowerCase().includes(normalized)));
  }, [columns, query, rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = filteredRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const update = (next: DataRow[]) => {
    setHistory(previous => [rows, ...previous].slice(0, 20));
    onChange(next);
  };
  const addRow = () => update([...rows, Object.fromEntries(columns.map(column => [column, '']))]);
  const deleteRow = (index: number) => update(rows.filter((_, rowIndex) => rowIndex !== index));
  const updateCell = (rowIndex: number, column: string, value: string) => update(rows.map((row, index) => index === rowIndex ? { ...row, [column]: Number.isFinite(Number(value)) && value.trim() !== '' ? Number(value) : value } : row));
  const addColumn = () => {
    const name = newColumnName.trim();
    if (!name || columns.includes(name)) return;
    setHistory(previous => [rows, ...previous].slice(0, 20));
    onColumnsChange?.([...columns, name]);
    onChange(rows.map(row => ({ ...row, [name]: '' })));
    setNewColumnName('');
  };
  const deleteColumn = (column: string) => {
    const nextColumns = columns.filter(item => item !== column);
    const nextRows = rows.map(row => {
      const next = { ...row };
      delete next[column];
      return next;
    });
    setHistory(previous => [rows, ...previous].slice(0, 20));
    onColumnsChange?.(nextColumns);
    onChange(nextRows);
  };
  const renameColumn = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const nextColumns = columns.map(column => column === oldName ? newName : column);
    const nextRows = rows.map(row => {
      const next: DataRow = {};
      Object.entries(row).forEach(([key, value]) => { next[key === oldName ? newName : key] = value; });
      return next;
    });
    setHistory(previous => [rows, ...previous].slice(0, 20));
    onColumnsChange?.(nextColumns);
    onChange(nextRows);
  };
  const downloadCsv = () => {
    const url = URL.createObjectURL(new Blob([toCSV(columns, rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dataset-edits.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as DataRow[];
    if (Array.isArray(parsed)) update(parsed);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button onClick={addRow} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold dark:border-gray-700"><Plus size={13} /> Row</button>
        <button disabled={!history.length} onClick={() => { const [last, ...rest] = history; if (last) { onChange(last); setHistory(rest); } }} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold disabled:opacity-40 dark:border-gray-700"><RotateCcw size={13} /> Undo</button>
        <button onClick={downloadCsv} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold dark:border-gray-700"><Download size={13} /> CSV</button>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold dark:border-gray-700">
          <Upload size={13} /> JSON
          <input type="file" accept="application/json,.json" className="hidden" onChange={event => importJson(event.target.files?.[0])} />
        </label>
        <label className="ml-auto flex min-h-8 min-w-44 items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700">
          <Search size={13} className="text-gray-400" />
          <input value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Find cells" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="flex min-h-8 min-w-52 items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700">
          <Columns3 size={13} className="text-gray-400" />
          <input value={newColumnName} onChange={event => setNewColumnName(event.target.value)} placeholder="New column" className="min-w-0 flex-1 bg-transparent outline-none" onKeyDown={event => { if (event.key === 'Enter') addColumn(); }} />
        </label>
        <button onClick={addColumn} disabled={!newColumnName.trim() || columns.includes(newColumnName.trim())} className="inline-flex min-h-8 items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold disabled:opacity-40 dark:border-gray-700"><Plus size={13} /> Column</button>
        <span className="text-[11px] text-gray-500">{filteredRows.length} matching row(s), {columns.length} column(s)</span>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 bg-gray-50 p-1 dark:bg-gray-800" />
              {columns.map(column => (
                <th key={column} className="sticky top-0 min-w-28 bg-gray-50 p-1 dark:bg-gray-800">
                  <input aria-label={`Rename ${column}`} className="w-full rounded border border-gray-200 bg-white px-1 py-0.5 font-semibold dark:border-gray-700 dark:bg-gray-900" defaultValue={column} onBlur={event => renameColumn(column, event.target.value)} />
                  <button onClick={() => deleteColumn(column)} className="mt-1 rounded px-1 py-0.5 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ row, index }) => (
              <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-1"><button aria-label={`Delete row ${index + 1}`} onClick={() => deleteRow(index)} className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button></td>
                {columns.map(column => (
                  <td key={column} className="p-1">
                    <input aria-label={`${column} row ${index + 1}`} className="w-full rounded border border-gray-200 bg-white px-1 py-0.5 font-mono dark:border-gray-700 dark:bg-gray-900" value={String(row[column] ?? '')} onChange={event => updateCell(index, column, event.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
        <span>Showing {visibleRows.length ? safePage * pageSize + 1 : 0}-{Math.min((safePage + 1) * pageSize, filteredRows.length)} of {filteredRows.length} row(s).</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(value => Math.max(0, value - 1))} disabled={safePage === 0} className="grid min-h-8 min-w-8 place-items-center rounded border border-gray-200 disabled:opacity-40 dark:border-gray-700" aria-label="Previous grid page"><ChevronLeft size={13} /></button>
          <span className="px-2 font-mono">{safePage + 1}/{pageCount}</span>
          <button onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} disabled={safePage >= pageCount - 1} className="grid min-h-8 min-w-8 place-items-center rounded border border-gray-200 disabled:opacity-40 dark:border-gray-700" aria-label="Next grid page"><ChevronRight size={13} /></button>
        </div>
      </div>
    </div>
  );
}
