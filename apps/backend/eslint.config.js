import { createBackendConfig } from "@repo/eslint-config/backend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createBackendConfig({ tsconfigRootDir: __dirname }),
  // Only the data-access layer may touch the Prisma client directly.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/db/prisma",
                "**/db/prisma.ts",
                "./db/prisma.ts",
                "../db/prisma.ts",
              ],
              message:
                "Only src/db/** may import the Prisma client; use a queries/ helper.",
            },
          ],
        },
      ],
    },
  },
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
  // Supertest response bodies are `any`; asserting on them is the point of
  // an integration test, so the unsafe-* family is off in tests only.
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  // The startup banner is the one legitimate console.log.
  {
    files: ["src/server.ts"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
    },
  },
];
