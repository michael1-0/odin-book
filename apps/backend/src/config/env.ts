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

function readRequiredEnv(): Record<RequiredEnvKey, string> {
  const missing: RequiredEnvKey[] = [];
  const entries = requiredEnvKeys.map((key) => {
    const value = process.env[key];

    if (!value) {
      missing.push(key);
    }

    return [key, value ?? ""] as const;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy apps/backend/.env.example to .env and fill in the values.`,
    );
  }

  return Object.fromEntries(entries) as Record<RequiredEnvKey, string>;
}

function envOrDefault(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed === "" ? fallback : trimmed;
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return 5000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }

  return port;
}

const requiredEnv = readRequiredEnv();
const nodeEnv = envOrDefault(process.env.NODE_ENV, "development");

const env = {
  port: parsePort(process.env.PORT),
  nodeEnv,
  isProd: nodeEnv === "production",
  databaseUrl: requiredEnv.DATABASE_URL,
  jwtSecret: requiredEnv.JWT_SECRET,
  frontendUrl: envOrDefault(process.env.FRONTEND_URL, "http://localhost:5173"),
  githubClientId: requiredEnv.GITHUB_CLIENT_ID,
  githubClientSecret: requiredEnv.GITHUB_CLIENT_SECRET,
  githubCallbackUrl: requiredEnv.GITHUB_CALLBACK_URL,
  cloudinaryUrl: requiredEnv.CLOUDINARY_URL,
};

export default env;
