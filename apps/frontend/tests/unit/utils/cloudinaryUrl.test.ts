import { describe, expect, it } from "vitest";
import getOptimizedImageUrl from "../../../src/utils/cloudinaryUrl";

describe("getOptimizedImageUrl", () => {
  it("leaves non-Cloudinary URLs untouched", () => {
    const url = "https://example.com/photo.png";

    expect(getOptimizedImageUrl(url)).toBe(url);
    expect(getOptimizedImageUrl(url, 200)).toBe(url);
  });

  it("injects the default 900px transform into Cloudinary URLs", () => {
    expect(
      getOptimizedImageUrl(
        "https://res.cloudinary.com/demo/image/upload/v123/sample.jpg",
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_900,c_limit,q_auto,f_auto/v123/sample.jpg",
    );
  });

  it("uses the requested width", () => {
    expect(
      getOptimizedImageUrl(
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        640,
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_640,c_limit,q_auto,f_auto/sample.jpg",
    );
  });
});
