import type { RefObject } from "react";

type LoadMoreStatusProps = {
  loadMoreRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  onRetry: () => void;
};

// Status slot below a scroll-paginated feed: a retry button after a failed
// page fetch, a loading hint while fetching, or a hint that scrolling will
// load the next page. The section doubles as the IntersectionObserver
// sentinel (`loadMoreRef`, owned by the page, observed by the feed hook).
function LoadMoreStatus({
  loadMoreRef,
  hasMore,
  isLoadingMore,
  loadError,
  onRetry,
}: LoadMoreStatusProps) {
  return (
    <section
      ref={loadMoreRef}
      className="flex w-full items-center justify-center text-sm text-neutral-500"
    >
      {loadError ? (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200"
        >
          Retry loading more
        </button>
      ) : isLoadingMore ? (
        "Loading more posts..."
      ) : (
        hasMore && "Scroll to load more"
      )}
    </section>
  );
}

export default LoadMoreStatus;
