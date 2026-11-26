import { createBackendConfig } from "@repo/eslint-config/backend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createBackendConfig({ tsconfigRootDir: __dirname }),
  // Only the data-access layer may touch Prisma directly. Generated *types*
  // are also kept behind src/db so controllers do not depend on Prisma.
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
                "**/db/prisma.js",
                "**/db/prisma.mjs",
                "**/db/prisma.cjs",
              ],
              message:
                "Only src/db/** may import the Prisma client; use a queries/ helper.",
            },
            {
              group: ["**/db/generated/prisma/**"],
              message:
                "Only src/db/** may import generated Prisma modules; re-export what controllers need from src/db.",
            },
            {
              group: ["@prisma/client", "@prisma/adapter-pg"],
              message:
                "Only src/db/** may configure Prisma; controllers and middleware must use query helpers.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message:
            "Dynamic imports are banned outside src/db/**; use a static import or a query helper.",
        },
        {
          selector: "NewExpression[callee.name='PrismaClient']",
          message: "Only src/db/prisma.ts may construct the Prisma client.",
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
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  // Supertest response bodies are `any`; asserting on them is the point of
  // an integration test, so the unsafe-* family is off there only.
  {
    files: ["tests/integration/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
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
