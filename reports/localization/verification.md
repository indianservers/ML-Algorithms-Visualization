# Localization verification

## Scope and acceptance

This delivery implements the multilingual infrastructure and initial authored translation drafts. **Full Phase 1 translation acceptance is not achieved.** All 40 target locales require substantial additional translation and native-speaker review. None is represented as completely translated or reviewed.

The generated `LOCALIZATION_STATUS.md` and `coverage.json` report exact missing keys and percentages by language, namespace and registered route pattern. The source inventory covers 225 registered patterns, 525 source modules and 321 renderable TSX modules. Those module counts describe the presentation pipeline, not completed target-language pages.

## Confirmed checks

- `npm run audit:localization`: 41 configured locales, 9,789 source keys, zero structural errors in the recorded audit. All requested codes are included; the request's enumerated list contains 41 codes despite its heading saying 40.
- `npm test`: **287 tests passed across 28 files**. This includes 17 focused localization tests and the existing algorithm tests; these counts must not be added together as independent tests.
- Focused localization tests cover original English strings, missing-key fallback, unsupported locales, explicit selection, concurrent selection, route namespaces, protected technical regions, non-mutating chart labels, chart zoom/legend preservation, and namespaced target translations taking precedence over shared English fallback.
- `npm run test:localization-ui`: 14 production-browser checks passed. They cover five original-English reference pages, manual selection, persistence, keyboard access, optimizer parameters and trajectory, actual TensorFlow.js training/inference, dataset edits/schema, lesson position, and Russian/German/Telugu/Arabic layouts at 1440 and 390 pixels.
- `TIMESERIES_BASE_URL=http://127.0.0.1:9869 npm run test:timeseries-ui`: all 24 existing Time Series browser checks passed after integration, including actual training for all three recurrent architectures.
- The route probe checked 279 URL samples derived from the router and actual studio/AI catalogues. All 279 rendered without page errors after isolated retries and correcting the heading selector for lesson pages. The full result retains initial attempts in `routes-browser.json`. This is a rendering smoke test, not a claim of complete interaction testing for each route or every parameterized lesson URL.
- `npm run build` and TypeScript passed. Existing large-chunk and ARIMA browser-fallback warnings remain.
- Targeted ESLint passes for the new localization implementation and tests. Repository-wide `npm run lint` still reports 254 errors and 22 warnings. Its errors are not suppressed or represented as a clean global lint run.

## English comparison methodology

The original interface strings were extracted without rewriting existing descriptions. The default English display function returns its original argument exactly, including whitespace and punctuation.

Browser reference captures use the same original source through **stock React JSX**, with the localization JSX adapter disabled. The production build uses the adapter. The language-selector addition and transient route-progress animation are excluded from the comparison. Captures wait for lazy algorithm tools and the editable grid, and compare visible text rather than unmounted/hidden or still-loading panels. This avoids treating different loading times as wording regressions. The five comparisons passed for the homepage, optimizer, recurrent workbench, dataset manager and a specific lesson page.

Earlier test runs found issues in capture readiness and locator scope: a loading-state reference, an editor checkbox selected as a cell, and learning-companion sliders/tables mixed with the optimizer's own controls. Those tests were corrected to wait for the actual interface and inspect the intended model/editor state; they were not treated as evidence of passing product behavior before rerunning.

## Data and model invariants

- Form values, model settings, event handlers, route slugs, IDs, data arrays, predictions and export schemas remain original. Native option values are never replaced by translated display text.
- Original dataset identifiers and raw table content are protected from presentation translation. Literal value/label options are retained as technical identifiers; distinct display labels can still be translated separately.
- ECharts series names/IDs and data are preserved. Display title/axis/legend formatting uses a separate adapter. Label-only updates merge into the existing instance and preserve zoom and legend selection.
- React Router Link/NavLink text has an explicit library adapter; link destinations, navigation state and callbacks retain their original values. The final Arabic browser check verifies the shared Home link actually displays its Arabic label.
- Legacy action discovery reads canonical English while target-language labels are visible. In default English it reads the original DOM text, preserving existing discovery behavior.
- Language loading uses React subscriptions without route keys, browser reloads or Suspense-driven remounts. Model state remains owned by the existing components.
- The language engine catches unavailable localStorage and never performs IP/geographic/browser-language detection. No runtime translation API is called.

## Remaining work

1. Translate the missing Phase 1 keys and obtain language-specific review. Current draft coverage is about 1.9% in Telugu/Hindi/Russian/French and 0.51% in other target languages; reviewed target-language coverage is 0%.
2. Review the AST candidate classification, unused draft aliases, dynamically assembled messages and interpolation patterns. Automated extraction is not a linguistic or semantic certification.
3. Migrate labels in custom HTML/canvas/WebGL/iframe renderers, remaining Recharts labels and custom chart tooltips. Those continue displaying original English. In particular, `src/features/ai-virtual-labs/AiVirtualLabPage.tsx` hosts independent applications from `public/ai-algorithms/*`; their inner UI needs its own localization integration.
4. Explicitly distinguish display labels in mixed technical tables. Technical values and identifiers are deliberately protected.
5. Translate full educational paragraphs in Phase 2. The original content remains intact.
6. Resolve repository-wide lint debt separately; no unrelated algorithm or theme changes were made to conceal it.

## Reproduction

Run `npm run audit:localization`, `npm test`, `npm run build`, then start `npm run preview -- --host 127.0.0.1 --port 9869`. Run `npm run test:localization-ui` and `node scripts/localization-route-smoke.mjs`. `LOCALIZATION_BASE_URL` overrides the preview URL. A failed route run can be retried with `node scripts/localization-route-smoke.mjs --retry-failed`; initial results are retained in the report.

Start `npm run i18n:reference`, then run `npm run i18n:capture-baseline` to deliberately capture stock-React source references using `react({ jsxImportSource: 'react' })` instead of the localization JSX adapter, with the same application source and viewport. `LOCALIZATION_REFERENCE_URL` overrides its URL, and `LOCALIZATION_REFERENCE_ROUTE` limits recapture to one route. Reference capture is a deliberate maintenance operation, not part of ordinary test execution.

Changes are local. Deployment was not performed.
