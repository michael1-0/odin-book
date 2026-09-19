import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { useFetcher } from "react-router";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import type { FriendRequestWithUsers } from "@repo/zod-validations";
import Avatar from "./Avatar";

type RequestItemProps = {
  request: FriendRequestWithUsers;
  onNavigate: () => void;
};

function IncomingRequestItem({ request, onNavigate }: RequestItemProps) {
  const acceptFetcher = useFetcher();
  const declineFetcher = useFetcher();
  const isPending =
    acceptFetcher.state !== "idle" || declineFetcher.state !== "idle";

  useEffect(() => {
    if (acceptFetcher.data?.error) {
      toast.error(acceptFetcher.data.message);
    } else if (acceptFetcher.data && !acceptFetcher.data.error) {
      toast.success(`You and ${request.sender.username} are now friends`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptFetcher.data]);

  useEffect(() => {
    if (declineFetcher.data?.error) {
      toast.error(declineFetcher.data.message);
    }
  }, [declineFetcher.data]);

  return (
    <li className="flex items-center justify-between gap-2 rounded-sm bg-neutral-100 p-3">
      <Link
        to={`/users/${request.sender.id}`}
        className="flex min-w-0 items-center gap-3 hover:underline"
        onClick={onNavigate}
      >
        <Avatar user={request.sender} />
        <span className="truncate" title={request.sender.username}>
          {request.sender.username}
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">
        <acceptFetcher.Form method="POST" action="/friends">
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            name="intent"
            value="accept-request"
            disabled={isPending}
            className="rounded-sm bg-black p-2 text-xs text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            Accept
          </button>
        </acceptFetcher.Form>
        <declineFetcher.Form method="POST" action="/friends">
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            name="intent"
            value="decline-request"
            disabled={isPending}
            className="rounded-sm bg-neutral-200 p-2 text-xs text-black transition-colors hover:bg-neutral-300 disabled:opacity-50"
          >
            Decline
          </button>
        </declineFetcher.Form>
      </div>
    </li>
  );
}

function OutgoingRequestItem({ request, onNavigate }: RequestItemProps) {
  const fetcher = useFetcher();
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.error) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.data]);

  return (
    <li className="flex items-center justify-between gap-2 rounded-sm bg-neutral-100 p-3">
      <Link
        to={`/users/${request.receiver.id}`}
        className="flex min-w-0 items-center gap-3 hover:underline"
        onClick={onNavigate}
      >
        <Avatar user={request.receiver} />
        <span className="truncate" title={request.receiver.username}>
          {request.receiver.username}
        </span>
      </Link>
      <fetcher.Form method="POST" action="/friends">
        <input type="hidden" name="targetUserId" value={request.receiverId} />
        <button
          type="submit"
          name="intent"
          value="cancel-request"
          disabled={isPending}
          className="rounded-sm bg-neutral-200 p-2 text-xs text-black transition-colors hover:bg-neutral-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </fetcher.Form>
    </li>
  );
}

type FriendRequestsModalProps = {
  incomingRequests: FriendRequestWithUsers[];
  outgoingRequests: FriendRequestWithUsers[];
  onClose: () => void;
};

function FriendRequestsModal({
  incomingRequests,
  outgoingRequests,
  onClose,
}: FriendRequestsModalProps) {
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Friend requests"
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
          <h3 className="text-xl font-semibold">
            Friend Requests
            {incomingRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">
                {incomingRequests.length}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close friend requests"
            className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-neutral-500">Incoming</h4>
            {incomingRequests.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No incoming requests right now.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {incomingRequests.map((request) => (
                  <IncomingRequestItem
                    key={request.id}
                    request={request}
                    onNavigate={onClose}
                  />
                ))}
              </ul>
            )}
          </div>
          {outgoingRequests.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-neutral-500">Sent</h4>
              <ul className="flex flex-col gap-2">
                {outgoingRequests.map((request) => (
                  <OutgoingRequestItem
                    key={request.id}
                    request={request}
                    onNavigate={onClose}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default FriendRequestsModal;
