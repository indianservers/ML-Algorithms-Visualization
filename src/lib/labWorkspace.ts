const SAVED_VIEWS_KEY = "mlSuite.savedViews";

export type SavedLabView = {
  route: string;
  href: string;
  tab: string | null;
  savedAt: number;
  extra?: Record<string, string | number | boolean | null>;
};

function downloadBlob(contents: BlobPart, filename: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function slugFromRoute(route: string) {
  return route.replace(/^\/+/, "").replace(/\//g, "-") || "workspace";
}

export function saveCurrentView(
  route: string,
  extra?: SavedLabView["extra"],
): SavedLabView {
  const view: SavedLabView = {
    route,
    href: window.location.href,
    tab: new URLSearchParams(window.location.search).get("tab"),
    savedAt: Date.now(),
    extra,
  };
  try {
    const current = JSON.parse(
      localStorage.getItem(SAVED_VIEWS_KEY) ?? "{}",
    ) as Record<string, SavedLabView>;
    current[route] = view;
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(current));
  } catch {
    /* storage may be unavailable */
  }
  window.dispatchEvent(
    new CustomEvent("ml:view-saved", { detail: { view } }),
  );
  return view;
}

export function loadSavedView(route: string): SavedLabView | null {
  try {
    const current = JSON.parse(
      localStorage.getItem(SAVED_VIEWS_KEY) ?? "{}",
    ) as Record<string, SavedLabView>;
    return current[route] ?? null;
  } catch {
    return null;
  }
}

export function exportWorkspaceReport(meta: {
  title: string;
  route: string;
  tab?: string | null;
}) {
  const lines = [
    `# ${meta.title}`,
    "",
    `- Route: ${meta.route}`,
    `- Section: ${meta.tab || "current"}`,
    `- Theme: ${document.documentElement.getAttribute("data-theme") ?? "dark"}`,
    `- Exported: ${new Date().toISOString()}`,
    "",
    "This is a workspace snapshot from Mega ML Algorithms Suite.",
  ];
  downloadBlob(
    lines.join("\n"),
    `${slugFromRoute(meta.route)}-report.md`,
    "text/markdown;charset=utf-8",
  );
  window.dispatchEvent(
    new CustomEvent("ml:report-exported", { detail: meta }),
  );
}
