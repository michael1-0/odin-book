import type { RequestHandler } from "express";
import { createImageUploadMiddleware } from "./imageUploadShared.ts";
import {
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_SIZE,
  POST_IMAGES_FIELD,
} from "@repo/constants";
import { POST_IMAGE_PART_COUNT_LIMIT } from "../constants/images.ts";

const postImagesUploadMiddleware: RequestHandler = createImageUploadMiddleware({
  field: POST_IMAGES_FIELD,
  maxFiles: MAX_POST_IMAGES,
  fileSize: MAX_POST_IMAGE_SIZE,
  partsLimit: POST_IMAGE_PART_COUNT_LIMIT,
  mode: "array",
  copy: {
    unsupportedType: "Post images must be JPEG, PNG, or WebP",
    tooLarge: `Each post image must be ${
      MAX_POST_IMAGE_SIZE / 1024 / 1024
    } MB or smaller`,
    tooManyFiles: `Only up to ${MAX_POST_IMAGES} post images can be uploaded`,
    tooManyFields: "Post image upload contains too many fields",
    tooManyParts: "Post image upload contains too many parts",
    invalidUpload: "Invalid post image upload",
  },
});

export default postImagesUploadMiddleware;
