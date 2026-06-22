import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export function githubCallback(req: Request, res: Response) {
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

  // Redirect back to frontend
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
}
