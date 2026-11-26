import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RefObject } from "react";
import { FEED_PAGE_SIZE } from "@repo/constants";
import toast from "react-hot-toast";
import { LOAD_MORE_ROOT_MARGIN } from "../../../src/constants/ui";
import useInfiniteFeed from "../../../src/hooks/useInfiniteFeed";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn() },
}));

type Item = { id: number };
type Page = { data: Item[]; nextCursor: number | null };

type ObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: number[] = [];
  readonly options: IntersectionObserverInit | undefined;

  private readonly callback: ObserverCallback;

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting = true) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const LOAD_ERROR_TEXT = "Couldn't load more posts.";
const FAILURE_TOAST = "Failed to load more posts";

function firstObserver(): MockIntersectionObserver {
  const observer = MockIntersectionObserver.instances[0];

  if (!observer) {
    throw new Error("Expected an IntersectionObserver instance");
  }

  return observer;
}

function page(ids: number[], nextCursor: number | null): Page {
  return { data: ids.map((id) => ({ id })), nextCursor };
}

function ids(items: Item[]) {
  return items.map((item) => item.id);
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function sentinelRef(): RefObject<HTMLDivElement | null> {
  return { current: document.createElement("div") };
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("useInfiniteFeed", () => {
  it("starts from the loader page", () => {
    const loadPage = vi.fn<() => Promise<Page>>();
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([3, 2, 1], 1),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    expect(ids(result.current.items)).toEqual([3, 2, 1]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loadError).toBeNull();
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("appends the next cursor page", async () => {
    const loadPage = vi.fn(() => Promise.resolve(page([11, 12], null)));
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1, 2, 3], 3),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });

    expect(loadPage).toHaveBeenCalledWith(3);
    expect(ids(result.current.items)).toEqual([1, 2, 3, 11, 12]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("does nothing once the cursor is exhausted", async () => {
    const loadPage = vi.fn<() => Promise<Page>>();
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1], null),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });

    expect(loadPage).not.toHaveBeenCalled();
  });

  it("records a load failure, toasts, and blocks unforced retries", async () => {
    const loadPage = vi
      .fn<() => Promise<Page>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(page([11], null));

    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1, 2], 2),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
        failureToast: FAILURE_TOAST,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });

    expect(result.current.loadError).toBe(LOAD_ERROR_TEXT);
    expect(result.current.isLoadingMore).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(FAILURE_TOAST);

    await act(async () => {
      await result.current.loadNextPage();
    });

    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it("retries a failed page when forced", async () => {
    const loadPage = vi
      .fn<() => Promise<Page>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(page([11], null));

    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1, 2], 2),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });
    expect(result.current.loadError).toBe(LOAD_ERROR_TEXT);

    await act(async () => {
      await result.current.loadNextPage(true);
    });

    expect(loadPage).toHaveBeenCalledTimes(2);
    expect(result.current.loadError).toBeNull();
    expect(ids(result.current.items)).toEqual([1, 2, 11]);
  });

  it("inserts a created item first, dedupes, and clamps to the page size", () => {
    const loadPage = vi.fn<() => Promise<Page>>();
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page(range(1, FEED_PAGE_SIZE), FEED_PAGE_SIZE),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );
    const existingId = Math.ceil(FEED_PAGE_SIZE / 2);

    act(() => {
      result.current.insertItem({ id: existingId });
    });

    expect(ids(result.current.items)).toEqual([
      existingId,
      ...range(1, FEED_PAGE_SIZE).filter((id) => id !== existingId),
    ]);
    expect(result.current.hasMore).toBe(true);
  });

  it("drops later pages when an item is inserted", async () => {
    const loadPage = vi.fn(() => Promise.resolve(page([11, 12], null)));
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page(range(1, FEED_PAGE_SIZE), FEED_PAGE_SIZE),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });
    expect(result.current.items).toHaveLength(12);

    act(() => {
      result.current.insertItem({ id: 99 });
    });

    expect(ids(result.current.items)).toEqual([
      99,
      ...range(1, FEED_PAGE_SIZE - 1),
    ]);
    expect(ids(result.current.items)).not.toContain(11);
  });

  it("clears the cursor when insertion leaves a short first page", () => {
    const loadPage = vi.fn<() => Promise<Page>>();
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page(range(1, FEED_PAGE_SIZE - 2), FEED_PAGE_SIZE - 2),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    act(() => {
      result.current.insertItem({ id: FEED_PAGE_SIZE - 1 });
    });

    expect(result.current.items).toHaveLength(FEED_PAGE_SIZE - 1);
    expect(result.current.hasMore).toBe(false);
  });

  it("removes an item from every loaded page", async () => {
    const loadPage = vi.fn(() => Promise.resolve(page([11, 12], null)));
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page(range(1, FEED_PAGE_SIZE), FEED_PAGE_SIZE),
        loadMoreRef: sentinelRef(),
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    await act(async () => {
      await result.current.loadNextPage();
    });

    act(() => {
      result.current.removeItem(11);
    });

    expect(ids(result.current.items)).not.toContain(11);
    expect(result.current.items).toHaveLength(11);
  });

  it("observes the sentinel and loads when it intersects", async () => {
    const loadPage = vi.fn(() => Promise.resolve(page([11, 12], null)));
    const loadMoreRef = sentinelRef();
    const { result } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1, 2], 2),
        loadMoreRef,
        loadPage,
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    const observer = firstObserver();

    expect(observer.observe).toHaveBeenCalledWith(loadMoreRef.current);
    expect(observer.options).toEqual({ rootMargin: LOAD_MORE_ROOT_MARGIN });

    act(() => {
      observer.trigger();
    });

    await waitFor(() => {
      expect(ids(result.current.items)).toEqual([1, 2, 11, 12]);
    });
  });

  it("does not observe when there is no next page", () => {
    renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1], null),
        loadMoreRef: sentinelRef(),
        loadPage: vi.fn<() => Promise<Page>>(),
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderHook(() =>
      useInfiniteFeed({
        initialPage: page([1], 2),
        loadMoreRef: sentinelRef(),
        loadPage: vi.fn<() => Promise<Page>>(),
        loadErrorText: LOAD_ERROR_TEXT,
      }),
    );

    const observer = firstObserver();

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });
});
