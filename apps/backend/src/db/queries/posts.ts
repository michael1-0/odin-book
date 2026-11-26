import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import type { PostWhereInput } from "../generated/prisma/models.ts";
import { COMMENTS_PAGE_SIZE, FEED_PAGE_SIZE } from "@repo/constants";
import { TRENDING_WINDOW_MS } from "../../constants/feed.ts";

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

async function postExists(
  postId: number,
  client: Prisma.TransactionClient = prisma,
) {
  const post = await client.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  return post !== null;
}

type FeedPostsQuery = {
  scope: "all" | "me" | "following";
  period?: "month" | undefined;
  viewerId: number;
};

function buildFeedWhere({ scope, period, viewerId }: FeedPostsQuery) {
  const where: PostWhereInput = {};

  if (period === "month") {
    where.createdAt = {
      gte: new Date(Date.now() - TRENDING_WINDOW_MS),
    };
  }

  if (scope === "me") {
    where.user = { id: viewerId };
  }

  if (scope === "following") {
    where.user = {
      following: {
        some: {
          followedById: viewerId,
        },
      },
    };
  }

  return where;
}

function getFeedPosts(
  query: FeedPostsQuery,
  cursor: number | undefined,
  client: Prisma.TransactionClient = prisma,
) {
  return client.post.findMany({
    select: postFeedSelect,
    where: buildFeedWhere(query),
    orderBy: {
      id: "desc",
    },
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
    take: FEED_PAGE_SIZE + 1,
  });
}

function savePost(
  content: string,
  posterId: number,
  imageUrls: string[],
  client: Prisma.TransactionClient = prisma,
) {
  return client.post.create({
    data: {
      content,
      posterId,
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls.map((url, index) => ({
                url,
                position: index,
              })),
            },
          }
        : {}),
    },
  });
}

function getPostDetail(
  postId: number,
  options: { comments?: { offset: number } } = {},
  client: Prisma.TransactionClient = prisma,
) {
  // Comments are always selected so the payload has one static shape —
  // Prisma derives it per select, and a runtime-conditional select value
  // (`comments: options.comments ? {...} : false`) makes the generated
  // type fall back to the default comment shape, dropping the selected
  // author. When the caller did not request comments the take is 0, which
  // returns an empty list.
  return client.post.findUnique({
    select: {
      ...postFeedSelect,
      comments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              profileUrl: true,
              username: true,
            },
          },
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: options.comments
          ? options.comments.offset + COMMENTS_PAGE_SIZE + 1
          : 0,
      },
    },
    where: {
      id: postId,
    },
  });
}

function findPostWithImagesAndPosterId(
  postId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.post.findUnique({
    select: {
      posterId: true,
      images: {
        select: {
          url: true,
        },
      },
    },
    where: {
      id: postId,
    },
  });
}

async function deletePostById(
  postId: number,
  client: Prisma.TransactionClient = prisma,
) {
  await client.post.delete({
    where: {
      id: postId,
    },
  });
}

export {
  postFeedSelect,
  postExists,
  getFeedPosts,
  savePost,
  getPostDetail,
  findPostWithImagesAndPosterId,
  deletePostById,
};
