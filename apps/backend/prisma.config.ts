/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Keep the config loadable without DATABASE_URL: postinstall runs `prisma
// generate` before `.env` exists. Don't simplify this to env("DATABASE_URL"),
// which throws while the config file loads. DB commands still report the
// missing URL.
const databaseUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/db/seed.ts",
  },
  datasource: databaseUrl ? { url: databaseUrl } : {},
});
