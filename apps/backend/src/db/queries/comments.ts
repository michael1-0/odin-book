import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";

function saveComment(
  userId: number,
  postId: number,
  content: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.comment.create({
    data: {
      content,
      userId,
      postId,
    },
  });
}

export { saveComment };
