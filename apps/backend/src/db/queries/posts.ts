import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import type { PostWhereInput } from "../generated/prisma/models.ts";
import { COMMENTS_PAGE_SIZE, FEED_PAGE_SIZE } from "@repo/constants";

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

function getFeedPosts(
  where: PostWhereInput,
  cursor: number | undefined,
  client: Prisma.TransactionClient = prisma,
) {
  return client.post.findMany({
    select: postFeedSelect,
    where,
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
  return client.post.findUnique({
    select: {
      ...postFeedSelect,
      comments: options.comments
        ? {
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
            take: options.comments.offset + COMMENTS_PAGE_SIZE + 1,
          }
        : false,
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
