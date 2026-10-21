import { i18n, translateText } from "./config";
/** Clone presentation branches only. Preserve data, series names/IDs, coordinates and formatter callbacks. */
export function localizeChartOption<T>(option: T): T {
  if (!option || typeof option !== "object") return option;
  if (i18n.language === "en-IN") return option;
  const output = { ...option } as Record<string, unknown>;
  const map = (
    value: unknown,
    convert: (record: Record<string, unknown>) => Record<string, unknown>,
  ): unknown =>
    Array.isArray(value)
      ? value.map((item) => map(item, convert))
      : value && typeof value === "object"
        ? convert(value as Record<string, unknown>)
        : value;
  output.title = map(output.title, (record) => ({
    ...record,
    ...(typeof record.text === "string"
      ? { text: translateText(record.text) }
      : {}),
    ...(typeof record.subtext === "string"
      ? { subtext: translateText(record.subtext) }
      : {}),
  }));
  for (const axis of [
    "xAxis",
    "yAxis",
    "radiusAxis",
    "angleAxis",
    "parallelAxis",
  ]) {
    if (output[axis])
      output[axis] = map(output[axis], (record) => ({
        ...record,
        ...(typeof record.name === "string"
          ? { name: translateText(record.name) }
          : {}),
      }));
  }
  if (output.legend)
    output.legend = map(output.legend, (record) => ({
      ...record,
      formatter: (name: string) =>
        translateText(
          typeof record.formatter === "function"
            ? record.formatter(name)
            : typeof record.formatter === "string"
              ? record.formatter.replaceAll("{name}", name)
              : name,
        ),
    }));
  return output as T;
}

/** Preserve user-controlled zoom and legend visibility during a label-only update. */
export function preserveChartView<T>(option: T, current: Record<string, unknown>): T {
  const output = { ...option } as Record<string, unknown>;
  for (const [branch, fields] of [["dataZoom", ["start", "end", "startValue", "endValue"]], ["legend", ["selected"]]] as const) {
    const previous = Array.isArray(current[branch]) ? current[branch] as Record<string, unknown>[] : current[branch] ? [current[branch] as Record<string, unknown>] : [];
    if (!output[branch] || !previous.length) continue;
    const merge = (record: Record<string, unknown>, index: number) => {
      const saved = record.id ? previous.find(item => item.id === record.id) ?? previous[index] : previous[index];
      return { ...record, ...Object.fromEntries(fields.filter(field => saved?.[field] !== undefined).map(field => [field, saved[field]])) };
    };
    output[branch] = Array.isArray(output[branch]) ? (output[branch] as Record<string, unknown>[]).map(merge) : merge(output[branch] as Record<string, unknown>, 0);
  }
  return output as T;
}
