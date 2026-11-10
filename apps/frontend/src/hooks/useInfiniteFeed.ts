import { useCallback, useEffect, useState, type RefObject } from "react";
import { FEED_PAGE_SIZE } from "@repo/constants";
import toast from "react-hot-toast";
import { LOAD_MORE_ROOT_MARGIN } from "../constants/ui";

// Cursor-paginated feed state, shared by the scroll-paginated pages. The
// first page arrives from the route loader (`initialPage`); once mounted
// this hook owns the feed: pages accumulate client-side as the user
// scrolls, and `insertItem` / `removeItem` merge created/deleted items back
// into the pages. `loadMoreRef` belongs to the component that renders the
// sentinel section — the hook only attaches the observer.
//
// `loadPage` must be stable (module-level or wrapped in useCallback) — its
// identity feeds the observer effect below.
//
// Known races preserved from the original implementation:
// - A cursor fetch still in flight when an item is inserted flushes its
//   page after the insert-collapse, which can drop the one item sliced off
//   page 1.
// - No AbortController: a late fetch can resolve into state updates after
//   unmount or after `insertItem` (harmless in React 19).

type CursorPage<T> = {
  data: T[];
  nextCursor: number | null;
};

type InfiniteFeedOptions<T> = {
  initialPage: CursorPage<T>;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  loadPage: (cursor: number) => Promise<CursorPage<T>>;
  loadErrorText: string;
  failureToast?: string;
};

function useInfiniteFeed<T extends { id: number }>({
  initialPage,
  loadMoreRef,
  loadPage,
  loadErrorText,
  failureToast,
}: InfiniteFeedOptions<T>) {
  const [pages, setPages] = useState<CursorPage<T>[]>(() => [initialPage]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const items = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;
  const hasMore = nextCursor !== null;

  const loadNextPage = useCallback(
    async (force = false) => {
      if (nextCursor === null || isLoadingMore || (loadError && !force)) {
        return;
      }

      setIsLoadingMore(true);

      try {
        const page = await loadPage(nextCursor);
        setPages((currentPages) => [...currentPages, page]);
        setLoadError(null);
      } catch {
        setLoadError(loadErrorText);
        if (failureToast) {
          toast.error(failureToast);
        }
      } finally {
        setIsLoadingMore(false);
      }
    },
    [
      loadPage,
      loadErrorText,
      failureToast,
      nextCursor,
      isLoadingMore,
      loadError,
    ],
  );

  // Merge a freshly created item into the first page: dedupe, keep the page
  // at page size, and recompute the cursor to the (possibly new) last item
  // so the next fetched page keeps its contract ("items older than this").
  // Anything beyond the first page is dropped — creating resets the scroll.
  const insertItem = useCallback((createdItem: T) => {
    setPages((currentPages) => {
      const firstPage = currentPages[0];

      if (!firstPage) {
        return [{ data: [createdItem], nextCursor: null }];
      }

      const mergedItems = [
        createdItem,
        ...firstPage.data.filter((item) => item.id !== createdItem.id),
      ].slice(0, FEED_PAGE_SIZE);

      return [
        {
          data: mergedItems,
          nextCursor:
            mergedItems.length === FEED_PAGE_SIZE
              ? (mergedItems[mergedItems.length - 1]?.id ?? null)
              : null,
        },
      ];
    });
    setLoadError(null);
    setIsLoadingMore(false);
  }, []);

  // Remove an item from every page (delete flows).
  const removeItem = useCallback((itemId: number) => {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        data: page.data.filter((item) => item.id !== itemId),
      })),
    );
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
    items,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
    insertItem,
    removeItem,
  };
}

export default useInfiniteFeed;
