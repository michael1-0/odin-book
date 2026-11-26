// Shared JWT payload → user resolution. Used by both transport entry points
// that read the auth cookie: the passport JWT strategy (HTTP) and the
// socket.io handshake middleware.
import type { JwtPayload } from "jsonwebtoken";
import { findUserById } from "../db/queries/users.ts";

type JwtUser = NonNullable<Awaited<ReturnType<typeof findUserById>>>;

function findUserByJwtPayload(payload: JwtPayload): Promise<JwtUser | null> {
  const userId = Number(payload.sub);

  if (!Number.isInteger(userId)) {
    return Promise.resolve(null);
  }

  return findUserById(userId);
}

export { findUserByJwtPayload };
