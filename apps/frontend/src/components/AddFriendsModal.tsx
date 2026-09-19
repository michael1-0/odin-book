import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useFetcher } from "react-router";
import toast from "react-hot-toast";
import { Check, Search, X } from "lucide-react";
import type { FriendExploreItem } from "@repo/zod-validations";
import { exploreFriends } from "../services/friends";
import Avatar from "./Avatar";

function ExploreItem({
  item,
  onRequestSent,
  onNavigate,
}: {
  item: FriendExploreItem;
  onRequestSent: (userId: number, requestId: number) => void;
  onNavigate: () => void;
}) {
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.error) {
      toast.error(fetcher.data.message);
    } else if (fetcher.data && !fetcher.data.error) {
      onRequestSent(item.id, fetcher.data.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

  const hasPendingRequest = item.requestStatus === "PENDING";

  return (
    <li className="flex items-center justify-between gap-2 rounded-sm bg-neutral-100 p-3">
      <Link
        to={`/users/${item.id}`}
        className="flex min-w-0 items-center gap-3 hover:underline"
        onClick={onNavigate}
      >
        <Avatar user={item} />
        <span className="truncate" title={item.username}>
          {item.username}
        </span>
      </Link>
      {hasPendingRequest ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-green-700">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Request sent
        </span>
      ) : (
        <fetcher.Form method="POST" action="/friends">
          <input type="hidden" name="targetUserId" value={item.id} />
          <button
            type="submit"
            name="intent"
            value="send-request"
            disabled={isPending}
            className="rounded-sm bg-black p-2 text-xs text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            Add friend
          </button>
        </fetcher.Form>
      )}
    </li>
  );
}

type AddFriendsModalProps = {
  onClose: () => void;
};

function AddFriendsModal({ onClose }: AddFriendsModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendExploreItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchIdRef = useRef(0);

  const isSearching = Boolean(query.trim()) && query.trim() !== searchedQuery;

  const loadResults = useCallback(
    async (search: string, offset?: number, reset = false) => {
      const requestId = ++searchIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const page = await exploreFriends(search.trim() || null, offset);

        if (requestId !== searchIdRef.current) {
          return;
        }

        setResults((current) =>
          reset ? page.data : [...current, ...page.data],
        );
        setNextCursor(page.meta.nextCursor);
        setSearchedQuery(search.trim());
      } catch {
        if (requestId === searchIdRef.current) {
          setError("Couldn't load users.");
          setSearchedQuery(search.trim());
        }
      } finally {
        if (requestId === searchIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!query.trim()) {
      searchIdRef.current += 1;
      setResults([]);
      setNextCursor(null);
      setError(null);
      return;
    }

    const timeout = setTimeout(() => {
      void loadResults(query, undefined, true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, loadResults]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleRequestSent(userId: number, requestId: number) {
    setResults((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, requestStatus: "PENDING", requestId }
          : user,
      ),
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add friends"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-4 rounded-sm bg-white p-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Add Friends</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add friends"
            className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users by username..."
            aria-label="Search users by username"
            autoFocus
            className="w-full rounded-sm bg-neutral-100 py-3 pl-10 pr-10 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-black"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {results.length > 0 && (
            <ul className="flex flex-col gap-2">
              {results.map((user) => (
                <ExploreItem
                  key={user.id}
                  item={user}
                  onRequestSent={handleRequestSent}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          )}
          {isSearching && (
            <p className="text-sm text-neutral-500">Searching users...</p>
          )}
          {!isSearching && !error && results.length === 0 && query.trim() && (
            <p className="text-sm text-neutral-500">
              No users found or already friends.
            </p>
          )}
          {!query.trim() && (
            <p className="text-sm text-neutral-400">
              Search by username to find people you know.
            </p>
          )}
          {nextCursor !== null && !isLoading && (
            <button
              type="button"
              onClick={() => void loadResults(query, nextCursor)}
              className="self-center rounded-sm bg-black p-2 text-sm text-white transition-colors hover:bg-neutral-700"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AddFriendsModal;
