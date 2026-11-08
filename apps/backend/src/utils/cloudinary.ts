import "../config/env.ts";
import { v2 as cloudinary } from "cloudinary";
import {
  POST_IMAGES_FOLDER,
  PROFILE_PICTURE_FOLDER,
  UPLOAD_ALLOWED_FORMATS,
} from "../constants/images.ts";

function uploadProfilePicture(buffer: Buffer, userId: number) {
  cloudinary.config();

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PROFILE_PICTURE_FOLDER,
        public_id: `user-${userId}`,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
        allowed_formats: UPLOAD_ALLOWED_FORMATS,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no upload result"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}

function uploadPostImage(buffer: Buffer, publicId: string) {
  cloudinary.config();

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: POST_IMAGES_FOLDER,
        public_id: publicId,
        resource_type: "image",
        allowed_formats: UPLOAD_ALLOWED_FORMATS,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no upload result"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}

async function deleteUploadedPostImages(publicIds: string[]) {
  cloudinary.config();

  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(`${POST_IMAGES_FOLDER}/${publicId}`, {
        invalidate: true,
      }),
    ),
  );
}

async function deletePostImageUrls(urls: string[]) {
  cloudinary.config();

  await Promise.allSettled(
    urls.map((url) => {
      const publicId = url.split(`${POST_IMAGES_FOLDER}/`)[1];

      if (!publicId) {
        return Promise.resolve();
      }

      return cloudinary.uploader.destroy(
        `${POST_IMAGES_FOLDER}/${publicId.replace(/\.[^.]+$/, "")}`,
        { invalidate: true },
      );
    }),
  );
}

export {
  deletePostImageUrls,
  deleteUploadedPostImages,
  uploadPostImage,
  uploadProfilePicture,
};
