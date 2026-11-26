import assert from "node:assert/strict";
import test from "node:test";
import { createBackendConfig } from "../backend.js";
import { createFrontendConfig } from "../frontend.js";

function flatten(config) {
  return config.flatMap((entry) =>
    Array.isArray(entry) ? flatten(entry) : [entry],
  );
}

function enabledRuleCount(config, ruleName) {
  return flatten(config).filter((entry) => {
    const value = entry.rules?.[ruleName];

    return value !== undefined && value !== "off";
  }).length;
}

function importExtensions(config) {
  return flatten(config)
    .map((entry) => entry.settings?.["import-x/extensions"])
    .find((value) => Array.isArray(value));
}

// `no-cycle` silently stops following modules whose extension is missing
// from `import-x/extensions`, so guard the settings that make it work.
test("backend config keeps cycle detection enabled for TypeScript", () => {
  const config = createBackendConfig({ tsconfigRootDir: process.cwd() });

  assert.ok(importExtensions(config)?.includes(".ts"));
  assert.ok(enabledRuleCount(config, "import-x/no-cycle") > 0);
});

test("frontend config keeps cycle detection enabled for TypeScript", () => {
  const config = createFrontendConfig({
    tsconfigRootDir: process.cwd(),
    tailwindCssPath: "src/index.css",
  });

  assert.ok(importExtensions(config)?.includes(".tsx"));
  assert.ok(enabledRuleCount(config, "import-x/no-cycle") > 0);
});
