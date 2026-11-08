import { ACCEPTED_IMAGE_MIME_TYPES } from "@repo/constants";

// Mimetype allowlist used by the multer upload middlewares.
export const IMAGE_MIME_TYPE_ALLOWLIST = new Set<string>(
  ACCEPTED_IMAGE_MIME_TYPES,
);

// Multer quotas shared by both upload middlewares. `fields` is the max
// number of non-file form fields; `parts` limits fields + files.
export const UPLOAD_FIELD_COUNT_LIMIT = 5;
export const POST_IMAGE_PART_COUNT_LIMIT = 9;
export const PROFILE_PICTURE_PART_COUNT_LIMIT = 6;

export const PROFILE_PICTURE_FOLDER = "odin-book/profile-pictures";
export const POST_IMAGES_FOLDER = "odin-book/post-images";
// Cloudinary format names ("jpg"/"png"/"webp") — jpg corresponds to the
// image/jpeg entry in ACCEPTED_IMAGE_MIME_TYPES.
export const UPLOAD_ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
