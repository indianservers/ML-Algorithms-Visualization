# Localization status

Phase 1 is **partially implemented; translation completion is not claimed**.

## Source inventory

- 225 registered route patterns audited from the actual TypeScript router (parameterized routes represent families of pages).
- 525 source modules scanned; 321 TSX modules covered by the centralized JSX presentation lookup. This is infrastructure coverage, not a claim that every visible string is translated.
- 9789 source keys in namespace-based English JSON dictionaries. Original source wording is retained; default rendering returns original English strings unchanged.
- 41 configured locales: every code in the request is included; its list contains 41 codes, not 40.
- 328 long/technical/educational string candidates retained separately for Phase 2 or manual classification.
- 0 route patterns without resolved page source.

## Dictionary coverage and review

| Locale | Present keys | Dictionary coverage | Reviewed coverage | Status |
|---|---:|---:|---:|---|
| af | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| am | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ar | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| as | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| bn | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| cs | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| de | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| el | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| en-IN | 9789 | 100% | 100% | source-baseline |
| es | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| fi | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| fr | 186 | 1.9% | 0% | draft-native-speaker-review-required |
| gu | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ha | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| hi | 186 | 1.9% | 0% | draft-native-speaker-review-required |
| hu | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| id | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ig | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| it | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| kn | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ml | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| mr | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| nl | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| or | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| pa | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| pl | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| pt | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ro | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ru | 186 | 1.9% | 0% | draft-native-speaker-review-required |
| so | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| sv | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| sw | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ta | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| te | 186 | 1.9% | 0% | draft-native-speaker-review-required |
| tr | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| uk | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| ur | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| vi | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| xh | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| yo | 50 | 0.51% | 0% | draft-native-speaker-review-required |
| zu | 50 | 0.51% | 0% | draft-native-speaker-review-required |

Only the original English baseline is considered reviewed (1 locale). Target resources are authored drafts, not empty placeholders; retained technical English and fallback-only keys are not reviewed translations. No native-speaker sign-off has been obtained.

## Implementation

- i18next/react-i18next with namespace JSON loading based on the actual route's source dependency graph. No runtime translation service, IP detection or browser-language override.
- One selector in each existing header variant, manual locale persistence, native labels, region grouping, search, selected state, keyboard navigation and Escape/focus return. Language changes do not remount route components.
- Central JSX display adapter covers native text/accessible labels across existing TSX pages without rewriting control values, event handlers, data schemas, routes or algorithm code. Text derived dynamically is looked up at display time; unmapped text retains its original English.
- Code, formulas, option values and table bodies retain technical text; JSX from third-party libraries is outside this adapter. ECharts titles, axis names and legend display formatters have a separate non-mutating adapter; series IDs/names and numerical arrays are preserved.
- Arabic/Urdu document direction and script-aware fallbacks; technical regions, charts and tables retain LTR. No font downloads or third-party font calls.

## Remaining work and defects

1. Translate and linguistically review all missing keys listed per locale in [coverage.json](reports/localization/coverage.json). No non-English locale currently meets full Phase 1 acceptance.
2. Manually classify dynamic template messages, interpolated UI fragments and words embedded in existing custom HTML/canvas/WebGL/iframe renderers; those are not comprehensively translated by the JSX layer.
3. Preserve numerical chart keys while migrating remaining third-party custom tooltip formatters and Recharts labels; they currently fall back to English.
4. Original dataset identifiers and technical table-body content remain deliberately untranslated. Interface labels inside mixed technical tables need explicit opt-in display labels.
5. Full educational paragraph translation is Phase 2. Long descriptions and scientific expressions require manual classification; the source inventory is an audit candidate list, not a certification of automated classification.
6. UI English regression and state-retention tests are recorded separately in [verification.md](reports/localization/verification.md). Automated structural checks do not establish native-language quality or certify every route visually.

## Validation

Structural errors: 0. Exact missing keys, namespace percentages, route percentages, unchanged-English entries, unused source keys and Phase 2 candidates are in [coverage.json](reports/localization/coverage.json). Source occurrences and imported dependencies are in [inventory.json](reports/localization/inventory.json).
