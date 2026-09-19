import "dotenv/config";

const requiredEnvKeys = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "CLOUDINARY_URL",
] as const;

const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingEnvKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvKeys.join(", ")}. Copy apps/backend/.env.example to .env and fill in the values.`,
  );
}

const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  githubClientId: process.env.GITHUB_CLIENT_ID!,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL!,
  cloudinaryUrl: process.env.CLOUDINARY_URL!,
};

export default env;
