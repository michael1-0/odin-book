import "dotenv/config";

// `src/config/env.ts` throws at import time, and most backend modules import
// it (directly or through constants). Unit tests get fixed, non-secret
// values; the integration setup overrides DATABASE_URL with the test
// database after this file has run.
process.env.NODE_ENV = "test";

process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/odin-book-test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.GITHUB_CLIENT_ID = "test-github-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret";
process.env.GITHUB_CALLBACK_URL =
  "http://localhost:5000/api/auth/github/callback";
// Never let a test reach the real Cloudinary/account config.
process.env.CLOUDINARY_URL = "cloudinary://test-key:test-secret@test-cloud";
