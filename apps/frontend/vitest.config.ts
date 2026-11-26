import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Share the app's plugins/aliases so tests resolve modules exactly like the
// dev server instead of maintaining a second Vite config that can drift.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["tests/unit/**/*.test.{ts,tsx}"],
      setupFiles: ["./tests/setup.ts"],
    },
  }),
);
