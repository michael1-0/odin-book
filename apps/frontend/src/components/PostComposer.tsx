import { useEffect } from "react";
import { useFetcher } from "react-router";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_POST_IMAGES,
  POST_IMAGES_FIELD,
} from "@repo/constants";
import {
  type PostFeedItem,
  type PostFeedItemWithComments,
} from "@repo/zod-validations";
import { FORM_FIELDS } from "../constants/fields";
import { FORM_INTENTS } from "../constants/routes";
import type { ActionResult } from "../utils/actionResult";
import useImagePicker from "../hooks/useImagePicker";
import toast from "react-hot-toast";
import { ImagePlus, X } from "lucide-react";

type PostComposerProps = {
  onCreated: (post: PostFeedItem) => void;
};

// The "create post" form. Submits via useFetcher to the current route's
// action (no navigation), which keeps everything below the form (the feed)
// from being interrupted. `key={submissionId}` remounts the form after a
// successful post — clearing native inputs React can't control — while
// validation errors keep the form intact.
function PostComposer({ onCreated }: PostComposerProps) {
  const postFetcher = useFetcher<ActionResult<PostFeedItemWithComments>>();
  const {
    imagesInputRef,
    selectedImages,
    imagePreviewUrls,
    imageError,
    handleImagesChange,
    removeImage,
    reset,
  } = useImagePicker();

  const { state: postFetcherState } = postFetcher;
  const postResult = postFetcher.data;

  const isPosting = postFetcherState === "submitting";

  // Form resets
  const submissionId = postResult?.ok ? postResult.data.id : "initial";

  useEffect(() => {
    if (postFetcherState !== "idle" || !postResult) {
      return;
    }

    if (!postResult.ok) {
      toast.error(
        postResult.kind === "server"
          ? postResult.message
          : "Failed to create post",
      );
      return;
    }

    reset();
    toast.success("Post posted");
    onCreated(postResult.data);
  }, [postResult, postFetcherState, reset, onCreated]);

  const contentErrors =
    postResult?.ok === false && postResult.kind === "validation"
      ? postResult.fieldErrors.content
      : undefined;

  return (
    <section className="w-full rounded-lg bg-white text-left">
      <postFetcher.Form
        method="POST"
        encType="multipart/form-data"
        className="space-y-4"
        key={submissionId}
      >
        <div className="mb-2 min-h-8 text-sm text-red-600">
          {contentErrors?.[0]}
        </div>
        <label htmlFor="content" className="sr-only">
          Post Content
        </label>
        <textarea
          id="content"
          name={FORM_FIELDS.content}
          rows={4}
          required
          placeholder="Share something interesting..."
          className="w-full resize-none rounded-sm p-3 shadow-sm focus:ring-2 focus:outline-none"
          disabled={isPosting}
        />
        {imagePreviewUrls.length > 0 && (
          <div
            className={`grid gap-2 ${
              imagePreviewUrls.length === 1
                ? "grid-cols-1"
                : imagePreviewUrls.length === 2
                  ? "grid-cols-2"
                  : "h-48 grid-cols-2 grid-rows-2"
            }`}
          >
            {imagePreviewUrls.map((url, index) => (
              <div
                key={url}
                className={`relative ${
                  imagePreviewUrls.length >= 3 && index === 0
                    ? "row-span-2"
                    : ""
                }`}
              >
                <img
                  src={url}
                  alt={`Selected image ${index + 1}`}
                  className={`w-full rounded-sm object-cover ${
                    imagePreviewUrls.length >= 3 ? "h-full" : "h-40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isPosting}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white focus:ring-2 focus:outline-none disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mb-2 min-h-8 text-sm text-red-600">{imageError}</div>
        <label
          htmlFor="post-images"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-neutral-500"
        >
          <ImagePlus size={20} />
          {selectedImages.length > 0
            ? `Add images (${selectedImages.length}/${MAX_POST_IMAGES})`
            : "Add images"}
        </label>
        <input
          type="file"
          name={POST_IMAGES_FIELD}
          id="post-images"
          ref={imagesInputRef}
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
          multiple
          onChange={handleImagesChange}
          disabled={isPosting}
          className="sr-only"
        />
        <button
          type="submit"
          disabled={isPosting}
          className="w-full rounded-sm bg-black px-4 py-2 font-medium text-white transition-colors focus:ring-2 focus:outline-none disabled:opacity-50"
          name={FORM_FIELDS.intent}
          value={FORM_INTENTS.createPost}
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </postFetcher.Form>
    </section>
  );
}

export default PostComposer;
