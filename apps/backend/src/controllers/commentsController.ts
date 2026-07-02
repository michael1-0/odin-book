import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { prisma } from "../db/prisma.ts";

async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 403);
    }

    const userId = req.user.id;
    const { postId, content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
    });

    return res.status(200).json({ data: comment });
  } catch (error) {
    next(error);
  }
}

export { createComment };
