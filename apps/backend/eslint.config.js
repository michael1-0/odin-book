import { createBackendConfig } from "@repo/eslint-config/backend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createBackendConfig({ tsconfigRootDir: __dirname }),
  // Test files and vitest configs live outside the production tsconfig
  // (`src` only), so point typed linting at the test project instead.
  {
    files: ["tests/**/*.ts", "vitest*.config.ts"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.test.json",
      },
    },
  },
];
