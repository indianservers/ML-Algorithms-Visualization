# AI virtual labs integration

The production routes are `/ai-algorithms/:slug`, listed in
`src/features/ai-virtual-labs/catalog.ts`. The React page uses the existing
application shell and loading skeleton. Each original lab runs in a same-origin
document so its document-wide CSS and event handlers cannot change other pages.
The workspace header, footer, and all-lab selector are hidden because the
production app supplies those functions. The algorithm canvas, cards, controls,
tables, guides, and engine scripts remain from the working source.

`scripts/import-ai-virtual-labs.mjs` copies the read-only Android assets from
`C:/Indian Servers/AIMLDLAlgorithms/app/src/main/assets` into
`public/ai-algorithms` and rewrites only local folder references and the
Bayesian Construction → Inference navigation. The source project is untouched.

| Source bundle | Production asset directory | Treatment |
| --- | --- | --- |
| `search_labs` | `graph-search` | Engines, controller, CSS, and local GSAP copied; entry HTML adapted |
| `phase2_labs` | `optimization-search` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `phase3_labs` | `decision-processes` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `phase4_labs` | `sequential-models` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `phase5_labs` | `heuristic-search` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `phase6_labs` | `bayesian-game-search` | Engines, controllers, CSS copied; saved-network navigation adapted; entry HTML adapted |
| `phase7_labs` | `weighted-search` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `phase8_labs` | `bounded-search` | Engines, controllers, CSS copied with local path changes; entry HTML adapted |
| `lab-runtime.js` | root of `ai-algorithms` | Copied with local path changes |
| `lab-polish.js` | root of `ai-algorithms` | Adapted: removed source all-lab selector and source bundle URL guard; retained guide, tooltips, validation, keyboard support, and cleanup |
| `lab-polish.css` | root of `ai-algorithms` | Copied with local path changes |
| Android WebView/Kotlin assets | none | Replaced by native React routes and app shell |

The directory rename preserves the source script and stylesheet order in every
entry HTML. `production-embed.js` reports height and readiness to React and
clears GSAP animations on page exit. `production-embed.css` removes duplicate
document chrome within the isolated workspace. Both Bayesian labs share the
production origin and the original `ai-bayes-network-v1` localStorage key.

Validation commands:

```powershell
node scripts/audit-ai-virtual-labs.mjs
npx playwright test tests/ai-virtual-labs.spec.ts --workers=1
npm run build
```
