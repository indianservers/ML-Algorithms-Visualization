import { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { Download, ScanLine } from "lucide-react";
import type { EChartsOption, SeriesOption } from "echarts";
export type ChartLine = {
  name: string;
  values: number[];
  color: string;
  dashed?: boolean;
  bar?: boolean;
  scatter?: boolean;
};
export function ScientificChart({
  title,
  dates,
  lines,
  height = 300,
  boundary,
  selected,
  windowRange,
  band,
  onSelect,
  group = "ts-lab",
  unit = "Value",
}: {
  title: string;
  dates: string[];
  lines: ChartLine[];
  height?: number;
  boundary?: number;
  selected?: number;
  windowRange?: [number, number];
  band?: { lower: number[]; upper: number[]; offset: number };
  onSelect?: (index: number) => void;
  group?: string;
  unit?: string;
}) {
  const ref = useRef<ReactECharts>(null);
  useEffect(() => {
    const instance = ref.current?.getEchartsInstance();
    if (instance) {
      instance.group = group;
      echarts.connect(group);
    }
    return () => {
      if (instance) instance.group = "";
    };
  }, [group]);
  const range = (months: number) => {
    const last = new Date(dates.at(-1) ?? "");
    if (!Number.isFinite(last.getTime())) return;
    last.setUTCMonth(last.getUTCMonth() - months);
    let index = dates.findIndex((date) => Date.parse(date) >= last.getTime());
    index = Math.max(0, Math.min(dates.length - 2, index));
    ref.current?.getEchartsInstance().dispatchAction({
      type: "dataZoom",
      start: (index / Math.max(1, dates.length - 1)) * 100,
      end: 100,
    });
  };
  const escape = (v: unknown) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const tooltip = (input: unknown) => {
    const entries = (Array.isArray(input) ? input : [input]) as Array<{
      dataIndex: number;
      seriesName: string;
      value: number;
    }>;
    const index = entries[0]?.dataIndex ?? 0;
    let text = "<strong>" + escape(dates[index]) + "</strong>";
    for (const item of entries) {
      if (
        item.seriesName === "Interval lower" ||
        item.seriesName === "Prediction interval"
      )
        continue;
      if (Number.isFinite(item.value))
        text +=
          "<div>" +
          escape(item.seriesName) +
          ": " +
          Number(item.value).toFixed(3) +
          "</div>";
    }
    const at = index - (band?.offset ?? 0);
    if (
      band &&
      Number.isFinite(band.lower[at]) &&
      Number.isFinite(band.upper[at])
    )
      text +=
        "<div>Band: " +
        band.lower[at].toFixed(3) +
        " to " +
        band.upper[at].toFixed(3) +
        "</div>";
    return text;
  };
  const series: SeriesOption[] = lines.map((line, i) => ({
    name: line.name,
    type: line.scatter ? "scatter" : line.bar ? "bar" : "line",
    data: line.values.map((v) => (Number.isFinite(v) ? v : null)),
    symbol: line.scatter ? "circle" : "none",
    symbolSize: line.scatter ? 9 : 0,
    sampling: "lttb",
    connectNulls: false,
    lineStyle: {
      width: i ? 2 : 1.4,
      color: line.color,
      type: line.dashed ? "dashed" : "solid",
    },
    itemStyle: { color: line.color },
    emphasis: { focus: "series" },
    animation: false,
    ...(i === 0
      ? {
          markLine: {
            silent: true,
            symbol: "none",
            label: { color: "#90b5d4", fontSize: 10, formatter: (p) => p.name },
            lineStyle: { color: "#8a9dbd", type: "dashed" },
            data: [
              ...(boundary !== undefined
                ? [{ xAxis: boundary, name: "Forecast origin" }]
                : []),
              ...(selected !== undefined
                ? [{ xAxis: selected, name: "Selected step" }]
                : []),
            ],
          },
          markArea: windowRange
            ? {
                silent: true,
                itemStyle: {
                  color: "#486fff25",
                  borderColor: "#69abff",
                  borderWidth: 1,
                },
                data: [[{ xAxis: windowRange[0] }, { xAxis: windowRange[1] }]],
              }
            : undefined,
        }
      : {}),
  }));
  if (band?.lower.length) {
    const pad = Array(band.offset).fill(null);
    series.push(
      {
        name: "Interval lower",
        type: "line",
        data: [...pad, ...band.lower],
        stack: "interval",
        stackStrategy: "all",
        lineStyle: { opacity: 0 },
        symbol: "none",
        silent: true,
        animation: false,
      },
      {
        name: "Prediction interval",
        type: "line",
        data: [...pad, ...band.upper.map((v, i) => v - band.lower[i])],
        stack: "interval",
        stackStrategy: "all",
        lineStyle: { opacity: 0 },
        areaStyle: { color: "#9765ed", opacity: 0.18 },
        symbol: "none",
        silent: true,
        animation: false,
      },
    );
  }
  const option: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: { fontFamily: "Inter, system-ui, sans-serif", color: "#a9bfdf" },
    animation: false,
    color: lines.map((l) => l.color),
    grid: { left: 58, right: 25, top: 48, bottom: 68 },
    legend: {
      type: "scroll",
      pageIconColor: "#4ea8ff",
      pageTextStyle: { color: "#a7bde0" },
      top: 0,
      left: 0,
      textStyle: { color: "#b9cbea", fontSize: 11 },
      data: lines.map((l) => l.name),
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 3,
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: tooltip,
      backgroundColor: "#071a32",
      borderColor: "#2a527f",
      textStyle: { color: "#e5efff", fontSize: 12 },
      axisPointer: { type: "cross" },
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: "#426080" } },
      axisLabel: {
        color: "#a4bad5",
        fontSize: 10,
        hideOverlap: true,
        formatter: (value) =>
          /^\d{4}-/.test(value) ? value.slice(0, 10) : value,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: unit,
      nameTextStyle: { color: "#96b3d8", fontSize: 10 },
      scale: true,
      splitLine: {
        lineStyle: { color: "#244362", type: "dashed", opacity: 0.65 },
      },
      axisLabel: { color: "#99b4d8", fontSize: 10 },
    },
    dataZoom: [
      { type: "inside", filterMode: "none" },
      {
        type: "slider",
        height: 15,
        bottom: 9,
        borderColor: "#274666",
        backgroundColor: "#071a30",
        fillerColor: "#2868ed33",
        handleStyle: { color: "#459aff" },
        textStyle: { color: "#9bb6d9" },
        filterMode: "none",
      },
    ],
    series,
  };
  return (
    <section className="tsw-panel tsw-chart" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <div className="tsw-chart-tools">
          {[
            [1, "1M"],
            [3, "3M"],
            [6, "6M"],
            [12, "1Y"],
          ].map(([months, label]) => (
            <button key={label} onClick={() => range(Number(months))}>
              {label}
            </button>
          ))}
          <button
            title="Reset zoom"
            aria-label={`Reset zoom: ${title}`}
            onClick={() =>
              ref.current
                ?.getEchartsInstance()
                .dispatchAction({ type: "dataZoom", start: 0, end: 100 })
            }
          >
            <ScanLine size={15} />
          </button>
          <button
            title="Download chart"
            aria-label={`Download chart: ${title}`}
            onClick={() => {
              const url = ref.current?.getEchartsInstance().getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#07152b",
              });
              if (url) {
                const a = document.createElement("a");
                a.href = url;
                a.download = `${title.replaceAll(" ", "-")}.png`;
                a.click();
              }
            }}
          >
            <Download size={15} />
          </button>
        </div>
      </header>
      <ReactECharts
        ref={ref}
        option={option}
        notMerge
        lazyUpdate
        style={{ height }}
        onEvents={{
          click: (event: { dataIndex: number }) => onSelect?.(event.dataIndex),
        }}
      />
      <span className="tsw-chart-hint">
        Hover to inspect · scroll/pinch to zoom · drag the range · click a point
        to select a step
      </span>
    </section>
  );
}

