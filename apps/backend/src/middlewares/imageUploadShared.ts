// Shared factory for the multer-based image upload middlewares. The two
// upload endpoints (profile picture, post images) differ only in their
// quotas and error copy — the instance setup, MIME allowlist filtering,
// and MulterError mapping live here.
import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.ts";
import {
  IMAGE_MIME_TYPE_ALLOWLIST,
  UPLOAD_FIELD_COUNT_LIMIT,
} from "../constants/images.ts";

// Response copy for each failure mode, written per endpoint (the two
// endpoints word these slightly differently).
type ImageUploadCopy = {
  unsupportedType: string;
  tooLarge: string;
  tooManyFiles: string;
  tooManyFields: string;
  tooManyParts: string;
  invalidUpload: string;
};

type ImageUploadOptions = {
  /** Multer field name the upload accepts. */
  field: string;
  /** Max files per request (1 for a single-field upload). */
  maxFiles: number;
  /** Max size per file, in bytes. */
  fileSize: number;
  /** Max total multipart parts (fields + files) per request. */
  partsLimit: number;
  /** `single` accepts one file; `array` accepts up to `maxFiles`. */
  mode: "single" | "array";
  copy: ImageUploadCopy;
};

function multerErrorStatusCode(code: string) {
  return code === "LIMIT_FILE_SIZE" ? 413 : 400;
}

function getUploadErrorMessage(
  error: multer.MulterError,
  copy: ImageUploadCopy,
) {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return copy.tooLarge;
    case "LIMIT_FILE_COUNT":
    case "LIMIT_UNEXPECTED_FILE":
      return copy.tooManyFiles;
    case "LIMIT_FIELD_COUNT":
      return copy.tooManyFields;
    case "LIMIT_PART_COUNT":
      return copy.tooManyParts;
    default:
      return copy.invalidUpload;
  }
}

function createImageUploadMiddleware(
  options: ImageUploadOptions,
): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: options.fileSize,
      files: options.maxFiles,
      fields: UPLOAD_FIELD_COUNT_LIMIT,
      parts: options.partsLimit,
    },
    fileFilter: (_req, file, callback) => {
      if (!IMAGE_MIME_TYPE_ALLOWLIST.has(file.mimetype)) {
        callback(new AppError(options.copy.unsupportedType, 415));
        return;
      }

      callback(null, true);
    },
  });

  const uploadHandler =
    options.mode === "single"
      ? upload.single(options.field)
      : upload.array(options.field, options.maxFiles);
  const handler = uploadHandler as unknown as RequestHandler;

  return (req, res, next) => {
    handler(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        next(
          new AppError(
            getUploadErrorMessage(error, options.copy),
            multerErrorStatusCode(error.code),
          ),
        );
        return;
      }

      next(error);
    });
  };
}

export { createImageUploadMiddleware, type ImageUploadOptions };
