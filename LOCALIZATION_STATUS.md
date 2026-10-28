# Localization status

**Incomplete: missing translations remain. Commit and push are deferred until completion.**

The user requested retrying translation access on 29 October 2026 after the initial provider returned HTTP 429. Completed batches are saved in local offline dictionaries. No runtime translation requests are made by the app.

## Inventory

- 225 actual registered route patterns, 583 source modules, and 27892 distinct source keys across 26 namespaces.
- All 41 configured locales are included; original en-IN returns exact source text.
- Extraction now includes long educational descriptions, dynamic template messages, and standalone HTML/SVG lab scripts in public/ai-algorithms.
- 781 technical/code/formula candidates remain excluded for classification; the inventory is not a certification that every rendered string is covered.

## Dictionary coverage

| Locale | Present keys | Dictionary coverage | Reviewed coverage | Status |
|---|---:|---:|---:|---|
| af | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| am | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| ar | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| as | 2935 | 10.52% | 0% | draft-native-speaker-review-required |
| bn | 767 | 2.75% | 0% | draft-native-speaker-review-required |
| cs | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| de | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| el | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| en-IN | 27892 | 100% | 100% | source-baseline |
| es | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| fi | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| fr | 2862 | 10.26% | 0% | draft-native-speaker-review-required |
| gu | 767 | 2.75% | 0% | draft-native-speaker-review-required |
| ha | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| hi | 645 | 2.31% | 0% | draft-native-speaker-review-required |
| hu | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| id | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| ig | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| it | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| kn | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| ml | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| mr | 767 | 2.75% | 0% | draft-native-speaker-review-required |
| nl | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| or | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| pa | 767 | 2.75% | 0% | draft-native-speaker-review-required |
| pl | 2714 | 9.73% | 0% | draft-native-speaker-review-required |
| pt | 2937 | 10.53% | 0% | draft-native-speaker-review-required |
| ro | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| ru | 2858 | 10.25% | 0% | draft-native-speaker-review-required |
| so | 339 | 1.22% | 0% | draft-native-speaker-review-required |
| sv | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| sw | 2853 | 10.23% | 0% | draft-native-speaker-review-required |
| ta | 2787 | 9.99% | 0% | draft-native-speaker-review-required |
| te | 578 | 2.07% | 0% | draft-native-speaker-review-required |
| tr | 2780 | 9.97% | 0% | draft-native-speaker-review-required |
| uk | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| ur | 767 | 2.75% | 0% | draft-native-speaker-review-required |
| vi | 2855 | 10.24% | 0% | draft-native-speaker-review-required |
| xh | 2261 | 8.11% | 0% | draft-native-speaker-review-required |
| yo | 273 | 0.98% | 0% | draft-native-speaker-review-required |
| zu | 50 | 0.18% | 0% | draft-native-speaker-review-required |

Target dictionaries combine authored seeds and build-time machine translations. None has native-speaker sign-off. Unchanged scientific terms are counted as present, and are listed separately in coverage.json. Present keys do not certify translation quality.

## Implemented safeguards

- Lazy namespace dictionaries, manual locale persistence, keyboard-accessible selector, RTL for Arabic and Urdu, and local script-aware font fallbacks.
- React display-only translation preserves values, handlers, dataset identifiers, routes, model state, source English, and protected mathematical/code regions.
- Dynamic messages substitute original model values into translated templates; more specific templates take priority.
- Recharts display labels and ECharts labels preserve series identities, numerical arrays, and chart view state.
- Same-origin standalone iframe labs translate display text in place without replacing the document or restarting the simulation. Cross-origin frames keep their security boundary.

## Remaining work

1. Finish missing translations for every target locale using a supported provider. The strict audit intentionally fails while any key is missing.
2. Review machine translations in scientific context. Authored wording takes priority over generated text.
3. Inspect custom canvas/WebGL drawing text, custom HTML tooltip formatters, mixed technical tables, and excluded formula/prose candidates. These are not certified complete by dictionary percentages.
4. Complete the final language, route, model-state, responsive and production-build checks, then commit and push main.

## Reproduce

- npm run audit:localization regenerates the inventory and structural report.
- node scripts/audit-localization.mjs --strict enforces dictionary completeness.
- node scripts/translate-locales.mjs --cache-only materializes completed batches without any network access.
- TRANSLATION_PROVIDER=google-cloud uses GOOGLE_TRANSLATE_API_KEY; azure uses AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION. Keep credentials local, never in the repo.
- Translation-provider protocol references: [Google Cloud](https://docs.cloud.google.com/translate/docs/translate-text), [Azure](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate).

Structural errors: 0. Exact per-locale, per-namespace and per-route figures are in [coverage.json](reports/localization/coverage.json); verification evidence is in [verification.md](reports/localization/verification.md).
