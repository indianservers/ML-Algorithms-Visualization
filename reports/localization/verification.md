# Localization verification — 28 October 2026

## Completion gate

Incomplete. The user requested retrying the rate-limited translation service tomorrow, 29 October 2026. A one-time thread follow-up is scheduled. No commit or push was made for this unfinished delivery.

- 41 locales, 27,892 inventoried source keys and 225 registered route patterns.
- 70,944 present target-language entries combine authored seeds and preliminary machine translations. Native-speaker review is not claimed.
- The structural audit passes with zero errors. `node scripts/audit-localization.mjs --strict` correctly exits 1 because translations remain missing.
- App translation resources are local JSON. Translation generation is a build-time process; no translation API credentials belong in app bundles.

## Checks recorded this turn

- An initial full unit run passed 330 tests across 28 files.
- The focused suite passed 62 tests after replacing regex template matching with literal-boundary matching, including all 41 locale loaders, original English, protected identifiers, dynamic values and long unmatched prose.
- A subsequent concurrent full run hit the existing DQN training test's five-second timeout; a repeat was interrupted when investigating a browser stall. These runs are not reported as passing.
- A production build passed before the final matcher and Recharts key-preservation refinements. The final build must be checked again before commit.
- Targeted ESLint passed earlier; rerun after final refinements before commit.
- The new all-language browser test found a stall while switching from Malayalam to Marathi. Dynamic template regexes could backtrack heavily on long strings; the matcher now uses deterministic literal boundaries. The source regression test passes. The production browser suite needs a complete rerun against a new build.
- The initial browser suite was interrupted after the stall. Do not reuse the earlier 14-test or 279-route results as evidence for the current changes; they belong to the prior committed version.

## Resume tomorrow

1. Inspect working-tree changes and saved `.localization-translation.local` cache. Do not overwrite other work.
2. Retry translation access conservatively. Stop on HTTP 429; do not bypass provider limits. No translation credentials were configured during this turn.
3. `scripts/translate-locales.mjs` supports Google Cloud Translation through `GOOGLE_TRANSLATE_API_KEY`, or Azure through `AZURE_TRANSLATOR_KEY` and `AZURE_TRANSLATOR_REGION`. `--cache-only` materializes completed batches without network requests. Credentials must remain local.
4. Complete missing dictionaries and review scientific wording. Inspect excluded technical/prose candidates, custom canvas/WebGL labels, mixed tables, and custom tooltip output; dictionary percentages do not certify those integrations.
5. Run `npm run audit:localization-complete`, full unit tests, TypeScript/build, targeted lint, all 16 localization browser checks (including all 41 selectors and the standalone iframe), route probes, and relevant model-state checks. Run heavyweight tests sequentially if the host is busy.
6. Browser stdout logs must be outside `.localization-tests.local`, because Playwright clears that directory and Windows cannot delete a currently open log file.
7. Check Recharts child keys and shape are preserved across locale changes; language switches must not remount charts. Preserve iframe documents, model state, datasets and original English.
8. Restore only build-generated changes to `public/sitemap.xml` and the MediaPipe WASM file if unchanged in content, update this evidence, and commit/push main only after completion and required passing checks. Do not force-push.

Final checkpoint: background preview, final typecheck/build, and lint processes were stopped before deferring work to tomorrow. The final build/lint/browser reruns remain pending. Build-generated sitemap and WASM changes were restored. git diff --check reports no whitespace errors. All app changes and translation caches remain local and uncommitted.
