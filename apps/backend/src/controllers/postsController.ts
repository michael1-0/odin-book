import type { Request, Response } from "express";
import type {
  PostFeedItem,
  PostCreateBody,
  PostIdParams,
  PostGetQuery,
  PostsGetResponse,
  PostsGetQuery,
} from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { PostWhereInput } from "../db/generated/prisma/models.ts";
import {
  deleteUploadedPostImages,
  uploadPostImage,
} from "../utils/cloudinary.ts";
import {
  getPostFeedItem,
  normalizePostFeedItem,
  postFeedSelect,
} from "../utils/postFeed.ts";

const PAGE_SIZE = 10;

async function getPosts(
  req: Request<unknown, unknown, unknown, PostsGetQuery>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const scope = req.query.scope ?? "all";
  const where: PostWhereInput = {};

  if (req.query.period === "month") {
    where.createdAt = {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  if (scope === "me") {
    where.user = { id: req.user.id };
  }

  if (scope === "following") {
    where.user = {
      following: {
        some: {
          followedById: req.user.id,
        },
      },
    };
  }

  const posts = await prisma.post.findMany({
    select: postFeedSelect,
    where,
    orderBy: {
      id: "desc",
    },
    ...(req.query.cursor
      ? {
          cursor: {
            id: req.query.cursor,
          },
          skip: 1,
        }
      : {}),
    take: PAGE_SIZE + 1,
  });

  const hasMore = posts.length > PAGE_SIZE;
  const pagedPosts: PostFeedItem[] = (
    hasMore ? posts.slice(0, PAGE_SIZE) : posts
  ).map(normalizePostFeedItem);

  const response: PostsGetResponse = {
    data: pagedPosts,
    nextCursor: hasMore
      ? (pagedPosts[pagedPosts.length - 1]?.id ?? null)
      : null,
  };

  return res.status(200).json(response);
}

async function createPost(
  req: Request<unknown, unknown, PostCreateBody>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const userId = req.user.id;
  const { content } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  const imageUrls: string[] = [];
  const uploadedPublicIds: string[] = [];

  if (files && files.length > 0) {
    const publicIdBase = `post-${userId}-${Date.now()}`;

    const results = await Promise.allSettled(
      files.map((file, index) =>
        uploadPostImage(file.buffer, `${publicIdBase}-${index}`),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        imageUrls.push(result.value);
        uploadedPublicIds.push(`${publicIdBase}-${index}`);
      }
    });

    if (uploadedPublicIds.length !== results.length) {
      await deleteUploadedPostImages(uploadedPublicIds);
      console.error("[postImagesUpload] Some Cloudinary uploads failed");
      throw new AppError("Unable to upload post images", 502, false);
    }
  }

  let newPost;

  try {
    newPost = await prisma.post.create({
      data: {
        content,
        posterId: userId,
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
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await deleteUploadedPostImages(uploadedPublicIds);
    }
    throw error;
  }

  const feedPost = await getPostFeedItem(newPost.id);

  res.status(200).json({ data: feedPost });
}

async function getPost(
  req: Request<PostIdParams, unknown, unknown, PostGetQuery>,
  res: Response,
) {
  const { postId } = req.params;
  const { include, offset: offsetParam } = req.query;

  const offset = offsetParam ?? 0;
  const commentsLimit = 10;

  const post = await prisma.post.findUnique({
    select: {
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
      comments:
        include === "comments"
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
              take: offset + commentsLimit + 1,
            }
          : false,
    },
    where: {
      id: postId,
    },
  });

  const comments = post?.comments;

  const hasNextPage =
    Array.isArray(comments) && comments.length > offset + commentsLimit;
  if (hasNextPage) {
    comments.pop();
  }

  const nextCursor = hasNextPage ? offset + commentsLimit : null;

  return res.status(200).json({
    data: post,
    meta: { nextCursor, hasNextPage },
  });
}

export { getPosts, createPost, getPost };
