import type { DoneCallback } from "passport";
import type { Request } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { Profile } from "passport-github2";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as JwtStrategy } from "passport-jwt";
import cookieExtractor from "../utils/cookieExtractor.ts";
import createGravatarUrl from "../utils/createGravatarUrl.ts";
import env from "../config/env.ts";
import { createUser, findUserByGithubId } from "../db/queries/users.ts";
import { findUserByJwtPayload } from "../utils/jwtUser.ts";

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

async function findOrCreateGitHubUser(profile: Profile) {
  const existingUser = await findUserByGithubId(profile.id);

  if (existingUser) {
    return existingUser;
  }

  const primaryEmail = profile.emails?.[0]?.value ?? "";

  return await createUser({
    githubId: profile.id,
    username: profile.username ?? "user",
    profileUrl: createGravatarUrl(primaryEmail),
  });
}

passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: env.githubCallbackUrl,
      scope: ["user:email"],
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: DoneCallback,
    ) => {
      findOrCreateGitHubUser(profile).then(
        (user) => done(null, user),
        (error: unknown) => done(toError(error), null),
      );
    },
  ),
);
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: (req: Request) => cookieExtractor(req) ?? null,
      secretOrKey: env.jwtSecret,
    },
    (jwtPayload: JwtPayload, done: DoneCallback) => {
      findUserByJwtPayload(jwtPayload).then(
        (user) => done(null, user ?? false),
        (error: unknown) => done(toError(error), false),
      );
    },
  ),
);

export default passport;
