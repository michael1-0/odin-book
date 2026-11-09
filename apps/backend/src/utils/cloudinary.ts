import "../config/env.ts";
import { v2 as cloudinary } from "cloudinary";
import {
  POST_IMAGES_FOLDER,
  PROFILE_PICTURE_FOLDER,
  UPLOAD_ALLOWED_FORMATS,
} from "../constants/images.ts";

cloudinary.config();

type ImageUploadParams = {
  folder: string;
  publicId: string;
  overwrite: boolean;
  invalidate: boolean;
};

function uploadBufferAsImage(
  buffer: Buffer,
  params: ImageUploadParams,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: params.folder,
        public_id: params.publicId,
        resource_type: "image",
        ...(params.overwrite ? { overwrite: true } : {}),
        ...(params.invalidate ? { invalidate: true } : {}),
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

function uploadProfilePicture(buffer: Buffer, userId: number) {
  return uploadBufferAsImage(buffer, {
    folder: PROFILE_PICTURE_FOLDER,
    publicId: `user-${userId}`,
    overwrite: true,
    invalidate: true,
  });
}

function uploadPostImage(buffer: Buffer, publicId: string) {
  return uploadBufferAsImage(buffer, {
    folder: POST_IMAGES_FOLDER,
    publicId,
    overwrite: false,
    invalidate: false,
  });
}

async function deleteUploadedPostImages(publicIds: string[]) {
  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(`${POST_IMAGES_FOLDER}/${publicId}`, {
        invalidate: true,
      }),
    ),
  );
}

async function deletePostImageUrls(urls: string[]) {
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
