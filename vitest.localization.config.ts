import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@ml-i18n": path.resolve("src/i18n") } },
  test: { include: ["tests/localization.test.ts"] },
});
