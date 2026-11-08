// File sizes are in bytes. UI copy that mentions megabytes should derive
// it as `MAX_X_SIZE / 1024 / 1024` instead of hardcoding "5 MB".
export const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_POST_IMAGES = 3;
export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// Multer field names the frontend must upload with.
export const POST_IMAGES_FIELD = "images";
export const PROFILE_PICTURE_FIELD = "profilePicture";
