import React, { Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../stores/uiStore";
import {
  Sun,
  Moon,
  Search,
  Compass,
  Database,
  Home,
  HelpCircle,
  X,
} from "lucide-react";
import {
  getAllAlgorithms,
  getAlgorithmByRoute,
  getImplementationStatus,
  rememberRoute,
} from "../data/implementationStatus";
import { RouteSearchModal } from "../components/common/RouteSearchModal";
import { getSeoMetadata, routeToUrl, siteConfig } from "../data/seo";
import { VisualizationSkeleton } from "../components/common/EmptyState";
import {
  RouteProgressBar,
  RouteProgressDone,
  RouteProgressTrigger,
  useRouteProgress,
} from "../components/common/RouteProgress";
import { GuideMode } from "../components/common/GuideMode";
import { FitToViewport } from "../components/common/FitToViewport";
import { useGuideMode } from "../stores/uiStore";
import "../styles/labTheme.css";
import "../styles/nestedLabLayout.css";

const ACTIVE_DATASETS_KEY = "mlSuite.activeAlgorithmDatasets";

const PageFallback = () => (
  <div
    className="mx-auto max-w-7xl space-y-4 p-4"
    aria-label="Loading algorithm page"
  >
    <RouteProgressTrigger />
    <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <div className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="space-y-3">
        <VisualizationSkeleton />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  </div>
);

const shortcutRows = [
  { keys: "?", action: "Show keyboard shortcuts" },
  { keys: "Ctrl K", action: "Search algorithms and routes" },
  { keys: "T", action: "Train the current algorithm" },
  { keys: "R", action: "Reset the current page" },
  { keys: "S", action: "Step through the current algorithm" },
  { keys: "Ctrl S", action: "Save the current page form or experiment" },
  { keys: "E", action: "Export the current result" },
  { keys: "Esc", action: "Close menus and dialogs" },
];

const KeyboardShortcutsModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950/45 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="mx-auto mt-16 max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <HelpCircle size={17} className="text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {shortcutRows.map((row) => (
            <div
              key={row.keys}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {row.action}
              </span>
              <kbd className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {row.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100">
          <h2 className="text-lg font-bold">
            Algorithm route failed to render
          </h2>
          <p className="mt-2 text-sm">
            The lazy route boundary caught this error, so the rest of the suite
            is still usable.
          </p>
          <pre className="mt-3 overflow-auto rounded bg-white/70 p-3 text-xs dark:bg-gray-900/50">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function hasActiveDatasetForRoute(route: string) {
  if (typeof localStorage === "undefined") return false;
  try {
    const current = JSON.parse(
      localStorage.getItem(ACTIVE_DATASETS_KEY) ?? "{}",
    ) as Record<string, unknown>;
    return Boolean(current[route]);
  } catch {
    return false;
  }
}

export const RootLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { guideMode, toggleGuideMode } = useGuideMode();
  const location = useLocation();
  const [routeSearchOpen, setRouteSearchOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [hasRouteDataset, setHasRouteDataset] = React.useState(() =>
    hasActiveDatasetForRoute(location.pathname),
  );
  const seo = React.useMemo(
    () => getSeoMetadata(location.pathname),
    [location.pathname],
  );
  useRouteProgress(location.pathname);
  const reduceMotion = useReducedMotion();
  const currentItem = getAlgorithmByRoute(location.pathname);
  const algorithmStatus = currentItem
    ? getImplementationStatus(currentItem.route)
    : undefined;
  const isUtilityRoute = currentItem
    ? ["Lab", "Preprocessing", "Evaluation", "Deployment"].includes(
        currentItem.category,
      )
    : true;
  const canShowGlobalTrain = Boolean(
    currentItem &&
    algorithmStatus === "Implemented" &&
    hasRouteDataset &&
    !isUtilityRoute,
  );
  // First route in the same category, used as the breadcrumb parent in JSON-LD.
  const categoryRoute = currentItem
    ? getAllAlgorithms().find((item) => item.category === currentItem.category)
        ?.route
    : undefined;

  React.useEffect(() => {
    const setMeta = (selector: string, attributes: Record<string, string>) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([key, value]) =>
        element?.setAttribute(key, value),
      );
    };

    const setLink = (rel: string, href: string) => {
      let element = document.head.querySelector<HTMLLinkElement>(
        `link[rel="${rel}"]`,
      );
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    const canonicalUrl = routeToUrl(seo.path);
    const ogImageUrl = `${siteConfig.domain}${siteConfig.ogImage}`;
    document.title = seo.title;
    setMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });
    setMeta('meta[name="keywords"]', {
      name: "keywords",
      content: seo.keywords.join(", "),
    });
    setMeta('meta[name="robots"]', {
      name: "robots",
      content: "index, follow",
    });
    setMeta('meta[name="application-name"]', {
      name: "application-name",
      content: siteConfig.name,
    });
    setMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title,
    });
    setMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    setMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    setMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
    });
    setMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: siteConfig.name,
    });
    setMeta('meta[property="og:image"]', {
      property: "og:image",
      content: ogImageUrl,
    });
    setMeta('meta[property="og:image:secure_url"]', {
      property: "og:image:secure_url",
      content: ogImageUrl,
    });
    setMeta('meta[property="og:image:type"]', {
      property: "og:image:type",
      content: "image/png",
    });
    setMeta('meta[property="og:image:width"]', {
      property: "og:image:width",
      content: "1200",
    });
    setMeta('meta[property="og:image:height"]', {
      property: "og:image:height",
      content: "630",
    });
    setMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: `${siteConfig.name} preview card`,
    });
    setMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    setMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });
    setMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });
    setMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: ogImageUrl,
    });
    setMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: `${siteConfig.name} preview card`,
    });
    setLink("canonical", canonicalUrl);

    const existingBreadcrumbScript =
      document.getElementById("breadcrumb-jsonld");
    if (currentItem) {
      const breadcrumbScript =
        existingBreadcrumbScript ?? document.createElement("script");
      breadcrumbScript.id = "breadcrumb-jsonld";
      breadcrumbScript.setAttribute("type", "application/ld+json");
      breadcrumbScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: routeToUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: currentItem.category,
            item: routeToUrl(categoryRoute ?? currentItem.route),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentItem.label,
            item: routeToUrl(currentItem.route),
          },
        ],
      });
      if (!existingBreadcrumbScript)
        document.head.appendChild(breadcrumbScript);
    } else {
      existingBreadcrumbScript?.remove();
    }
  }, [seo, currentItem, categoryRoute]);

  React.useEffect(() => {
    if (location.pathname.startsWith("/ml/")) rememberRoute(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    const refresh = () =>
      setHasRouteDataset(hasActiveDatasetForRoute(location.pathname));
    refresh();
    window.addEventListener("ml:algorithm-dataset-loaded", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ml:algorithm-dataset-loaded", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location.pathname]);

  React.useEffect(() => {
    const emitCommand = (name: string) =>
      window.dispatchEvent(new CustomEvent(`ml:${name}`));
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setRouteSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setRouteSearchOpen(false);
        setShortcutsOpen(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        emitCommand("save");
        return;
      }
      if (editing) return;
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (event.key.toLowerCase() === "t" && canShowGlobalTrain)
        emitCommand("train");
      if (event.key.toLowerCase() === "r") emitCommand("reset");
      if (event.key.toLowerCase() === "s") emitCommand("step");
      if (event.key.toLowerCase() === "e") emitCommand("export");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canShowGlobalTrain]);

  const page = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="h-full min-h-0"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <RouteProgressDone>
              <Outlet />
            </RouteProgressDone>
          </Suspense>
        </RouteErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );

  // Only the landing page opts out of the suite bar; it is the Home target and
  // carries its own brand nav. Every other route keeps Home / Dataset Manager.
  if (location.pathname === "/") {
    return (
      <div className="h-screen min-h-0 w-full overflow-x-hidden overflow-y-auto bg-[#f1f5fe]">
        <RouteProgressBar />
        <GuideMode />
        {page}
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden ${theme === "dark" ? "dark" : ""}`}
      style={{ background: "var(--lab-bg)", color: "var(--lab-text)" }}
    >
      <RouteProgressBar />
      <GuideMode />
      <a href="#main-content" className="skip-link print:hidden">
        Skip to content
      </a>
      <nav className="lab-topbar print:hidden" aria-label="Page links">
        <Link to="/">
          <Home />
          Home
        </Link>
        <Link to="/ml/lab/dataset-manager" className="primary">
          <Database />
          Dataset Manager
        </Link>
        <span className="spacer" />
        <button
          onClick={() => setRouteSearchOpen(true)}
          aria-label="Search algorithms and routes"
        >
          <Search />
          Search
        </button>
        <button
          onClick={toggleGuideMode}
          aria-pressed={guideMode}
          aria-label={guideMode ? "Close guide mode" : "Open guide mode"}
        >
          <Compass />
          Guide
        </button>
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </nav>
      <main
        id="main-content"
        tabIndex={-1}
        className={`relative isolate min-h-0 flex-1 overflow-x-hidden scrollbar-thin ${
          location.pathname.startsWith("/ml/") ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {location.pathname.startsWith("/ml/") ? (
          <FitToViewport>{page}</FitToViewport>
        ) : (
          page
        )}
      </main>
      <RouteSearchModal
        open={routeSearchOpen}
        onClose={() => setRouteSearchOpen(false)}
      />
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
};
