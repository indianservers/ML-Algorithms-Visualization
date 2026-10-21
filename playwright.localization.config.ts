import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "localization.spec.ts",
  outputDir: ".localization-tests.local",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "line",
  use: {
    baseURL: process.env.LOCALIZATION_BASE_URL ?? "http://127.0.0.1:9869",
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
