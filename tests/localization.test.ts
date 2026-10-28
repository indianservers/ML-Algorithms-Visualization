import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Link, MemoryRouter } from "react-router-dom";
import { jsx } from "../src/i18n/jsx-runtime";
import {
  i18n,
  namespacesForRoute,
  prepareRoute,
  selectLocale,
  translateText,
} from "../src/i18n/config";
import { DEFAULT_LOCALE, languages, validLocale } from "../src/i18n/languages";
import { keyFor } from "../src/i18n/keys";
import { localizeChartOption, preserveChartView, translateChartDisplay } from "../src/i18n/chart-labels";
import { localizeRechartsChildren } from '../src/i18n/recharts-labels';
afterEach(async () => {
  await selectLocale(DEFAULT_LOCALE, false);
});
describe("Global localization invariants", () => {
  it.each(languages.map(language=>language.code))('loads the configured %s dictionary with a translated navigation label', async locale => {
    await prepareRoute('/');
    await selectLocale(locale, false);
    expect(translateText('Home')).not.toMatch(/^s_[0-9a-f]+$/);
    if(locale !== 'en-IN')expect(translateText('Settings')).not.toBe('Settings');
  });
  it('translates dynamic messages while retaining substituted model values', async () => {
    await prepareRoute('/');
    const source='Completed {{v0}} epochs for {{v1}}';
    i18n.addResourceBundle('hi', 'common', {[keyFor(source)]:'{{v1}} के लिए {{v0}} युग पूरे हुए'});
    i18n.addResourceBundle('en-IN', 'common', {[keyFor(source)]:source});
    await selectLocale('hi', false);
    expect(translateText('Completed 24 epochs for GRU')).toBe('GRU के लिए 24 युग पूरे हुए');
    await selectLocale('en-IN', false);
    expect(translateText('Completed 24 epochs for GRU')).toBe('Completed 24 epochs for GRU');
  });
  it('matches long non-template prose without combinatorial backtracking', async () => {
    await prepareRoute('/');
    const source='{{v0}}a{{v1}}a{{v2}}a{{v3}}a{{v4}}a{{v5}}a{{v6}}end';
    i18n.addResourceBundle('hi','common',{[keyFor(source)]:source});
    i18n.addResourceBundle('en-IN','common',{[keyFor(source)]:source});
    await selectLocale('hi',false);
    const prose='a'.repeat(1500)+'stop';
    const started=performance.now();
    expect(translateText(prose)).toBe(prose);
    expect(performance.now()-started).toBeLessThan(1000);
  });
  it('translates existing tooltip text slots and preserves markup attributes', async () => {
    await prepareRoute('/');await selectLocale('hi', false);
    expect(translateChartDisplay('<b title="Train">Train</b><span>24</span>')).toBe('<b title="Train">प्रशिक्षित करें</b><span>24</span>');
    const data=[1,2];expect(translateChartDisplay(data)).toBe(data);
  });
  it('preserves Recharts identities and data keys while adapting display names', async () => {
    await prepareRoute('/');await selectLocale('hi', false);
    const data=[{Train:2}];
    const item=createElement('g', {name:'Train', dataKey:'Train', data, id:'fixed-series'});
    const [localized]=localizeRechartsChildren([item]) as React.ReactElement<Record<string,unknown>>[];
    expect(localized.type).toBe(item.type);
    expect(localized.key).toBe(item.key);
    expect(localized.props.dataKey).toBe('Train');
    expect(localized.props.id).toBe('fixed-series');
    expect(localized.props.data).toBe(data);
    expect(localized.props.name).toBe('प्रशिक्षित करें');
  });
  it("includes all 41 requested codes and defaults to en-IN", () => {
    expect(languages).toHaveLength(41);
    expect(new Set(languages.map((language) => language.code)).size).toBe(41);
    expect(validLocale("unsupported")).toBe("en-IN");
    expect(validLocale("ru-RU")).toBe("en-IN");
    expect(
      languages
        .filter((language) => language.dir === "rtl")
        .map((language) => language.code),
    ).toEqual(["ur", "ar"]);
  });
  it("uses actual route-specific namespaces, including parameterized lessons", () => {
    expect(namespacesForRoute("/ml/time-series/gru-forecasting")).toContain(
      "module-time-series-studio",
    );
    expect(
      namespacesForRoute("/ml/supervised/simple-linear-regression/lessons/3"),
    ).toContain("lessons");
    expect(namespacesForRoute("/unknown-path")).toContain("common");
  });
  it("preserves original English punctuation, case and whitespace", async () => {
    await selectLocale("en-IN", false);
    for (const value of [
      "  Train\n",
      "Learning rate: ",
      "GPU",
      "y = mx + b",
      "Original educational paragraph.",
    ])
      expect(translateText(value)).toBe(value);
  });
  it.each(["te", "hi", "ru", "fr", "ar", "de"])(
    "loads %s only on explicit selection and falls back to original English",
    async (locale) => {
      await prepareRoute("/");
      await selectLocale(locale, false);
      expect(translateText("Home")).not.toBe("Home");
      expect(translateText("A unique unmapped interface phrase.")).toBe(
        "A unique unmapped interface phrase.",
      );
      expect(translateText("sepal_length")).toBe("sepal_length");
      expect(translateText("loss = mse(y, yhat)")).toBe("loss = mse(y, yhat)");
    },
  );
  it("keeps latest explicit language selection during concurrent loads", async () => {
    await Promise.all([selectLocale("hi", false), selectLocale("fr", false)]);
    expect(i18n.language).toBe("fr");
  });
  it("localizes React native display text without adding DOM wrappers or changing values", async () => {
    await selectLocale("hi", false);
    const html = renderToStaticMarkup(
      jsx("button", {
        value: "Train",
        children: "Train",
        "data-route": "/original",
      }),
    );
    expect(html).toContain('value="Train"');
    expect(html).toContain('data-route="/original"');
    expect(html).toContain("प्रशिक्षित करें");
    expect(html).not.toContain("<span");
    const link = renderToStaticMarkup(createElement(MemoryRouter, { children: jsx(Link, { to: "/ml/original-route", children: "Home" }) }));
    expect(link).toContain('href="/ml/original-route"');
    expect(link).toContain("होम");
  });
  it("protects code, formulas, technical table bodies and implicit option values", async () => {
    await selectLocale("hi", false);
    for (const tag of ["code", "pre", "tbody", "option"]) {
      const html = renderToStaticMarkup(
        jsx(tag, { children: jsx("span", { children: "Train" }) }),
      );
      expect(html).toContain(">Train<");
      expect(html).not.toContain("प्रशिक्षित");
    }
    expect(
      renderToStaticMarkup(
        jsx("span", { className: "formula", children: "Train" }),
      ),
    ).toContain(">Train<");
  });
  it("preserves all chart data, series keys and callbacks while localizing display labels", async () => {
    const data = [1, 2, 3],
      formatter = (name: string) => name;
    const option = {
      title: { text: "Dataset" },
      xAxis: { name: "Epochs" },
      series: [{ name: "Train", id: "series-1", data }],
      legend: { formatter },
    };
    expect(localizeChartOption(option)).toBe(option);
    await selectLocale("hi", false);
    const localized = localizeChartOption(option);
    expect(localized.series).toBe(option.series);
    expect(localized.series[0].data).toBe(data);
    expect(localized.series[0].name).toBe("Train");
    expect(localized.legend.formatter("Train")).toBe("प्रशिक्षित करें");
    expect(option.legend.formatter).toBe(formatter);
    expect(option.title.text).toBe("Dataset");
  });
  it("uses stable source keys", () => {
    expect(keyFor("Train")).toBe(keyFor("Train"));
    expect(keyFor("Train")).not.toBe(keyFor("train"));
  });
  it("preserves dataset identifiers even when they match translated UI words", async () => {
    await selectLocale("hi", false);
    expect(renderToStaticMarkup(jsx("th", { "data-i18n-protect": true, children: "Home" }))).toContain(">Home<");
    expect(renderToStaticMarkup(jsx("option", { value: "Train", children: "Train" }))).toContain(">Train<");
    expect(renderToStaticMarkup(jsx("option", { value: "dataset-id", children: "Dataset" }))).toContain("डेटासेट");
  });
  it("preserves actual chart zoom and legend selection without altering data", () => {
    const data = [1, 2, 3];
    const option = { series: [{ data }], dataZoom: [{ id: "range", start: 0, end: 100 }], legend: { selected: { Train: true } } };
    const view = preserveChartView(option, { dataZoom: [{ id: "range", start: 25, end: 60 }], legend: [{ selected: { Train: false } }] });
    expect(view.dataZoom[0]).toMatchObject({ start: 25, end: 60 });
    expect(view.legend.selected.Train).toBe(false);
    expect(view.series[0].data).toBe(data);
    expect(option.dataZoom[0].start).toBe(0);
    expect(option.legend.selected.Train).toBe(true);
  });
  it("does not let English shared fallback shadow a translated route namespace", async () => {
    await prepareRoute("/ml/time-series/moving-average");
    const source = "More theory and a learning experiment";
    i18n.addResourceBundle("hi", "module-time-series-studio", { [keyFor(source)]: "अधिक सिद्धांत और एक अभ्यास" });
    await selectLocale("hi", false);
    expect(translateText(source)).toBe("अधिक सिद्धांत और एक अभ्यास");
    i18n.removeResourceBundle("hi", "module-time-series-studio");
  });
});
