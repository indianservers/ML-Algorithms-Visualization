import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  languages,
  validLocale,
} from "./languages";
import { loadDictionary } from "./locale-loader";
import { keyFor, isInterfaceText } from "./keys";
import routes from "./route-namespaces.json";

export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  load: "currentOnly",
  supportedLngs: languages.map((language) => language.code),
  resources: {},
  defaultNS: "common",
  ns: [],
  keySeparator: false,
  nsSeparator: false,
  returnNull: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
    bindI18n: "languageChanged loaded",
    bindI18nStore: "added",
  },
});
let activeNamespaces = ["common", "navigation", "catalogue"];
const pending = new Map<string, Promise<void>>();
async function ensure(locale: string, namespace: string) {
  const id = `${locale}/${namespace}`;
  if (i18n.hasResourceBundle(locale, namespace)) return;
  if (!pending.has(id))
    pending.set(
      id,
      loadDictionary(locale, namespace)
        .then((dictionary) => {
          i18n.addResourceBundle(locale, namespace, dictionary, true, true);
        })
        .finally(() => pending.delete(id)),
    );
  await pending.get(id);
}
export function namespacesForRoute(path: string) {
  const match = routes.find((route) =>
    new RegExp(
      `^${route.path
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/:[\w]+/g, "[^/]+")
        .replace(/\\\*/g, ".*")}/?$`,
    ).test(path),
  );
  return [
    ...new Set([
      "common",
      "navigation",
      ...(match?.namespaces ?? ["catalogue"]),
    ]),
  ];
}
export async function prepareRoute(path: string) {
  activeNamespaces = namespacesForRoute(path);
  await Promise.all(
    activeNamespaces.flatMap((namespace) => [
      ensure(DEFAULT_LOCALE, namespace),
      ensure(validLocale(i18n.language), namespace),
    ]),
  );
}
let selection = 0;
export async function selectLocale(requested: string, persist = true) {
  const token = ++selection,
    locale = validLocale(requested);
  let loaded: string;
  do {
    loaded = activeNamespaces.join("|");
    await Promise.all(
      activeNamespaces.flatMap((namespace) => [
        ensure(DEFAULT_LOCALE, namespace),
        ensure(locale, namespace),
      ]),
    );
  } while (token === selection && loaded !== activeNamespaces.join("|"));
  if (token !== selection) return;
  await i18n.changeLanguage(locale);
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    document.documentElement.dir = languages.find(
      (language) => language.code === locale,
    )!.dir;
  }
  if (persist)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* Storage may be disabled. */
    }
}
export function translateText(value: string) {
  if (!isInterfaceText(value) || validLocale(i18n.language) === DEFAULT_LOCALE)
    return value;
  const source = value.trim();
  const key = keyFor(source),
    locale = validLocale(i18n.language);
  const namespace = activeNamespaces.find(
    (ns) => typeof i18n.getResource(locale, ns, key) === "string",
  );
  const translated = i18n.t(key, {
    ns: namespace ?? activeNamespaces,
    defaultValue: source,
    interpolation: { skipOnVariables: true },
  });
  return (
    value.slice(0, value.indexOf(source)) +
    translated +
    value.slice(value.indexOf(source) + source.length)
  );
}
/** Canonical English is retained for legacy DOM-driven action discovery. */
export function sourceText(element: Element) {
  if (validLocale(i18n.language) === DEFAULT_LOCALE) return element.textContent ?? "";
  return (
    element.getAttribute("data-i18n-source") ??
    Array.from(element.childNodes)
      .map((node) =>
        node.nodeType === 1
          ? sourceText(node as Element)
          : (node.textContent ?? ""),
      )
      .join("")
  );
}
export function restoreLocale() {
  let locale = DEFAULT_LOCALE;
  try {
    locale = validLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    /* English fallback */
  }
  return selectLocale(locale, false);
}
