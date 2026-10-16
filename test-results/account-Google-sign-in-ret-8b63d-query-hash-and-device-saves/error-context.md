# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account.spec.ts >> Google sign-in retains the learning route, query, hash and device saves
- Location: tests\account.spec.ts:139:1

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('#account-dialog')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('#account-dialog')
    - locator resolved to <dialog open="" id="account-dialog" class="account-dialog" aria-labelledby="account-title">…</dialog>
    - unexpected value "visible"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - button "Open guide mode" [ref=e4] [cursor=pointer]:
      - img [ref=e5]
      - text: Guide
    - link "Skip to content" [ref=e8] [cursor=pointer]:
      - /url: "#main-content"
    - navigation "Page links" [ref=e9]:
      - generic [ref=e10]:
        - link "Home" [ref=e11] [cursor=pointer]:
          - /url: /
          - img [ref=e12]
          - text: Home
        - link "Datasets" [ref=e15] [cursor=pointer]:
          - /url: /ml/lab/dataset-manager
          - img [ref=e16]
          - text: Datasets
        - link "Terms" [ref=e20] [cursor=pointer]:
          - /url: /ml/terms-studio
          - img [ref=e21]
          - text: Terms
      - button "Continue to login" [ref=e24] [cursor=pointer]:
        - img [ref=e26]
        - generic [ref=e29]: Continue to login
      - button "Search algorithms and routes" [ref=e30] [cursor=pointer]:
        - img [ref=e31]
        - text: Search
      - button "Open guide mode" [ref=e34] [cursor=pointer]:
        - img [ref=e35]
        - text: Guide
      - button "Open Saved Experiments theory" [ref=e38] [cursor=pointer]:
        - img [ref=e39]
        - text: Theory
      - button "Settings" [ref=e41] [cursor=pointer]:
        - img [ref=e42]
      - button "Fullscreen" [ref=e45] [cursor=pointer]:
        - img [ref=e46]
      - button "Switch to dark theme" [ref=e51] [cursor=pointer]:
        - img [ref=e52]
    - main [ref=e54]:
      - navigation "Breadcrumb" [ref=e55]:
        - list [ref=e56]:
          - listitem [ref=e57]:
            - link "Home" [ref=e58] [cursor=pointer]:
              - /url: /
              - img [ref=e59]
              - text: Home
          - listitem [ref=e62]:
            - img [ref=e63]
            - link "Algorithm Lab" [ref=e65] [cursor=pointer]:
              - /url: /studios/algorithm-lab
          - listitem [ref=e66]:
            - img [ref=e67]
            - generic [ref=e69]: Saved Experiments
      - generic [ref=e73]:
        - generic [ref=e74]:
          - generic [ref=e75]:
            - img [ref=e77]
            - generic [ref=e81]:
              - generic [ref=e82]:
                - heading "Saved Experiments" [level=1] [ref=e83]
                - generic [ref=e84]: Intermediate
                - generic "Estimated learning time" [ref=e85]:
                  - img [ref=e86]
                  - text: 12 min
              - paragraph [ref=e89]: Lab
              - paragraph [ref=e90]: Browse, audit, delete, and export every browser-local experiment saved from workbench pages.
              - region "Saved Experiments introduction" [ref=e91]:
                - generic [ref=e92]:
                  - img [ref=e94]
                  - generic [ref=e96]:
                    - button "How It Works Revisit, rename and compare the runs you already saved." [expanded] [ref=e97] [cursor=pointer]:
                      - generic [ref=e98]:
                        - generic [ref=e99]: How It Works
                        - generic [ref=e100]: Revisit, rename and compare the runs you already saved.
                      - img [ref=e101]
                    - generic [ref=e104]:
                      - generic [ref=e105]:
                        - generic [ref=e106]:
                          - paragraph [ref=e107]:
                            - img [ref=e108]
                            - text: When to use it
                          - text: Use it when comparing experiments, managing datasets, saving results, or preparing reports.
                        - generic [ref=e112]:
                          - paragraph [ref=e113]:
                            - img [ref=e114]
                            - text: Watch for
                          - text: Watch reproducibility, consistent metrics, dataset versions, random seeds, and notes that explain why results changed.
                      - group [ref=e117]:
                        - generic "More theory and a learning experiment" [ref=e118] [cursor=pointer]
              - generic [ref=e119]:
                - generic [ref=e120]: Related
                - link "Experiment Workspace" [ref=e121] [cursor=pointer]:
                  - /url: /ml/lab/experiment-workspace
                - link "Model Zoo" [ref=e122] [cursor=pointer]:
                  - /url: /ml/lab/model-zoo
                - link "AutoML Assistant" [ref=e123] [cursor=pointer]:
                  - /url: /ml/lab/automl-assistant
              - generic [ref=e124]:
                - generic [ref=e125]: Datasets
                - button "Customer Churn Dataset (760 rows) · 760 → churned" [ref=e126] [cursor=pointer]
                - button "Energy Demand Regression Dataset (760 rows) · 760 → demand_mw" [ref=e127] [cursor=pointer]
                - button "Housing Price Dataset (760 rows) · 760 → price" [ref=e128] [cursor=pointer]
          - generic "Loading algorithm tools" [ref=e129]
        - generic [ref=e130]:
          - generic [ref=e131]:
            - generic [ref=e133]:
              - heading "Experiment Library" [level=3] [ref=e134]:
                - generic [ref=e135]: Experiment Library
              - paragraph [ref=e136]: IndexedDB-backed, local to this browser.
            - generic [ref=e139]:
              - textbox "Search algorithm or experiment" [ref=e140]
              - generic [ref=e141]:
                - generic [ref=e142]:
                  - paragraph [ref=e143]: "0"
                  - paragraph [ref=e144]: Saved
                - generic [ref=e145]:
                  - paragraph [ref=e146]: "0"
                  - paragraph [ref=e147]: Algorithms
              - generic [ref=e148]:
                - paragraph [ref=e149]: Reproducibility
                - generic [ref=e150]: Export JSON for exact parameters and Markdown for a readable model-card style report.
          - paragraph [ref=e156]: No saved experiments match the current search.
    - contentinfo "Site credits" [ref=e157]:
      - generic [ref=e158]:
        - generic [ref=e159]:
          - text: Powered by
          - link "Indian Servers Pvt Limited" [ref=e160] [cursor=pointer]:
            - /url: https://www.IndianServers.com
          - text: "&"
          - link "AIMER Society" [ref=e161] [cursor=pointer]:
            - /url: https://www.AimerSociety.com
        - generic [ref=e162]: Artificial Intelligence Medical and Engineering Researchers Society
      - navigation "Partner websites" [ref=e163]:
        - link "www.IndianServers.com" [ref=e164] [cursor=pointer]:
          - /url: https://www.IndianServers.com
        - link "www.AimerSociety.com" [ref=e165] [cursor=pointer]:
          - /url: https://www.AimerSociety.com
      - generic [ref=e166]: © 2026 Indian Servers Pvt Limited & AIMER Society. All rights reserved.
  - dialog "Welcome to AIMER Society" [ref=e167]:
    - button "Close account dialog" [ref=e168] [cursor=pointer]:
      - img [ref=e169]
    - generic [ref=e171]:
      - img [ref=e173]
      - heading "Welcome to AIMER Society" [level=2] [ref=e176]:
        - text: Welcome to
        - text: AIMER Society
      - paragraph [ref=e177]: Sign in to access our learning tools, visualizations and resources.
      - button "Signing you in…" [disabled] [ref=e178]:
        - generic [ref=e179]: Signing you in…
      - button "Continue with email" [disabled] [ref=e180]:
        - generic [ref=e181]: ✉
        - generic [ref=e182]: Continue with email
        - generic [ref=e183]: →
      - button "Continue with phone" [ref=e184] [cursor=pointer]:
        - generic [ref=e185]: ☏
        - generic [ref=e186]: Continue with phone
        - generic [ref=e187]: →
      - paragraph [ref=e188]:
        - generic [ref=e189]: ♧
        - strong [ref=e191]: One account for all AIMER learning websites
      - link "Continue on AIMER Tools ↗" [ref=e192] [cursor=pointer]:
        - /url: https://tools.aimersociety.com/?login=1
      - status [ref=e193]: Signing you in…
      - paragraph [ref=e194]:
        - text: We save your name, email, optional mobile number and profile photo.
        - link "Privacy Policy" [ref=e195] [cursor=pointer]:
          - /url: https://tools.aimersociety.com/privacy.html
        - text: ·
        - link "Terms" [ref=e196] [cursor=pointer]:
          - /url: https://tools.aimersociety.com/terms.html
