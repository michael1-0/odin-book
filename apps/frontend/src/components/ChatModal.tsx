import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { MessageCircle, X } from "lucide-react";
import type { Friend, Message } from "@repo/zod-validations";
import { getMessages, sendMessage } from "../services/friends";
import { getSocket } from "../services/socket";
import {
  formatDayLabel,
  formatMessageTime,
  isSameDay,
} from "../utils/formatDate";

const GROUP_MESSAGE_WINDOW_MS = 5 * 60 * 1000;

type ChatModalProps = {
  friend: Friend;
  currentUserId: number;
  onClose: () => void;
};

function ChatModal({ friend, currentUserId, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageIds = useRef(new Set<number>());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const skipScrollRef = useRef(false);

  const friendId = friend.id;

  const addMessage = useCallback((message: Message) => {
    if (messageIds.current.has(message.id)) {
      return;
    }

    messageIds.current.add(message.id);
    setMessages((current) => [...current, message]);
  }, []);

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

  useEffect(() => {
    messageIds.current.clear();
    setMessages([]);
    setNextCursor(null);
    setError(null);
    setDraft("");
    skipScrollRef.current = true;

    let isStale = false;

    async function loadInitial() {
      setIsLoading(true);

      try {
        const page = await getMessages(friendId);
        if (isStale) {
          return;
        }

        page.data.forEach((message) => messageIds.current.add(message.id));
        setMessages(page.data);
        setNextCursor(page.meta.nextCursor);
      } catch {
        if (!isStale) {
          setError("Couldn't load messages.");
        }
      } finally {
        if (!isStale) {
          setIsLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      isStale = true;
    };
  }, [friendId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      messagesEndRef.current?.scrollIntoView();
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    function handleNewMessage({ message }: { message: Message }) {
      const isRelevant =
        (message.senderId === friendId &&
          message.recipientId === currentUserId) ||
        (message.senderId === currentUserId &&
          message.recipientId === friendId);

      if (isRelevant) {
        addMessage(message);
      }
    }

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [friendId, currentUserId, addMessage]);

  async function loadOlder() {
    if (nextCursor === null || isLoadingOlder) {
      return;
    }

    const container = scrollContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;

    setIsLoadingOlder(true);
    skipScrollRef.current = true;

    try {
      const page = await getMessages(friendId, nextCursor);
      const fresh = page.data.filter(
        (message) => !messageIds.current.has(message.id),
      );

      fresh.forEach((message) => messageIds.current.add(message.id));
      setMessages((current) => [...fresh, ...current]);
      setNextCursor(page.meta.nextCursor);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousHeight;
        }
      });
    } catch {
      toast.error("Failed to load earlier messages");
      skipScrollRef.current = false;
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const message = await sendMessage(friendId, content);
      addMessage(message);
      setDraft("");
    } catch (sendError) {
      toast.error(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message",
      );
    } finally {
      setIsSending(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${friend.username}`}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <header className="p-4">
        <div className="mx-auto flex w-full max-w-165 items-center gap-3">
          <Link
            to={`/users/${friend.id}`}
            aria-label={`View ${friend.username}'s profile`}
            onClick={onClose}
          >
            <img
              src={friend.profileUrl ?? undefined}
              alt={`${friend.username} profile image`}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          </Link>
          <Link
            to={`/users/${friend.id}`}
            className="min-w-0 truncate font-semibold hover:underline"
            title={friend.username}
            onClick={onClose}
          >
            {friend.username}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="ml-auto rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>
      {isLoading ? (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="mx-auto flex w-full max-w-165 flex-col gap-3">
            {["w-2/3 self-start", "w-1/2 self-end", "w-3/5 self-start"].map(
              (width, index) => (
                <div
                  key={index}
                  className={`h-9 animate-pulse rounded-sm bg-neutral-200 ${width}`}
                />
              ),
            )}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-red-600">
          <div className="mx-auto w-full max-w-165">{error}</div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
        >
          <div className="mx-auto flex w-full max-w-165 flex-col gap-2">
            {nextCursor !== null && (
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={isLoadingOlder}
                className="self-center rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-300 disabled:opacity-50"
              >
                {isLoadingOlder ? "Loading..." : "Earlier messages"}
              </button>
            )}
            {messages.length === 0 && (
              <div className="my-auto flex flex-col items-center gap-3 py-16 text-neutral-400">
                <MessageCircle className="h-12 w-12" aria-hidden="true" />
                <p className="text-sm">No messages yet. Say hi!</p>
              </div>
            )}
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const previous = messages[index - 1];
              const showDaySeparator =
                !previous || !isSameDay(previous.createdAt, message.createdAt);
              const groupedWithPrevious =
                previous !== undefined &&
                previous.senderId === message.senderId &&
                new Date(message.createdAt).getTime() -
                  new Date(previous.createdAt).getTime() <
                  GROUP_MESSAGE_WINDOW_MS;

              return (
                <div key={message.id} className="flex flex-col">
                  {showDaySeparator && (
                    <div className="my-2 self-center rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-500">
                      {formatDayLabel(message.createdAt)}
                    </div>
                  )}
                  <div
                    className={`flex max-w-[75%] flex-col gap-1 rounded-sm p-2 text-sm ${
                      isOwn
                        ? "self-end bg-black text-white"
                        : "self-start bg-neutral-100 text-black"
                    } ${groupedWithPrevious ? "" : "mt-2"}`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <span
                      className={`self-end text-[10px] ${
                        isOwn ? "text-white/60" : "text-neutral-400"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      <form onSubmit={(event) => void handleSend(event)} className="p-4">
        <div className="mx-auto flex w-full max-w-165 gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message"
            maxLength={1000}
            aria-label="Write a message"
            autoFocus
            className="min-w-0 flex-1 rounded-sm bg-neutral-100 p-3 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="shrink-0 rounded-sm bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

export default ChatModal;
