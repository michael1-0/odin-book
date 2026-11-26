import type { Request, Response } from "express";

function getHealth(_req: Request, res: Response) {
  res.json({ status: "ok" });
}

export { getHealth };
