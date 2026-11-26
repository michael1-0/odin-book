import { createFrontendConfig } from "@repo/eslint-config/frontend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createFrontendConfig({
    tsconfigRootDir: __dirname,
    tailwindCssPath: path.join(__dirname, "src", "index.css"),
  }),
  // Every network call goes through services/http.ts. Tests live outside src/
  // and are exempt from this scope.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/http.ts"],
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
          selector:
            "MemberExpression[object.name=/^(window|globalThis|self)$/][property.name='fetch']",
          message:
            "Use apiFetch/apiMutation from services/http.ts instead of calling fetch directly.",
        },
        {
          selector:
            "MemberExpression[object.name=/^(window|globalThis|self)$/][computed=true][property.value='fetch']",
          message:
            "Use apiFetch/apiMutation from services/http.ts instead of calling fetch directly.",
        },
      ],
    },
  },
];
