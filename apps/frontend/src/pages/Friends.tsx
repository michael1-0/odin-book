import { useEffect, useRef, useState } from "react";
import type { ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useRevalidator,
  useRouteLoaderData,
} from "react-router";
import toast from "react-hot-toast";
import { MessageCircle, Search, UserPlus, Users, X } from "lucide-react";
import type {
  Friend,
  FriendRequestWithUsers,
  FriendsGetResponse,
} from "@repo/zod-validations";
import PageContainer from "../components/PageContainer";
import PageHead from "../components/PageHead";
import Avatar from "../components/Avatar";
import ChatModal from "../components/ChatModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import AddFriendsModal from "../components/AddFriendsModal";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriends,
  sendFriendRequest,
} from "../services/friends";
import { disconnectSocket, getSocket } from "../services/socket";
import { formatFriendTime } from "../utils/formatDate";

type FriendsLoaderData = FriendsGetResponse["data"];
type UserData = { user: { id: number } };

async function loader() {
  return await getFriends();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "send-request":
      return await sendFriendRequest(formData);
    case "cancel-request":
      return await cancelFriendRequest(formData);
    case "accept-request":
      return await acceptFriendRequest(formData);
    case "decline-request":
      return await declineFriendRequest(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Friends() {
  const { friends, incomingRequests, outgoingRequests } =
    useLoaderData() as FriendsLoaderData;
  const { user } = useRouteLoaderData<UserData>("user-data")!;
  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator.revalidate);
  const [activeModal, setActiveModal] = useState<"requests" | "add" | null>(
    null,
  );
  const [chatFriendId, setChatFriendId] = useState<number | null>(null);
  const [friendQuery, setFriendQuery] = useState("");
  const selectedFriend =
    friends.find((friend) => friend.id === chatFriendId) ?? null;
  const trimmedQuery = friendQuery.trim().toLowerCase();
  const visibleFriends = trimmedQuery
    ? friends.filter((friend) =>
        friend.username.toLowerCase().includes(trimmedQuery),
      )
    : friends;

  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
  }, [revalidator]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function handleNewRequest({
      request,
    }: {
      request: FriendRequestWithUsers;
    }) {
      void revalidateRef.current();
      toast(`${request.sender.username} sent you a friend request`);
    }

    function handleAccepted({ friend }: { friend: Friend }) {
      void revalidateRef.current();
      toast.success(`${friend.username} accepted your friend request`);
    }

    function handleDeclined() {
      void revalidateRef.current();
    }

    function handleNewMessage() {
      void revalidateRef.current();
    }

    socket.on("friend-request:new", handleNewRequest);
    socket.on("friend-request:accepted", handleAccepted);
    socket.on("friend-request:declined", handleDeclined);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("friend-request:new", handleNewRequest);
      socket.off("friend-request:accepted", handleAccepted);
      socket.off("friend-request:declined", handleDeclined);
      socket.off("message:new", handleNewMessage);
    };
  }, []);

  function handleChatClose() {
    setChatFriendId(null);
    void revalidateRef.current();
  }

  return (
    <PageContainer>
      <PageHead
        title="Friends"
        content="Chat with your friends, also friends are immutable."
      />
      <section className="flex flex-col gap-2">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setActiveModal("requests")}
            className="flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-neutral-700"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Requests
            {incomingRequests.length > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-black">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("add")}
            className="flex items-center gap-2 rounded-sm bg-neutral-100 px-4 py-2 text-sm text-black transition-colors hover:bg-neutral-200"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        </div>
        {friends.length > 0 && (
          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={friendQuery}
              onChange={(event) => setFriendQuery(event.target.value)}
              placeholder="Search by username"
              aria-label="Search by username"
              className="w-full rounded-sm bg-neutral-100 py-2.5 pl-10 pr-10 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black"
            />
            {friendQuery && (
              <button
                type="button"
                onClick={() => setFriendQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-black"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
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
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => setChatFriendId(friend.id)}
                    aria-label={`Chat with ${friend.username}`}
                    className="flex w-full items-center gap-3 rounded-sm bg-neutral-100 p-3 text-left transition-colors hover:bg-neutral-200"
                  >
                    <Avatar user={friend} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="truncate font-semibold"
                          title={friend.username}
                        >
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
                          {friend.lastMessage.senderId === user.id && (
                            <span className="font-semibold text-neutral-400">
                              You:{" "}
                            </span>
                          )}
                          {friend.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-400">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {activeModal === "requests" && (
        <FriendRequestsModal
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "add" && (
        <AddFriendsModal onClose={() => setActiveModal(null)} />
      )}
      {selectedFriend && (
        <ChatModal
          key={selectedFriend.id}
          friend={selectedFriend}
          currentUserId={user.id}
          onClose={handleChatClose}
        />
      )}
    </PageContainer>
  );
}

Friends.loader = loader;
Friends.action = action;

export default Friends;
