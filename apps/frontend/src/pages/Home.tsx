import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PostCreateSchema,
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
import { CircleX } from "lucide-react";

const PAGE_SIZE = 10;

async function loader() {
  return await loadPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-post": {
      const parsedPost = PostCreateSchema.safeParse({
        content: formData.get("content"),
      });

      if (!parsedPost.success) {
        return {
          error: true,
          errors: z.flattenError(parsedPost.error).fieldErrors,
        };
      }

      return await createPost(parsedPost.data.content);
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

  const isPosting = postFetcherState === "submitting";
  const hasError = postFetcherData?.error;
  const posts = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;

  // Form resets
  const submissionId =
    postFetcherData && !hasError ? postFetcherData.id : "initial";

  // Toasts
  useEffect(() => {
    if (postFetcherState === "idle" && postFetcherData) {
      if (hasError) {
        toast.error("Failed to create post");
      } else {
        toast.success("Post posted");
      }
    }
  }, [postFetcherState, postFetcherData, hasError]);

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
