import { createFrontendConfig } from "@repo/eslint-config/frontend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createFrontendConfig({
    tsconfigRootDir: __dirname,
    tailwindCssPath: path.join(__dirname, "src", "index.css"),
  }),
  // Every network call goes through services/http.ts; tests mock fetch.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/http.ts", "**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Use apiFetch/apiMutation from services/http.ts instead of calling fetch directly.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            "Use apiFetch/apiMutation from services/http.ts instead of calling fetch directly.",
        },
        {
          selector:
            "CallExpression[callee.object.name=/^(window|globalThis|self)$/][callee.property.name='fetch']",
          message:
            "Use apiFetch/apiMutation from services/http.ts instead of calling fetch directly.",
        },
      ],
    },
  },
];
