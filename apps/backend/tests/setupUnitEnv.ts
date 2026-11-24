import "./setupEnv.ts";

// `pnpm test` must stay DB-free. Point the Prisma singleton at an
// unreachable address so a unit test that accidentally queries fails
// loudly instead of touching the developer database from `.env`.
process.env.DATABASE_URL =
  "postgresql://unused:unused@127.0.0.1:1/odin-book-test";