```

# Test source

```ts
  47  |   test(`guest account layout ${width}x${height}`, async ({ page }) => {
  48  |     await page.setViewportSize({ width, height });
  49  |     await setup(page);
  50  |     await page.locator('#account-trigger').click();
  51  |     await expect(page.locator('#google-login')).toBeVisible();
  52  |     await expect(page.locator('#email-toggle')).toBeVisible();
  53  |     await expect(page.locator('#phone-toggle')).toBeVisible();
  54  |     const sizes = await page.locator('#account-dialog').evaluate(el => ({ w: el.scrollWidth, client: el.clientWidth, h: el.scrollHeight, ch: el.clientHeight }));
  55  |     expect(sizes.w).toBeLessThanOrEqual(sizes.client + 1);
  56  |     if (width >= 1280) expect(sizes.h).toBeLessThanOrEqual(sizes.ch + 1);
  57  |     await page.keyboard.press('Control+k');
  58  |     await expect(page.getByRole('dialog')).toHaveCount(1);
  59  |     await page.locator('#account-close').focus();
  60  |     for (let i = 0; i < 12; i++) {
  61  |       await page.keyboard.press('Tab');
  62  |       expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#account-dialog')))).toBe(true);
  63  |     }
  64  |     await page.screenshot({ path: `test-results/account-${width}.png` });
  65  |     await page.keyboard.press('Escape');
  66  |     await expect(page.locator('#account-dialog')).not.toBeVisible();
  67  |     await expect(page.locator('#account-trigger')).toBeFocused();
  68  |   });
  69  | }
  70  | 
  71  | test('email signup, verification and reset UI preserve values', async ({ page }) => {
  72  |   await setup(page);
  73  |   await page.locator('#account-trigger').click();
  74  |   await page.locator('#email-toggle').click();
  75  |   await expect(page.locator('#google-login')).toBeHidden();
  76  |   await expect(page.locator('#phone-auth')).toBeHidden();
  77  |   await page.locator('#signin-email').fill('learner@example.test');
  78  |   await page.locator('#forgot-password').click();
  79  |   await expect(page.locator('#auth-status')).toContainText('If an eligible account exists');
  80  |   await page.locator('#email-signup-tab').click();
  81  |   await page.locator('#signup-name').fill('Learner');
  82  |   await page.locator('#signin-password').fill('ExamplePass9!');
  83  |   await page.locator('#toggle-password').click();
  84  |   await expect(page.locator('#signin-password')).toHaveAttribute('type', 'text');
  85  |   await page.locator('#email-submit').click();
  86  |   await expect(page.locator('#email-verification')).toBeVisible();
  87  |   await page.locator('#resend-verification').click();
  88  |   await page.locator('#cancel-verification').click();
  89  |   await expect(page.locator('#email-toggle')).toBeVisible();
  90  |   await expect(page.locator('#signin-email')).toHaveValue('learner@example.test');
  91  | });
  92  | 
  93  | test('phone validation, OTP retry, cooldown and shared logout', async ({ page }) => {
  94  |   await setup(page);
  95  |   await page.locator('#account-trigger').click();
  96  |   await page.locator('#phone-toggle').click();
  97  |   await expect(page.locator('#phone-country')).toHaveValue('IN');
  98  |   await page.locator('#login-phone').fill('123');
  99  |   await page.locator('#phone-send').click();
  100 |   await expect(page.locator('#phone-number-error')).not.toBeEmpty();
  101 |   await page.locator('#login-phone').fill('9876543210');
  102 |   await page.locator('#phone-send').click();
  103 |   await expect(page.locator('#phone-code-form')).toBeVisible();
  104 |   await expect(page.locator('#phone-resend')).toBeDisabled();
  105 |   await page.locator('#phone-code').fill('000000');
  106 |   await page.locator('#phone-verify').click();
  107 |   await expect(page.locator('#auth-status')).toContainText('incorrect');
  108 |   await page.locator('#phone-code').fill('123456');
  109 |   await page.locator('#phone-verify').click();
  110 |   await expect(page.locator('#account-dialog')).toBeHidden();
  111 |   await expect(page.locator('#account-label')).toHaveText('My account');
  112 |   await page.locator('#account-trigger').click();
  113 |   await expect(page.locator('#profile-name')).toHaveText('My account');
  114 |   await page.locator('#google-logout').click();
  115 |   await expect(page.locator('#account-label')).toHaveText('Continue to login');
  116 | });
  117 | 
  118 | test('existing phone session and personalization preserve shared interests and omit learning', async ({ page }) => {
  119 |   const writes = await setup(page, true);
  120 |   await expect(page.locator('#account-dialog')).toBeHidden();
  121 |   await page.locator('#account-trigger').click();
  122 |   const size = await page.locator('#account-dialog').evaluate(el => [el.scrollHeight, el.clientHeight]);
  123 |   expect(size[0]).toBeLessThanOrEqual(size[1] + 1);
  124 |   await page.locator('#personalize-learning').click();
  125 |   await expect(page.locator('#onboarding-dialog')).toBeVisible();
  126 |   await page.locator('#onboarding-skip').click();
  127 |   expect(writes).toEqual([{ method: 'PATCH', body: { interests: ['Maths'], onboardingComplete: true } }]);
  128 | });
  129 | 
  130 | test('service failure remains distinct and central fallback preserves trusted route', async ({ page }) => {
  131 |   await setup(page, false, true);
  132 |   await page.locator('#account-trigger').click();
  133 |   await expect(page.locator('#auth-status')).toContainText('Cannot reach');
  134 |   await page.locator('#auth-retry').click();
  135 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'unavailable');
  136 |   expect(await page.locator('#central-login').getAttribute('href')).toBe(`${central}/?login=1`);
  137 | });
  138 | 
  139 | test('Google sign-in retains the learning route, query, hash and device saves', async ({ page }) => {
  140 |   await setup(page);
  141 |   const path = '/ml/lab/saved-experiments?view=recent#saved';
  142 |   await page.evaluate(() => localStorage.setItem('account-test-existing-save', 'keep'));
  143 |   await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  144 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
  145 |   await page.locator('#account-trigger').click();
  146 |   await page.locator('#google-login').click();
> 147 |   await expect(page.locator('#account-dialog')).toBeHidden();
      |                                                 ^ Error: expect(locator).toBeHidden() failed
  148 |   expect(page.url()).toBe(base + path);
  149 |   expect(await page.evaluate(() => localStorage.getItem('account-test-existing-save'))).toBe('keep');
  150 |   await expect(page.locator('#account-trigger')).toHaveCount(1);
  151 | });
  152 | 
  153 | test('email verification completes the shared session', async ({ page }) => {
  154 |   await setup(page);
  155 |   await page.locator('#account-trigger').click();
  156 |   await page.locator('#email-toggle').click();
  157 |   await page.locator('#email-signup-tab').click();
  158 |   await page.locator('#signup-name').fill('Learner');
  159 |   await page.locator('#signin-email').fill('learner@example.test');
  160 |   await page.locator('#signin-password').fill('ExamplePass9!');
  161 |   await page.locator('#email-submit').click();
  162 |   await expect(page.locator('#email-verification')).toBeVisible();
  163 |   await page.locator('#check-verification').click();
  164 |   await expect(page.locator('#account-dialog')).toBeHidden();
  165 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'signed-in');
  166 | });
  167 | 
  168 | test('phone methods return, restricted region, short viewport and enlarged text', async ({ page }) => {
  169 |   await page.setViewportSize({ width: 320, height: 360 });
  170 |   await setup(page);
  171 |   await page.locator('#account-trigger').click();
  172 |   await page.locator('#phone-toggle').click();
  173 |   await page.locator('#auth-methods').click();
  174 |   await expect(page.locator('#phone-auth')).toBeHidden();
  175 |   await expect(page.locator('#email-toggle')).toBeVisible();
  176 |   await page.locator('#phone-toggle').click();
  177 |   await page.locator('#phone-country').selectOption('US');
  178 |   await page.locator('#login-phone').fill('2025550123');
  179 |   await page.locator('#phone-send').click();
  180 |   await expect(page.locator('#auth-status')).toContainText('India only');
  181 |   await page.addStyleTag({ content: '#account-dialog { font-size: 20px; } #account-dialog input { font-size: 22px; }' });
  182 |   const sizes = await page.locator('#account-dialog').evaluate(el => ({ scroll: el.scrollWidth, width: el.clientWidth, height: el.getBoundingClientRect().height }));
  183 |   expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  184 |   expect(sizes.height).toBeLessThanOrEqual(360);
  185 |   await page.locator('#account-close').click();
  186 |   await expect(page.locator('#account-dialog')).toBeHidden();
  187 | });
  188 | 
  189 | test('email sign-in keeps values after a recoverable error', async ({ page }) => {
  190 |   await setup(page);
  191 |   await page.locator('#account-trigger').click();
  192 |   await page.locator('#email-toggle').click();
  193 |   await page.locator('#signin-email').fill('bad@example.test');
  194 |   await page.locator('#signin-password').fill('ExamplePass9!');
  195 |   await page.locator('#email-submit').click();
  196 |   await expect(page.locator('#auth-status')).toContainText('Check your email and password');
  197 |   await expect(page.locator('#signin-email')).toHaveValue('bad@example.test');
  198 |   await expect(page.locator('#signin-password')).toHaveValue('ExamplePass9!');
  199 |   await page.locator('#signin-email').fill('learner@example.test');
  200 |   await page.locator('#email-submit').click();
  201 |   await expect(page.locator('#account-dialog')).toBeHidden();
  202 | });
  203 | 
  204 | test('expired shared session clears the account and explains recovery', async ({ page }) => {
  205 |   await setup(page, true);
  206 |   await page.route(`${central}/api/session`, route => route.fulfill({ status: 401, json: { error: 'Expired' }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } }));
  207 |   await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  208 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
  209 |   await page.locator('#account-trigger').click();
  210 |   await expect(page.locator('#auth-status')).toContainText('session expired');
  211 |   await expect(page.locator('#google-login')).toBeVisible();
  212 | });
  213 | 
  214 | 
  215 | test('transient refresh keeps the displayed account and retry clears the error', async ({ page }) => {
  216 |   await setup(page, true);
  217 |   let failed = true, requests = 0;
  218 |   await page.route(`${central}/api/session`, async route => {
  219 |     requests++;
  220 |     if (failed) return route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  221 |     return route.fulfill({ json: { user: phoneUser }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  222 |   });
  223 |   await page.evaluate(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('pageshow')); });
  224 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'unavailable');
  225 |   expect(requests).toBe(1);
  226 |   await page.locator('#account-trigger').click();
  227 |   await expect(page.locator('#profile-name')).toHaveText('My account');
  228 |   failed = false;
  229 |   await page.locator('#auth-retry').click();
  230 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'signed-in');
  231 |   await expect(page.locator('#auth-status')).toBeEmpty();
  232 |   await expect(page.locator('#auth-retry')).toBeHidden();
  233 | });
  234 | 
  235 | test('token exchange cannot report success without a readable shared cookie', async ({ page }) => {
  236 |   await setup(page);
  237 |   await page.route(`${central}/api/session`, route => route.fulfill({ json: { user: route.request().method() === 'POST' ? phoneUser : null }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } }));
  238 |   await page.locator('#account-trigger').click();
  239 |   await page.locator('#google-login').click();
  240 |   await expect(page.locator('#auth-status')).toContainText('shared session could not be confirmed');
  241 |   await expect(page.locator('#account-dialog')).toBeVisible();
  242 |   await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
  243 | });
  244 | 
```