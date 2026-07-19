import { useCallback, useEffect, useRef, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { getFollowingPostsFromLastMonth, loadPosts } from "../services/posts";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";
import type { PostsGetResponse } from "@repo/zod-validations";
import toast from "react-hot-toast";

async function loader() {
  return await getFollowingPostsFromLastMonth();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Updates() {
  const { user } = useRouteLoaderData("user-data");
  const initialPage = useLoaderData() as PostsGetResponse;
  const [pages, setPages] = useState<PostsGetResponse[]>(() => [initialPage]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const posts = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;

  // Cursor pagination
  const loadNextPage = useCallback(
    async (force = false) => {
      if (nextCursor === null || isLoadingMore || (loadError && !force)) {
        return;
      }

      setIsLoadingMore(true);

      try {
        const page = await loadPosts({
          cursor: nextCursor,
          scope: "following",
          period: "month",
        });
        setPages((currentPages) => [...currentPages, page]);
        setLoadError(null);
      } catch {
        setLoadError("Couldn't load more posts.");
        toast.error("Failed to load more posts");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [loadError, nextCursor, isLoadingMore],
  );
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

  return (
    <PageContainer>
      <PageHead
        title="Updates"
        content="Posts from people you follow, over the last 30 days."
      />
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

Updates.loader = loader;
Updates.action = action;

export default Updates;
