import { useCallback, useEffect, useState, type RefObject } from "react";
import { FEED_PAGE_SIZE } from "@repo/constants";
import toast from "react-hot-toast";
import type { PostFeedItem, PostsGetResponse } from "@repo/zod-validations";
import { loadPosts } from "../services/posts";
import { LOAD_MORE_ROOT_MARGIN } from "../constants/ui";

// Cursor-paginated feed state. The first page arrives from the route loader
// (`initialPage`); once mounted this hook owns the feed: pages accumulate
// client-side as the user scrolls, and `insertPost` merges a freshly created
// post back into the first page. `loadMoreRef` belongs to the component that
// renders the sentinel section — the hook only attaches the observer.
//
// Known races preserved from the original implementation:
// - A cursor fetch still in flight when a post is created flushes its page
//   after the insert-collapse, which can drop the one post sliced off page 1.
// - No AbortController: a late fetch can resolve into state updates after
//   unmount or after `insertPost` (harmless in React 19).
function useInfiniteFeed(
  initialPage: PostsGetResponse,
  loadMoreRef: RefObject<HTMLDivElement | null>,
) {
  const [pages, setPages] = useState<PostsGetResponse[]>(() => [initialPage]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const posts = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;
  const hasMore = nextCursor !== null;

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

  // Merge a freshly created post into the first page: dedupe, keep the page
  // at page size, and recompute the cursor to the (possibly new) last item so
  // the next fetched page keeps its contract ("posts older than this").
  // Anything beyond the first page is dropped — posting resets the scroll.
  const insertPost = useCallback((createdPost: PostFeedItem) => {
    setPages((currentPages) => {
      const firstPage = currentPages[0];

      if (!firstPage) {
        return [{ data: [createdPost], nextCursor: null }];
      }

      const mergedPosts = [
        createdPost,
        ...firstPage.data.filter((post) => post.id !== createdPost.id),
      ].slice(0, FEED_PAGE_SIZE);

      return [
        {
          data: mergedPosts,
          nextCursor:
            mergedPosts.length === FEED_PAGE_SIZE
              ? (mergedPosts[mergedPosts.length - 1]?.id ?? null)
              : null,
        },
      ];
    });
    setLoadError(null);
    setIsLoadingMore(false);
  }, []);

  // Re-created whenever loading enablement changes (nextCursor /
  // isLoadingMore / loadError — the loadNextPage dep alone would suffice,
  // since those same states are encoded in its callback identity). A fresh
  // IntersectionObserver fires immediately while the sentinel is still in
  // view, which is what chains pages after a fetch with no scroll events.
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
        rootMargin: LOAD_MORE_ROOT_MARGIN,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMoreRef, loadNextPage, nextCursor, isLoadingMore, loadError]);

  return {
    posts,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
    insertPost,
  };
}

export default useInfiniteFeed;
