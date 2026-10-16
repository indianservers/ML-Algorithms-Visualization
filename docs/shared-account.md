# Shared AIMER account integration

Production origin: https://ml.aimersociety.com
Central service: https://tools.aimersociety.com

The current Tools reference was read from `C:\Indian Servers\Tools Dashboard` on 2026-10-16. The React header mounts one persistent account button; one native account dialog and one optional onboarding dialog live outside React. Public lessons remain accessible without authentication. Reference artwork, local SVG country flags and libphonenumber metadata retain their licenses in `public/account/vendor`.

All session GET/POST/DELETE and profile GET/PATCH requests target the central service with credentials included and no-store caching. Firebase uses memory-only persistence; its temporary sign-in is cleared after session creation. No tokens or account credentials are written to browser storage. Contact phone is separate from the verified phone identity. No backend, database or independent session service was added here.

Google, email/password, verification/resend/check, password reset and SMS code confirmation reuse the current reference flow. Signup asks for name, email and password. Personalization is an optional account-menu action. Skipping preserves existing interests. Profile writes contain only interests, optional contact and onboarding completion, with X-Aimer-Account. This site never writes Tools learning IDs. Existing ML saves remain device-local and unchanged; they are not advertised as cloud-synced.

## Required central production configuration

On 2026-10-16 the live ML popup failed before login: credentialed GET to `https://tools.aimersociety.com/api/session` and profile OPTIONS returned 403 without CORS headers, while the Tools-origin session request returned 200 with `{ user: null }`. Production `AUTH_ALLOWED_ORIGINS` omitted ML. In the existing Vercel project, `https://ml.aimersociety.com` was appended while retaining Tools, Biology and Electronics Lab, then Tools was redeployed. No origin checks, cookie security or provider policy were relaxed.

After deployment, a real isolated Chromium page at `https://ml.aimersociety.com/` passed central GET/POST/DELETE and profile GET/PATCH transport checks with `credentials: 'include'` and `cache: 'no-store'`. Browser preflights returned 204; responses had exact ML ACAO, credentials true, Vary Origin and no-store. Empty-token POST returned readable 400; anonymous profile GET/PATCH returned readable 401. The script does not sign in or change profiles. Run `node scripts/verify-account-transport.mjs` to repeat; safe response-header evidence is in `artifacts/shared-account-transport.json`.

The existing signed-in Chrome session was automatically recognized by live ML after reload; a separate anonymous in-app browser recovered through Try again and cleared the stale error. No new interactive provider sign-in, real OTP/email delivery, authenticated profile write, or logout of the existing user's session was performed. Shared logout and provider workflows are covered with mocks, not claimed as authenticated production end-to-end tests.

All ML session/profile calls now use one endpoint helper that rejects unexpected destinations. Direct login confirms the created session with GET before rendering success and clears temporary Firebase sign-in after confirmation. Overlapping refreshes are suppressed; transient failures preserve the displayed account and retry clears stale errors.

Firebase public project configuration confirms `ml.aimersociety.com` is authorized. The current Tools explicit return-host list already contains it. A read-only Firebase Admin configuration check confirms Phone enabled and SMS allowlist IN only. The ML UI therefore allows SMS sending only for India while retaining the shared country validation and alternatives. SMS regions were not changed.

The repository also deploys to https://ml-algorithms-visualization.vercel.app. That hostname has no shared parent-domain session cookie and is not in the Firebase or trusted return allowlists; use the AIMER production hostname for cross-site login verification.

## Verification

Run `npm run build`, `npm run test:core`, `npm run test:account` (start Vite on 127.0.0.1:5199 first), and `npx vitest run tests/account-client.test.mjs`.

Browser tests mock Firebase and central endpoints: 320/360/390px phones, 1280x720 and 1536x864 default-dialog fit, existing phone-only session, shared logout, Google route/query/hash retention, email signup/verification/reset UI, phone validation/OTP retry/cooldown, optional profile writes, short viewport and enlarged text. Screenshots are generated in test-results. No real OTP, email, production test account or user-data mutation is used.

Remaining real-user checks: direct Google/email/approved test-phone sign-in, authenticated onboarding/profile edits, and shared logout across both tabs. Real SMS delivery still requires explicit authorization. The isolated production transport check logs no cookies, tokens or private profile data.

Targeted lint passes for the changed React integration and browser tests. LabChrome has a pre-existing `react-hooks/set-state-in-effect` error at its route-change close effect; its other lint checks pass with only that rule disabled for the verification command. No lint rule configuration was changed.

The classic bootstrap script imports the shared account modules at runtime. This preserves them through Vite production HTML processing. Set ACCOUNT_BASE_URL to a Vite preview origin to run the same browser suite against built production assets.

Cloudflare was observed overriding auth JavaScript freshness to four hours despite the Vercel revalidation rule. The HTML bootstrap and its account-ui/auth/account-client import chain now use the `20261016-auth2` release query so existing browser caches request the repaired modules.
