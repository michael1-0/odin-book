import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.ts";
import type { UserIdParams } from "@repo/zod-validations";
import {
  MAX_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_FIELD,
} from "@repo/constants";
import {
  IMAGE_MIME_TYPE_ALLOWLIST,
  PROFILE_PICTURE_PART_COUNT_LIMIT,
  UPLOAD_FIELD_COUNT_LIMIT,
} from "../constants/images.ts";

const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_PICTURE_SIZE,
    files: 1,
    fields: UPLOAD_FIELD_COUNT_LIMIT,
    parts: PROFILE_PICTURE_PART_COUNT_LIMIT,
  },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPE_ALLOWLIST.has(file.mimetype)) {
      callback(
        new AppError("Profile picture must be a JPEG, PNG, or WebP image", 415),
      );
      return;
    }

    callback(null, true);
  },
});

function getMulterErrorMessage(error: multer.MulterError) {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return `Profile picture must be ${
        MAX_PROFILE_PICTURE_SIZE / 1024 / 1024
      } MB or smaller`;
    case "LIMIT_FILE_COUNT":
    case "LIMIT_UNEXPECTED_FILE":
      return "Only one profile picture can be uploaded";
    case "LIMIT_FIELD_COUNT":
      return "Profile picture upload contains too many fields";
    case "LIMIT_PART_COUNT":
      return "Profile picture upload contains too many parts";
    default:
      return "Invalid profile picture upload";
  }
}

const profilePictureUploadHandler = profilePictureUpload.single(
  PROFILE_PICTURE_FIELD,
) as unknown as RequestHandler<UserIdParams>;

const profilePictureUploadMiddleware: RequestHandler<UserIdParams> = (
  req,
  res,
  next,
) => {
  profilePictureUploadHandler(req, res, (error) => {
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

export default profilePictureUploadMiddleware;
