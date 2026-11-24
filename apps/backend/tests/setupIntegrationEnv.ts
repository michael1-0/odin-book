import "./setupEnv.ts";
import { testDatabaseUrl } from "./testDatabaseUrl.ts";

// Must run before any test file imports src/db/prisma.ts, which binds the
// PrismaClient to DATABASE_URL at module load.
process.env.DATABASE_URL = testDatabaseUrl();
