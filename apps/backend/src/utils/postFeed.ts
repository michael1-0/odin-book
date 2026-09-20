import { prisma } from "../db/prisma.ts";

const postFeedSelect = {
  id: true,
  content: true,
  createdAt: true,
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      profileUrl: true,
    },
  },
  likes: {
    select: {
      userId: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
    },
    orderBy: {
      position: "asc",
    },
  },
} as const;

async function getPostFeedItem(postId: number) {
  const post = await prisma.post.findUnique({
    select: postFeedSelect,
    where: {
      id: postId,
    },
  });

  return post ?? null;
}

export { getPostFeedItem, postFeedSelect };
