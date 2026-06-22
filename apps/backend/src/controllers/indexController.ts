import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

function getHealth(req: Request, res: Response) {
  res.json({ status: "ok" });
}

async function getMe(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  return res.json(req.user);
}

export { getHealth, getMe };
