import "dotenv/config";

const requiredEnvKeys = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "CLOUDINARY_URL",
] as const;

type RequiredEnvKey = (typeof requiredEnvKeys)[number];

function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    // Unreachable after the missing-key check below, but keeps the type honest.
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parsePort(value: string | undefined): number {
  const port = Number(value);

  return Number.isInteger(port) && port > 0 ? port : 5000;
}

const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingEnvKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvKeys.join(", ")}. Copy apps/backend/.env.example to .env and fill in the values.`,
  );
}

const nodeEnv = process.env.NODE_ENV ?? "development";

const env = {
  port: parsePort(process.env.PORT),
  nodeEnv,
  isProd: nodeEnv === "production",
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  githubClientId: requireEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
  githubCallbackUrl: requireEnv("GITHUB_CALLBACK_URL"),
  cloudinaryUrl: requireEnv("CLOUDINARY_URL"),
};

export default env;
