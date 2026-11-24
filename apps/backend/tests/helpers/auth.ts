import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../../src/constants/auth.ts";
import env from "../../src/config/env.ts";
import type { User } from "../../src/db/generated/prisma/client.ts";

// A real signed JWT cookie, so integration tests exercise the actual
// passport-jwt strategy and its user lookup instead of stubbing auth.
export function authCookie(user: Pick<User, "id" | "githubId" | "username">) {
  const token = jwt.sign(
    {
      sub: user.id,
      githubId: user.githubId,
      username: user.username,
    },
    env.jwtSecret,
    { expiresIn: "1h" },
  );

  return `${AUTH_COOKIE_NAME}=${token}`;
}
