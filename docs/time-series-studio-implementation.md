# Time Series Studio implementation and verification

The eight default routes use a shared responsive workbench, based on the nine supplied reference images. The existing advanced routes remain available. The studio uses animated SVG illustrations and a midnight palette; the working labs use real charts, controls, calculations, and browser training.

## Lab verification matrix

| Lab | Visual implementation | Real algorithm | Datasets | Interactions | Testing |
|---|---|---|---|---|---|
| Moving Average | Forecast chart, selected window, calculation inspector | Trailing, centered and leading averages; causal forecast baseline | Numeric series, including uploaded CSV | Window, lag, alignment, playback, future forecast, exports | Exact calculations, causality, browser calculations and exports |
| Exponential Smoothing | Level/forecast chart, recurrence inspector, comparison curves | SES recurrence, training-only alpha optimization, flat point forecasts | Numeric series | Alpha, initialization, confidence, comparisons, future forecast | Recurrence, optimization, uncertainty and browser comparison |
| Holt-Winters | Observed/fitted forecast and component charts | Additive/multiplicative seasonal smoothing; conditional residual bootstrap | At least two seasonal cycles; positive values for multiplicative mode | Alpha/beta/gamma, period, initialization, components, future forecast | Seasonal forecasts, custom initialization, positivity and bootstrap |
| ARIMA | Forecast, differenced series, ACF/PACF diagnostics | CTSA maximum-likelihood ARIMA/SARIMA in a worker; analytic integrated white noise special case | Sufficient regular numeric observations | Orders, seasonality, fitting, cancellation, comparison, future forecast | Trusted statsmodels fixtures, analytic special cases and actual browser worker |
| Anomaly Detection | Replay chart, threshold band, alerts and selected-point details | Causal rolling Z, modified Z, IQR, EWMA and seasonal residual detectors | Regular numeric signals; synthetic fixtures clearly identified | Replay/pause, sensitivity, cooldown, injected spike/drop/shift/seasonal events | Five detector spike checks and browser injection/sensitivity |
| RNN Forecasting | Forecast/loss charts, recurrent cell and state heatmap | TensorFlow.js simpleRNN | Univariate numeric sequences with train-only scaling | Actual training, cancellation, inference, weights download, IndexedDB reload | Real training, exact state equations, saved-weight parity and browser lifecycle |
| LSTM Forecasting | Forecast/loss charts, four gate/state inspection | TensorFlow.js LSTM | Same shared dataset pipeline | Architecture/training controls, selected timestep, real weight persistence | Real training, exact gate equations, saved-weight parity and browser lifecycle |
| GRU Forecasting | Forecast/loss charts, update/reset gate inspection | TensorFlow.js GRU, reset-before convention | Same shared dataset pipeline | Architecture/training controls, selected timestep, real weight persistence | Real training, exact gate equations, saved-weight parity and browser lifecycle |

## Shared functionality

Completion review adds independently evaluated SES alpha presets to the common score table, a synchronized holdout-error chart, replay-limited anomaly region/event scoring, and actual neural input/output shapes after training and reload. Synthetic generator labels enable precision/recall/F1; unlabelled historical data explicitly does not. SES initialization observations are masked from one-step forecasts, residuals and uncertainty estimation, and the mean-initialization walkthrough identifies its retrospective warmup.

- Dataset explorer with source/license, numeric/time-column mapping, paginated original rows, derived preview, profile and CSV export. Uploads retain the original values; duplicate, missing-value and resampling policies are explicit. Invalid dates, boolean targets, ambiguous formats, oversized uploads and irregular fitting inputs are rejected with actionable feedback.
- Bundled real Sunspots, Nile and CO2 observations from the public-domain statsmodels datasets, alongside explicitly labelled synthetic teaching datasets. Source links are retained in the application. Uploads support CSV; XLSX is not implemented.
- Chronological training/validation/test partitions, train-only neural scaling, same-origin naive/seasonal-naive comparisons, MAE/MSE/RMSE/MAPE/sMAPE/MASE/bias and interval coverage where intervals exist. Retrospective linear imputation cannot be used for evaluation.
- Interactive ECharts with linked selection, tooltips, zoom, reset, date ranges and PNG export. Future inference is separate from the held-out evaluation and does not overwrite its metrics.
- Learn/Explain content, calculation-driven challenges, saved experiment comparisons and JSON/CSV exports. Imported raw datasets are not silently stored in experiment history. Neural weights are persisted separately in IndexedDB and checked against dataset identity on reload.
- Cancellation and generation checks discard stale model results; model and optimizer tensors are disposed. Progress and training loss are measured, not simulated.

## Reusable components and files

