import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.ts";
import type { UserIdParams } from "@repo/zod-validations";

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;
const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_PICTURE_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
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
      return "Profile picture must be 5 MB or smaller";
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
  "profilePicture",
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
