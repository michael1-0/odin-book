import { useEffect } from "react";
import { useRevalidator } from "react-router";
import toast from "react-hot-toast";
import { SOCKET_EVENTS } from "@repo/constants";
import type { Friend, FriendRequestWithUsers } from "@repo/zod-validations";
import { disconnectSocket, getSocket } from "../services/socket";

function useFriendsSocket() {
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    function handleNewRequest({
      request,
    }: {
      request: FriendRequestWithUsers;
    }) {
      void revalidate();
      toast(`${request.sender.username} sent you a friend request`);
    }

    function handleAccepted({ friend }: { friend: Friend }) {
      void revalidate();
      toast.success(`${friend.username} accepted your friend request`);
    }

    function handleDeclined() {
      void revalidate();
    }

    function handleNewMessage() {
      void revalidate();
    }

    socket.on(SOCKET_EVENTS.friendRequestNew, handleNewRequest);
    socket.on(SOCKET_EVENTS.friendRequestAccepted, handleAccepted);
    socket.on(SOCKET_EVENTS.friendRequestDeclined, handleDeclined);
    socket.on(SOCKET_EVENTS.messageNew, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.friendRequestNew, handleNewRequest);
      socket.off(SOCKET_EVENTS.friendRequestAccepted, handleAccepted);
      socket.off(SOCKET_EVENTS.friendRequestDeclined, handleDeclined);
      socket.off(SOCKET_EVENTS.messageNew, handleNewMessage);
      disconnectSocket();
    };
  }, [revalidate]);

  return { revalidate };
}

export default useFriendsSocket;
