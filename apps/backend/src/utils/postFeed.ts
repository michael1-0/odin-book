import type { PostFeedItem } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";

type PostFeedItemFromDb = {
  id: number;
  content: string;
  createdAt: Date;
  _count: {
    comments: number;
    likes: number;
  };
  user: {
    id: number;
    username: string;
    profileUrl: string | null;
  };
  likes: {
    userId: number;
  }[];
};

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
} as const;

function normalizePostFeedItem(post: PostFeedItemFromDb): PostFeedItem {
  return {
    ...post,
    user: {
      ...post.user,
      profileUrl: post.user.profileUrl ?? "",
    },
  };
}

async function getPostFeedItem(postId: number) {
  const post = await prisma.post.findUnique({
    select: postFeedSelect,
    where: {
      id: postId,
    },
  });

  return post ? normalizePostFeedItem(post) : null;
}

export { getPostFeedItem, normalizePostFeedItem, postFeedSelect };
