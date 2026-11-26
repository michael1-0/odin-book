import { createBackendConfig } from "@repo/eslint-config/backend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  ...createBackendConfig({ tsconfigRootDir: __dirname }),
  // This package is consumed by the frontend too, so it must stay
  // express-free (see AGENTS.md).
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "express",
              message:
                "@repo/zod-validations must stay express-free; keep HTTP concerns in the backend.",
            },
            {
              name: "express-zod-safe",
              message:
                "@repo/zod-validations must stay express-free; keep HTTP concerns in the backend.",
            },
          ],
          patterns: [
            {
              group: ["express/*"],
              message:
                "@repo/zod-validations must stay express-free; keep HTTP concerns in the backend.",
            },
          ],
        },
      ],
    },
  },
];
