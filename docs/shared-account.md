# Shared AIMER account integration

Production origin: https://ml.aimersociety.com
Central service: https://tools.aimersociety.com

The current Tools reference was read from `C:\Indian Servers\Tools Dashboard` on 2026-10-16. The React header mounts one persistent account button; one native account dialog and one optional onboarding dialog live outside React. Public lessons remain accessible without authentication. Reference artwork, local SVG country flags and libphonenumber metadata retain their licenses in `public/account/vendor`.

All session GET/POST/DELETE and profile GET/PATCH requests target the central service with credentials included and no-store caching. Firebase uses memory-only persistence; its temporary sign-in is cleared after session creation. No tokens or account credentials are written to browser storage. Contact phone is separate from the verified phone identity. No backend, database or independent session service was added here.

Google, email/password, verification/resend/check, password reset and SMS code confirmation reuse the current reference flow. Signup asks for name, email and password. Personalization is an optional account-menu action. Skipping preserves existing interests. Profile writes contain only interests, optional contact and onboarding completion, with X-Aimer-Account. This site never writes Tools learning IDs. Existing ML saves remain device-local and unchanged; they are not advertised as cloud-synced.

## Required central production configuration

As of the verification run, Tools returns HTTP 403 to the exact ML Origin, including GET and preflight OPTIONS. A real Chrome fetch from the live ML site fails CORS. This is a central allowlist issue, not a relative-URL request or a successful anonymous session.

On the central Tools Vercel project, append `https://ml.aimersociety.com` to the existing `AUTH_ALLOWED_ORIGINS` production value, retaining every approved entry, then redeploy Tools. Do not replace the list, use a wildcard, or add arbitrary previews. Vercel configuration credentials are not available in this task; no central deployment configuration was changed.

Firebase public project configuration confirms `ml.aimersociety.com` is authorized. The current Tools explicit return-host list already contains it. A read-only Firebase Admin configuration check confirms Phone enabled and SMS allowlist IN only. The ML UI therefore allows SMS sending only for India while retaining the shared country validation and alternatives. SMS regions were not changed.

The repository also deploys to https://ml-algorithms-visualization.vercel.app. That hostname has no shared parent-domain session cookie and is not in the Firebase or trusted return allowlists; use the AIMER production hostname for cross-site login verification.

## Verification

Run `npm run build`, `npm run test:core`, `npm run test:account` (start Vite on 127.0.0.1:5199 first), and `npx vitest run tests/account-client.test.mjs`.

Browser tests mock Firebase and central endpoints: 320/360/390px phones, 1280x720 and 1536x864 default-dialog fit, existing phone-only session, shared logout, Google route/query/hash retention, email signup/verification/reset UI, phone validation/OTP retry/cooldown, optional profile writes, short viewport and enlarged text. Screenshots are generated in test-results. No real OTP, email, production test account or user-data mutation is used.

After the central deployment, verify credentialed session GET, session POST/DELETE preflights, and profile PATCH preflight from ML. Expected response headers include the exact ML origin, Access-Control-Allow-Credentials: true; profile allows Content-Type and X-Aimer-Account. Then test an existing trusted-subdomain session and shared logout using a consenting real user, plus Google/email provider flows and an approved Firebase test phone. Real SMS delivery remains unverified and requires explicit authorization.

Targeted lint passes for the changed React integration and browser tests. LabChrome has a pre-existing `react-hooks/set-state-in-effect` error at its route-change close effect; its other lint checks pass with only that rule disabled for the verification command. No lint rule configuration was changed.
