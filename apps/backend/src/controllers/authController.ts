import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

function githubCallback(req: Request, res: Response) {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }

  const user = req.user;

  const payload = {
    sub: user.id,
    githubId: user.githubId,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
}

function postLogout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export { githubCallback, postLogout };
