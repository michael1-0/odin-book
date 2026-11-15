import { MessageCircle } from "lucide-react";
import type { Friend } from "@repo/zod-validations";
import Avatar from "./Avatar";
import { formatFriendTime } from "../utils/formatDate";

type FriendListItemProps = {
  friend: Friend;
  currentUserId: number;
  onSelect: (friendId: number) => void;
};

function FriendListItem({
  friend,
  currentUserId,
  onSelect,
}: FriendListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(friend.id)}
        aria-label={`Chat with ${friend.username}`}
        className="flex w-full items-center gap-3 rounded-sm bg-neutral-100 p-3 text-left transition-colors hover:bg-neutral-200"
      >
        <Avatar user={friend} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-semibold" title={friend.username}>
              {friend.username}
            </span>
            {friend.lastMessage && (
              <span className="shrink-0 text-xs text-neutral-500">
                {formatFriendTime(friend.lastMessage.createdAt)}
              </span>
            )}
          </div>
          {friend.lastMessage ? (
            <p className="truncate text-sm text-neutral-500">
              {friend.lastMessage.senderId === currentUserId && (
                <span className="font-semibold text-neutral-400">You: </span>
              )}
              {friend.lastMessage.content}
            </p>
          ) : (
            <p className="text-sm text-neutral-400">No messages yet</p>
          )}
        </div>
      </button>
    </li>
  );
}

type FriendListProps = {
  friends: Friend[];
  query: string;
  currentUserId: number;
  onSelect: (friendId: number) => void;
};

function FriendList({
  friends,
  query,
  currentUserId,
  onSelect,
}: FriendListProps) {
  const trimmedQuery = query.trim().toLowerCase();
  const visibleFriends = trimmedQuery
    ? friends.filter((friend) =>
        friend.username.toLowerCase().includes(trimmedQuery),
      )
    : friends;

  return (
    <div className="flex flex-col gap-3">
      {friends.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-sm bg-neutral-100 p-8 text-neutral-400">
          <MessageCircle className="h-12 w-12" aria-hidden="true" />
          <p className="text-sm">No friends to chat yet.</p>
        </div>
      ) : visibleFriends.length === 0 ? (
        <p className="text-sm mt-2 text-neutral-500">
          No friends match "{trimmedQuery}".
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleFriends.map((friend) => (
            <FriendListItem
              key={friend.id}
              friend={friend}
              currentUserId={currentUserId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default FriendList;
