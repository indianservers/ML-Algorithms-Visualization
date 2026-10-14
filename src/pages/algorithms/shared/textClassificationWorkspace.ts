import { preprocessDocument, type TextPrepOptions } from '../../../lib/nlp/textPrep';
export type TextExample = { text: string; label: string };
export const classColor = (label: string) => {
  const colors = ['#0072b2', '#b45f00', '#00856a', '#8854b8', '#ba4874', '#527c15'];
  return colors[[...label].reduce((n, c) => n + c.charCodeAt(0), 0) % colors.length];
};
export function validateExamples(rows: TextExample[], prep: Partial<TextPrepOptions>) {
  const errors: string[] = [], warnings: string[] = [];
  const seen = new Map<string, string>();
  const counts: Record<string, number> = {};
  rows.forEach((row, i) => {
    if (!row.text.trim() || !row.label.trim()) errors.push(`Example ${i + 1}: text and class are required.`);
    else if (!preprocessDocument(row.text, prep).features.length) errors.push(`Example ${i + 1}: no usable words after preprocessing.`);
    const key = row.text.trim().toLowerCase();
    if (key && seen.has(key)) errors.push(`Example ${i + 1}: ${seen.get(key) === row.label ? 'duplicate text' : 'same text has conflicting classes'}.`);
    seen.set(key, row.label);
    if (row.label.trim()) counts[row.label] = (counts[row.label] ?? 0) + 1;
  });
  if (Object.keys(counts).length < 2) errors.push('Add at least two classes.');
  Object.entries(counts).forEach(([label, count]) => {
    if (count < 2) errors.push(`${label}: needs at least two examples to keep training and test examples.`);
    else if (count < 5) warnings.push(`${label}: only ${count} examples; test results will be unstable.`);
  });
  return { errors, warnings, counts };
}
