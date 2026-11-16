// Staged-file autofix pipeline for the pre-commit hook.
//
// ESLint uses per-package flat configs (thin wrappers around @repo/eslint-config),
// and flat-config resolution only walks up from the cwd — so a root-level
// `eslint --fix` would find no config. Instead, dispatch to the owning package:
// lint-staged passes absolute paths by default, and `pnpm --filter <pkg> exec`
// runs with the package dir as cwd, where each eslint.config.js lives.
//
// Every file must match exactly ONE key: lint-staged runs different keys'
// tasks concurrently, so overlapping keys would race prettier against
// eslint --fix on the same file. Within a key, commands always run
// sequentially — that's why prettier sits in the same array as eslint
// (eslint fixes first, prettier canonicalizes last).
//
// `prettier` must stay a root devDependency: lint-staged spawns it from the
// repo root, where pnpm's strict node_modules hides the per-package copies.
//
// The `./` prefix pins a glob to repo-root files (patterns containing a
// slash don't use matchBase, so they never match nested files).
//
// New packages need a matcher added here.
const prettier = "prettier --write";
const eslint = (filter) => (files) =>
  `pnpm --filter ${filter} exec eslint --fix --no-warn-ignored ${files
    .map((file) => `'${file.replaceAll("'", "'\\''")}'`)
    .join(" ")}`;

export default {
  "apps/backend/**/*.{js,mjs,cjs,ts,mts,cts}": [eslint("backend"), prettier],
  "apps/frontend/**/*.{js,mjs,cjs,ts,tsx,jsx}": [eslint("frontend"), prettier],
  "packages/constants/**/*.{js,mjs,cjs,ts,mts,cts}": [
    eslint("@repo/constants"),
    prettier,
  ],
  "packages/zod-validations/**/*.{js,mjs,cjs,ts,mts,cts}": [
    eslint("@repo/zod-validations"),
    prettier,
  ],
  // Tooling packages have no eslint config or lint script (pnpm -r
  // --if-present skips them) — prettier only.
  "packages/{eslint-config,prettier-config,typescript-config}/**/*.{js,mjs}": [
    prettier,
  ],
  "./*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}": [prettier],
  // yaml is deliberately excluded: prettier --check on pnpm-lock.yaml fails
  // today, so the lockfile must never be prettier-ified at commit time.
  "*.{json,css,md}": [prettier],
};
