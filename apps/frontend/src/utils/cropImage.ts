import type { Area } from "react-easy-crop";

const CROPPED_IMAGE_SIZE = 512;

function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = imageUrl;
  });
}

async function getCroppedImageBlob(imageUrl: string, croppedAreaPixels: Area) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is not supported");
  }

  canvas.width = CROPPED_IMAGE_SIZE;
  canvas.height = CROPPED_IMAGE_SIZE;

  const { x, y, width, height } = croppedAreaPixels;

  context.beginPath();
  context.arc(
    CROPPED_IMAGE_SIZE / 2,
    CROPPED_IMAGE_SIZE / 2,
    CROPPED_IMAGE_SIZE / 2,
    0,
    Math.PI * 2,
  );
  context.clip();
  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    CROPPED_IMAGE_SIZE,
    CROPPED_IMAGE_SIZE,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Failed to create image blob"));
        }
      },
      "image/png",
      1,
    );
  });
}

export default getCroppedImageBlob;
