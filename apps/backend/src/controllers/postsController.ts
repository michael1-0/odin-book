import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import type {
  PostCreateSpec,
  PostGetSpec,
  PostIdParamsSpec,
  PostsGetResponse,
  PostsGetSpec,
} from "@repo/zod-validations";
import type { PostWhereInput } from "../db/generated/prisma/models.ts";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import {
  deletePostImageUrls,
  deleteUploadedPostImages,
  uploadPostImage,
} from "../utils/cloudinary.ts";
import {
  deletePostById,
  findPostWithImagesAndPosterId,
  getFeedPosts,
  getPostDetail,
  savePost,
} from "../db/queries/posts.ts";
import { COMMENTS_PAGE_SIZE, FEED_PAGE_SIZE } from "@repo/constants";
import { TRENDING_WINDOW_MS } from "../constants/feed.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import { splitPage } from "../utils/pagination.ts";

async function getPosts(req: ValidatedRequest<PostsGetSpec>, res: Response) {
  requireUser(req);

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

  const fetchedPosts = await getFeedPosts(where, req.query.cursor);

  const { items: pagedPosts, hasMore } = splitPage(
    fetchedPosts,
    FEED_PAGE_SIZE,
  );

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
  requireUser(req);

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
    newPost = await savePost(content, userId, imageUrls);
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await deleteUploadedPostImages(uploadedPublicIds);
    }
    throw error;
  }

  const feedPost = await getPostDetail(newPost.id);

  res.status(201).json({ data: feedPost });
}

async function getPost(req: ValidatedRequest<PostGetSpec>, res: Response) {
  const { postId } = req.params;
  const { include, offset: offsetParam } = req.query;

  const offset = offsetParam ?? 0;

  const post = await getPostDetail(
    postId,
    include === "comments" ? { comments: { offset } } : {},
  );

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  // The query fetches one comment beyond the page (`offset + pageSize + 1`)
  // so the split can report whether a next cursor exists.
  const page = Array.isArray(post.comments)
    ? splitPage(post.comments, offset + COMMENTS_PAGE_SIZE)
    : undefined;

  const hasNextPage = page?.hasMore ?? false;
  const nextCursor = hasNextPage ? offset + COMMENTS_PAGE_SIZE : null;

  return res.status(200).json({
    data: page ? { ...post, comments: page.items } : post,
    meta: { nextCursor, hasNextPage },
  });
}

async function deletePost(
  req: ValidatedRequest<PostIdParamsSpec>,
  res: Response,
) {
  requireUser(req);

  const { postId } = req.params;

  const post = await findPostWithImagesAndPosterId(postId);

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  if (post.posterId !== req.user.id) {
    throw new AppError(ERROR_MESSAGES.forbidden, 403);
  }

  await deletePostById(postId);

  if (post.images.length > 0) {
    await deletePostImageUrls(post.images.map((image) => image.url));
  }

  return res.status(200).json({ data: { id: postId } });
}

export { getPosts, createPost, getPost, deletePost };
