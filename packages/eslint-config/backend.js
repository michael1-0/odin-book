import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export function createBackendConfig({ tsconfigRootDir }) {
  return defineConfig([
    {
      ignores: ["dist/**", "src/db/generated/prisma/**", "prisma.config.ts"],
    },
    {
      linterOptions: { reportUnusedDisableDirectives: "error" },
    },
    {
      files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
      extends: [js.configs.recommended],
      languageOptions: { globals: globals.node },
    },
    {
      files: ["**/*.{ts,mts,cts}"],
      extends: [...tseslint.configs.strictTypeChecked],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
          project: "./tsconfig.json",
        },
      },
      rules: {
        // Express handlers deliberately `return res.status(...).json(...)`.
        "@typescript-eslint/no-confusing-void-expression": "off",
        // Number interpolation is safe and used for ids/ports/room names.
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          { allowNumber: true },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": [
          "error",
          { considerDefaultExhaustiveForUnions: true },
        ],
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/consistent-type-exports": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        eqeqeq: ["error", "always"],
        "no-console": ["error", { allow: ["warn", "error"] }],
      },
    },
  ]);
}