`src/features/time-series-studio/` contains `TimeSeriesWorkbench`, `ConfigurationPanel`, `DatasetExplorer`/controls, `ScientificChart`, `NeuralInspector`, dataset preparation, classical engine, worker bridge, bootstrap intervals, neural engine, teaching content and styles. Eight thin route wrappers select the lab kind. `src/pages/TimeSeriesStudio.tsx` and its CSS implement the studio cards.

Necessary integration changes include the native-tab exemption in `AlgorithmTabPresentation`, optional Holt-Winters initialization in `src/lib/timeSeries/holtWinters.ts`, and a byte-verified Windows media-copy retry guard in `vite.config.ts`. Dependencies add `arima`. The earlier home-card and legacy Time Series layout fixes remain included.

The route wrappers are `MovingAveragePage.tsx`, `ExponentialSmoothingPage.tsx`, `HoltWintersPage.tsx`, `ARIMAConceptPage.tsx`, `TimeSeriesAnomalyDetectionPage.tsx`, `RNNForecastingPage.tsx`, `LSTMForecastingPage.tsx` and `GRUForecastingPage.tsx` under `src/pages/algorithms/timeSeries/`. Integration also touches `src/pages/CategoryStudio.tsx`, `src/pages/HomeLanding.tsx`, `src/layouts/RootLayout.tsx`, `src/styles/timeSeriesLabLayout.css`, the legacy GRU/anomaly approved pages, `package.json` and its lockfile. OPTICS changes are limited to `src/pages/algorithms/clustering/OPTICSPage.tsx` and `OPTICSPage.css`.

New verification files are `tests/time-series-studio.test.ts`, `tests/time-series-studio.spec.ts`, `tests/optics-layout.spec.ts`, `tests/fixtures/time-series-arima-reference.json`, `vitest.timeseries.config.ts` and `playwright.timeseries.config.ts`. The existing `tests/phase5-timeseries.test.ts` is included in mathematical verification without modification.

## Limits that remain visible in the UI

- The ARIMA binding exposes forecasts and variances but not fitted residuals, AIC/BIC, log likelihood or convergence diagnostics. These are marked unavailable; no substitute values are fabricated. Native zero-AR/MA orders use an explicitly tested analytic path because the binding returned invalid results for that special case.
- Neural models are univariate, one-step models used recursively over the requested horizon. Their intervals are unavailable because no calibrated uncertainty model is implemented. Gate inspection describes the first recurrent layer and uses its actual learned weights.
- Holt-Winters intervals assume exchangeable residual innovations conditional on fitted states and omit parameter uncertainty. Neural float32 weight storage is an estimate derived from the actual parameter count.
- Anomaly replay simulates a stream from the selected series. Injected event labels are controlled teaching events; alerts on unlabelled historical data do not establish measured false-positive rates.
- Charts currently use the full ECharts bundle. Production builds warn about large chunks; correctness takes precedence over an incompatible modular import.

## Verification commands

- `npm run test:timeseries`: mathematical, dataset, ARIMA-reference and actual TensorFlow.js tests, including cancellation, persistence parity and tensor cleanup.
- `npx playwright test --config playwright.timeseries.config.ts`: all eight routes, tabs, datasets, uploads, actual browser training, worker fitting, future inference, corrupt-history recovery and responsive layouts.
- `npx playwright test tests/optics-layout.spec.ts --workers=1 --reporter=line --output=.optics-tests.local`: desktop/mobile OPTICS layout and real controls.
- Targeted ESLint and `npm run build`: TypeScript, production bundling and existing route/navigation/asset audits.

The completion review's mathematical/model run passed 59 tests across two files, including independent alpha fitting, initialization exclusion, future-label exclusion and full injection-region scoring. The final production browser run passed all 24 tests in 2.3 minutes, including all eight labs at 1920, 1366, 834 and 390 pixels, real model training, future forecasts and corrupt-history recovery. Completion checks also passed for alpha score visibility/toggles, anomaly benchmark visibility and actual model shapes after reload. Targeted ESLint, TypeScript and the production build passed. Both OPTICS desktop/mobile browser tests passed in the earlier follow-up. The build retains large-chunk and ARIMA browser-fallback warnings. A previous development browser run was interrupted after generated Playwright HTML traces triggered repeated Vite reloads; the Vite watcher now excludes these artifacts.

## OPTICS follow-up

The page was missing its stylesheet import. Restoring it and scoping responsive layout rules places the spatial chart, reachability chart and settings in usable columns on desktop and a single flow on mobile. Point bounds adapt to actual data; point inspection supports keyboard activation; distance details respect Manhattan versus Euclidean selection. The fixed default radius is labelled accurately. Existing Save View/Share toast-only behavior was outside this layout repair and remains unchanged.

Changes are local workspace changes; deployment is not performed by this work.
