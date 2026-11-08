import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.ts";
import {
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_SIZE,
  POST_IMAGES_FIELD,
} from "@repo/constants";
import {
  IMAGE_MIME_TYPE_ALLOWLIST,
  POST_IMAGE_PART_COUNT_LIMIT,
  UPLOAD_FIELD_COUNT_LIMIT,
} from "../constants/images.ts";

const postImagesUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_POST_IMAGE_SIZE,
    files: MAX_POST_IMAGES,
    fields: UPLOAD_FIELD_COUNT_LIMIT,
    parts: POST_IMAGE_PART_COUNT_LIMIT,
  },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPE_ALLOWLIST.has(file.mimetype)) {
      callback(new AppError("Post images must be JPEG, PNG, or WebP", 415));
      return;
    }

    callback(null, true);
  },
});

function getMulterErrorMessage(error: multer.MulterError) {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return `Each post image must be ${MAX_POST_IMAGE_SIZE / 1024 / 1024} MB or smaller`;
    case "LIMIT_FILE_COUNT":
    case "LIMIT_UNEXPECTED_FILE":
      return `Only up to ${MAX_POST_IMAGES} post images can be uploaded`;
    case "LIMIT_FIELD_COUNT":
      return "Post image upload contains too many fields";
    case "LIMIT_PART_COUNT":
      return "Post image upload contains too many parts";
    default:
      return "Invalid post image upload";
  }
}

const postImagesUploadHandler = postImagesUpload.array(
  POST_IMAGES_FIELD,
  MAX_POST_IMAGES,
) as unknown as RequestHandler;

const postImagesUploadMiddleware: RequestHandler = (req, res, next) => {
  postImagesUploadHandler(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(
        new AppError(
          getMulterErrorMessage(error),
          error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
        ),
      );
      return;
    }

    next(error);
  });
};

export default postImagesUploadMiddleware;
