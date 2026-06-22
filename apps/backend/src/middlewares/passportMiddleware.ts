import type { DoneCallback } from "passport";
import type { JwtPayload } from "jsonwebtoken";
import type { Profile } from "passport-github2";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "../db/prisma.ts";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
    },
    async function (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: DoneCallback,
    ) {
      let findUser;

      try {
        findUser = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });
      } catch (error) {
        return done(error, null);
      }

      try {
        if (!findUser) {
          const newUser = await prisma.user.create({
            data: {
              githubId: profile.id,
              username: profile.username ?? "",
            },
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "default_secret",
    },
    async (jwtPayload: JwtPayload, done: DoneCallback) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: Number(jwtPayload.sub) },
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
