import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import type {
  PostCreateSpec,
  PostFeedItem,
  PostGetSpec,
  PostIdParamsSpec,
  PostsGetResponse,
  PostsGetSpec,
} from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { PostWhereInput } from "../db/generated/prisma/models.ts";
import {
  deletePostImageUrls,
  deleteUploadedPostImages,
  uploadPostImage,
} from "../utils/cloudinary.ts";
import { getPostFeedItem, postFeedSelect } from "../utils/postFeed.ts";
import { COMMENTS_PAGE_SIZE, FEED_PAGE_SIZE } from "@repo/constants";
import { TRENDING_WINDOW_MS } from "../constants/feed.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function getPosts(req: ValidatedRequest<PostsGetSpec>, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const scope = req.query.scope ?? "all";
  const where: PostWhereInput = {};

  if (req.query.period === "month") {
    where.createdAt = {
      gte: new Date(Date.now() - TRENDING_WINDOW_MS),
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
    take: FEED_PAGE_SIZE + 1,
  });

  const hasMore = posts.length > FEED_PAGE_SIZE;
  const pagedPosts: PostFeedItem[] = hasMore
    ? posts.slice(0, FEED_PAGE_SIZE)
    : posts;

  const response: PostsGetResponse = {
    data: pagedPosts,
    nextCursor: hasMore
      ? (pagedPosts[pagedPosts.length - 1]?.id ?? null)
      : null,
  };

  return res.status(200).json(response);
}

async function createPost(
  req: ValidatedRequest<PostCreateSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
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

async function getPost(req: ValidatedRequest<PostGetSpec>, res: Response) {
  const { postId } = req.params;
  const { include, offset: offsetParam } = req.query;

  const offset = offsetParam ?? 0;

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
              take: offset + COMMENTS_PAGE_SIZE + 1,
            }
          : false,
    },
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  const comments = post.comments;

  const hasNextPage =
    Array.isArray(comments) && comments.length > offset + COMMENTS_PAGE_SIZE;
  if (hasNextPage) {
    comments.pop();
  }

  const nextCursor = hasNextPage ? offset + COMMENTS_PAGE_SIZE : null;

  return res.status(200).json({
    data: post,
    meta: { nextCursor, hasNextPage },
  });
}

async function deletePost(
  req: ValidatedRequest<PostIdParamsSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const { postId } = req.params;

  const post = await prisma.post.findUnique({
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

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  if (post.posterId !== req.user.id) {
    throw new AppError(ERROR_MESSAGES.unauthorized, 403);
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });

  if (post.images.length > 0) {
    await deletePostImageUrls(post.images.map((image) => image.url));
  }

  return res.status(200).json({ data: { id: postId } });
}

export { getPosts, createPost, getPost, deletePost };
