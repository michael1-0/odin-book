import { useState } from "react";
import type { ActionFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { UserPlus, Users } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PageHead from "../components/PageHead";
import FriendList from "../components/FriendList";
import FriendsSearch from "../components/FriendsSearch";
import ChatModal from "../components/ChatModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import AddFriendsModal from "../components/AddFriendsModal";
import useFriendsSocket from "../hooks/useFriendsSocket";
import useCurrentUser from "../hooks/useCurrentUser";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriends,
  sendFriendRequest,
} from "../services/friends";
import { FORM_INTENTS } from "../constants/routes";
import { readIntent, unknownIntent } from "../utils/intent";

async function loader() {
  return await getFriends();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (readIntent(formData)) {
    case FORM_INTENTS.sendRequest:
      return await sendFriendRequest(formData);
    case FORM_INTENTS.cancelRequest:
      return await cancelFriendRequest(formData);
    case FORM_INTENTS.acceptRequest:
      return await acceptFriendRequest(formData);
    case FORM_INTENTS.declineRequest:
      return await declineFriendRequest(formData);
    default:
      throw unknownIntent();
  }
}

function Friends() {
  const { friends, incomingRequests, outgoingRequests } =
    useLoaderData<typeof loader>();
  const user = useCurrentUser();
  const { revalidate } = useFriendsSocket();

  const [activeModal, setActiveModal] = useState<"requests" | "add" | null>(
    null,
  );
  const [chatFriendId, setChatFriendId] = useState<number | null>(null);
  const [friendQuery, setFriendQuery] = useState("");

  const selectedFriend =
    friends.find((friend) => friend.id === chatFriendId) ?? null;

  function handleChatClose() {
    setChatFriendId(null);
    void revalidate();
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
            <Users className="size-4" aria-hidden="true" />
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
            <UserPlus className="size-4" aria-hidden="true" />
            Add
          </button>
        </div>
        {friends.length > 0 && (
          <FriendsSearch value={friendQuery} onChange={setFriendQuery} />
        )}
        <FriendList
          friends={friends}
          query={friendQuery}
          currentUserId={user.id}
          onSelect={setChatFriendId}
        />
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
