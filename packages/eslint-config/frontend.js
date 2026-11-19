import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export function createFrontendConfig({ tsconfigRootDir, tailwindCssPath }) {
  return defineConfig([
    globalIgnores(["dist"]),
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
        parserOptions: {
          tsconfigRootDir,
        },
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
