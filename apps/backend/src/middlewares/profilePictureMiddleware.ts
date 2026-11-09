import type { RequestHandler } from "express";
import type { UserIdParams } from "@repo/zod-validations";
import { createImageUploadMiddleware } from "./imageUploadShared.ts";
import {
  MAX_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_FIELD,
} from "@repo/constants";
import { PROFILE_PICTURE_PART_COUNT_LIMIT } from "../constants/images.ts";

const handler = createImageUploadMiddleware({
  field: PROFILE_PICTURE_FIELD,
  maxFiles: 1,
  fileSize: MAX_PROFILE_PICTURE_SIZE,
  partsLimit: PROFILE_PICTURE_PART_COUNT_LIMIT,
  mode: "single",
  copy: {
    unsupportedType: "Profile picture must be a JPEG, PNG, or WebP image",
    tooLarge: `Profile picture must be ${
      MAX_PROFILE_PICTURE_SIZE / 1024 / 1024
    } MB or smaller`,
    tooManyFiles: "Only one profile picture can be uploaded",
    tooManyFields: "Profile picture upload contains too many fields",
    tooManyParts: "Profile picture upload contains too many parts",
    invalidUpload: "Invalid profile picture upload",
  },
});

// Multer's handler types don't line up with Express's route generics, so the
// cast matches what multer's own handler would have needed anyway.
const profilePictureUploadMiddleware =
  handler as unknown as RequestHandler<UserIdParams>;

export default profilePictureUploadMiddleware;
