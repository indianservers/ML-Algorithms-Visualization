import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "tests/time-series-studio.test.ts",
      "tests/phase5-timeseries.test.ts",
    ],
  },
});
