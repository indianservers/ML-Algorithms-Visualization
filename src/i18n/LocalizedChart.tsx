import { useCallback, useEffect, useRef, type ElementType } from "react";
import { useTranslation } from "react-i18next";
import { i18n } from "./config";
import { localizeChartOption, preserveChartView } from "./chart-labels";
type ChartInstance = { getOption: () => Record<string, unknown>; setOption: (option: unknown, notMerge: boolean) => void; isDisposed?: () => boolean };
export function LocalizedChart({
  component,
  original,
}: {
  component: ElementType;
  original: Record<string, unknown>;
}) {
  const { t } = useTranslation("common", { i18n, useSuspense: false });
  const option = original.option, originalReady = original.onChartReady;
  const chart = useRef<ChartInstance | null>(null), translated = useRef(false);
  const applyLabels = useCallback((instance: ChartInstance) => {
    if (instance.isDisposed?.()) return;
    if (i18n.language === "en-IN" && !translated.current) return;
    const view = instance.getOption();
    instance.setOption(preserveChartView(localizeChartOption(option), view), false);
    translated.current = i18n.language !== "en-IN";
  }, [option]);
  useEffect(() => { if (chart.current) applyLabels(chart.current); }, [applyLabels, t]);
  const ready = useCallback((instance: ChartInstance) => {
    chart.current = instance; applyLabels(instance);
    if (typeof originalReady === "function") originalReady(instance);
  }, [applyLabels, originalReady]);
  const Component = component;
  return <Component {...original} onChartReady={ready} __i18nManaged />;
}
