import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { prisma } from "../db/prisma.ts";

async function createComment(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const userId = req.user.id;
  const { postId, content } = req.body;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId,
      postId,
    },
  });

  return res.status(200).json({ data: comment });
}

export { createComment };
