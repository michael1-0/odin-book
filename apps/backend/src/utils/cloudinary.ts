import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const PROFILE_PICTURE_FOLDER = "odin-book/profile-pictures";

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
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
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

export default uploadProfilePicture;
