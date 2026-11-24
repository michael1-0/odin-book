import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/setupIntegrationEnv.ts", "./tests/setupDb.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    // Files truncate shared tables before every test, so they must not run
    // concurrently.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
