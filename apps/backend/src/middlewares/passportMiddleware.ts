import type { DoneCallback } from "passport";
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

passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: env.githubCallbackUrl,
      scope: ["user:email"],
    },
    async function (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: DoneCallback,
    ) {
      let findUser;

      try {
        findUser = await findUserByGithubId(profile.id);
      } catch (error) {
        return done(error, null);
      }

      try {
        if (!findUser) {
          const primaryEmail = profile.emails?.[0]?.value || "";
          const newUser = await createUser({
            githubId: profile.id,
            username: profile.username ?? "user",
            profileUrl: createGravatarUrl(primaryEmail),
          });
          return done(null, newUser);
        }
        return done(null, findUser);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: env.jwtSecret,
    },
    async (jwtPayload: JwtPayload, done: DoneCallback) => {
      try {
        const user = await findUserByJwtPayload(jwtPayload);

        if (user) {
          return done(null, user);
        }

        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
