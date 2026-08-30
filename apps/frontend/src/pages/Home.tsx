import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_SIZE,
  PostCreateBodySchema,
  z,
  type PostFeedItem,
  type PostsGetResponse,
} from "@repo/zod-validations";
import { createPost, loadPosts } from "../services/posts";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";
import toast from "react-hot-toast";
import { CircleX, ImagePlus, X } from "lucide-react";

const PAGE_SIZE = 10;

async function loader() {
  return await loadPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-post": {
      const parsedPost = PostCreateBodySchema.safeParse({
        content: formData.get("content"),
      });

      if (!parsedPost.success) {
        return {
          error: true,
          errors: z.flattenError(parsedPost.error).fieldErrors,
        };
      }

      return await createPost(formData);
    }
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Home() {
  const { user } = useRouteLoaderData("user-data");
  const postFetcher = useFetcher();
  const { data: postFetcherData, state: postFetcherState } = postFetcher;

  const initialPage = useLoaderData() as PostsGetResponse;
  const [pages, setPages] = useState<PostsGetResponse[]>(() => [initialPage]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const imagesInputRef = useRef<HTMLInputElement | null>(null);
  const imagePreviewUrlsRef = useRef<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const isPosting = postFetcherState === "submitting";
  const hasError = postFetcherData?.error;
  const posts = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;

  // Form resets
  const submissionId =
    postFetcherData && !hasError ? postFetcherData.id : "initial";

  const revokeAllPreviews = useCallback(() => {
    imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imagePreviewUrlsRef.current = [];
  }, []);

  // Toasts
  useEffect(() => {
    if (postFetcherState === "idle" && postFetcherData) {
      if (hasError) {
        toast.error(postFetcherData.message ?? "Failed to create post");
      } else {
        revokeAllPreviews();
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setImageError(null);
        if (imagesInputRef.current) {
          imagesInputRef.current.value = "";
        }
        toast.success("Post posted");
      }
    }
  }, [postFetcherState, postFetcherData, hasError, revokeAllPreviews]);

  useEffect(() => {
    return () => {
      imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function syncInputFiles(files: File[]) {
    if (!imagesInputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    imagesInputRef.current.files = dataTransfer.files;
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (selectedImages.length + files.length > MAX_POST_IMAGES) {
      setImageError(`Only up to ${MAX_POST_IMAGES} images can be uploaded`);
      event.currentTarget.value = "";
      return;
    }

    if (files.some((file) => file.size > MAX_POST_IMAGE_SIZE)) {
      setImageError("Each image must be 5 MB or smaller");
      event.currentTarget.value = "";
      return;
    }

    const combined = [...selectedImages, ...files];
    const urls = files.map((file) => URL.createObjectURL(file));
    imagePreviewUrlsRef.current = [...imagePreviewUrlsRef.current, ...urls];
    syncInputFiles(combined);
    setImageError(null);
    setSelectedImages(combined);
    setImagePreviewUrls((current) => [...current, ...urls]);
  }

  function removeImage(index: number) {
    const removedUrl = imagePreviewUrlsRef.current[index];

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }

    const remainingImages = selectedImages.filter((_, i) => i !== index);

    imagePreviewUrlsRef.current = imagePreviewUrlsRef.current.filter(
      (_, i) => i !== index,
    );
    syncInputFiles(remainingImages);
    setSelectedImages(remainingImages);
    setImagePreviewUrls((current) => current.filter((_, i) => i !== index));
    setImageError(null);
  }

  // Cursor pagination
  const loadNextPage = useCallback(
    async (force = false) => {
      if (nextCursor === null || isLoadingMore || (loadError && !force)) {
        return;
      }

      setIsLoadingMore(true);

      try {
        const page = await loadPosts({ cursor: nextCursor });
        setPages((currentPages) => [...currentPages, page]);
        setLoadError(null);
      } catch {
        setLoadError("Couldn't load more posts.");
        toast.error("Failed to load more posts");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [nextCursor, isLoadingMore, loadError],
  );
  useEffect(() => {
    if (postFetcherState !== "idle" || !postFetcherData || hasError) {
      return;
    }

    const createdPost = postFetcherData as PostFeedItem;

    setPages((currentPages) => {
      const firstPage = currentPages[0];

      if (!firstPage) {
        return [{ data: [createdPost], nextCursor: null }];
      }

      const mergedPosts = [
        createdPost,
        ...firstPage.data.filter((post) => post.id !== createdPost.id),
      ].slice(0, PAGE_SIZE);

      return [
        {
          data: mergedPosts,
          nextCursor:
            mergedPosts.length === PAGE_SIZE
              ? (mergedPosts[mergedPosts.length - 1]?.id ?? null)
              : null,
        },
      ];
    });
    setLoadError(null);
    setIsLoadingMore(false);
  }, [hasError, postFetcherData, postFetcherState]);
  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || nextCursor === null || isLoadingMore || loadError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        void loadNextPage();
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadNextPage, nextCursor, isLoadingMore, loadError]);

  const errors = postFetcherData?.errors;
  const contentErrors = errors?.content;

  return (
    <PageContainer>
      <PageHead
        title="Home"
        content="You can post here, and look at the latest posts."
      />
      <section className="w-full rounded-lg bg-white text-left">
        <postFetcher.Form
          method="POST"
          encType="multipart/form-data"
          className="space-y-4"
          key={submissionId}
        >
          <div className="mb-2 text-sm text-red-600 min-h-8">
            {contentErrors && (
              <div className="flex gap-2 items-center">
                <CircleX size={20} />
                {contentErrors[0]}
              </div>
            )}
          </div>
          <label htmlFor="content" className="sr-only">
            Post Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            required
            placeholder="Share something interesting..."
            className="w-full p-3 shadow-sm rounded-sm resize-none focus:outline-none focus:ring-2"
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
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white focus:outline-none focus:ring-2 disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mb-2 text-sm text-red-600 min-h-8">
            {imageError && (
              <div className="flex gap-2 items-center">
                <CircleX size={20} />
                {imageError}
              </div>
            )}
          </div>
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
            name="images"
            id="post-images"
            ref={imagesInputRef}
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
            disabled={isPosting}
            className="sr-only"
          />
          <button
            type="submit"
            disabled={isPosting}
            className="px-4 py-2 w-full bg-black text-white font-medium rounded-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors"
            name="intent"
            value="create-post"
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </postFetcher.Form>
      </section>
      <section className="flex flex-col gap-4 w-full">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </section>
      <section
        ref={loadMoreRef}
        className="flex w-full items-center justify-center text-sm text-neutral-500"
      >
        {loadError ? (
          <button
            type="button"
            onClick={() => void loadNextPage(true)}
            className="rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200"
          >
            Retry loading more
          </button>
        ) : isLoadingMore ? (
          "Loading more posts..."
        ) : (
          nextCursor && "Scroll to load more"
        )}
      </section>
    </PageContainer>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
