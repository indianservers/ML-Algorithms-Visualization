const resources = import.meta.glob<{ default: Record<string, string> }>(
  "./locales/*/*.json",
);
export async function loadDictionary(locale: string, namespace: string) {
  const load = resources[`./locales/${locale}/${namespace}.json`];
  return load ? (await load()).default : {};
}
