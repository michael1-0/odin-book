import js from "@eslint/js";
import globals from "globals";
import importX from "eslint-plugin-import-x";
import path from "node:path";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export function createFrontendConfig({ tsconfigRootDir, tailwindCssPath }) {
  return defineConfig([
    globalIgnores(["dist"]),
    {
      linterOptions: { reportUnusedDisableDirectives: "error" },
    },
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        js.configs.recommended,
        ...tseslint.configs.strictTypeChecked,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      plugins: { "import-x": importX },
      languageOptions: {
        ecmaVersion: 2022,
        globals: globals.browser,
        parserOptions: {
          tsconfigRootDir,
          projectService: true,
        },
      },
      settings: {
        // no-cycle only follows modules whose extension is listed here.
        "import-x/extensions": [
          ".js",
          ".mjs",
          ".cjs",
          ".ts",
          ".mts",
          ".cts",
          ".tsx",
        ],
        "import-x/resolver": {
          typescript: {
            project: path.join(tsconfigRootDir, "tsconfig.json"),
          },
        },
      },
      rules: {
        // `onClick={() => setOpen(true)}` shorthand is idiomatic.
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          { ignoreArrowShorthand: true },
        ],
        // Number interpolation is safe and used for ids, offsets, and paths.
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          { allowNumber: true },
        ],
        // React Router loaders/actions signal errors by throwing a Response.
        "@typescript-eslint/only-throw-error": [
          "error",
          { allow: [{ from: "lib", name: "Response" }] },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": [
          "error",
          { considerDefaultExhaustiveForUnions: true },
        ],
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/consistent-type-exports": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "import-x/no-cycle": ["error", { ignoreExternal: true }],
        "import-x/no-extraneous-dependencies": [
          "error",
          {
            devDependencies: [
              "**/*.test.{ts,tsx}",
              "src/test/**",
              "vite.config.ts",
              "vitest.config.ts",
            ],
            optionalDependencies: false,
          },
        ],
        eqeqeq: ["error", "always"],
        "no-console": ["error", { allow: ["warn", "error"] }],
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      extends: [tailwindcss.configs.recommended],
      settings: {
        tailwindcss: {
          cssConfigPath: tailwindCssPath,
        },
      },
    },
  ]);
}
