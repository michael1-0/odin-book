import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import type { FriendRequestStatus } from "../generated/prisma/enums.ts";
import { FRIEND_REQUEST_STATUS } from "@repo/constants";

const friendUserSelect = {
  id: true,
  username: true,
  profileUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const friendRequestWithUsersInclude = {
  sender: { select: friendUserSelect },
  receiver: { select: friendUserSelect },
} satisfies Prisma.FriendRequestInclude;

function findFriendUserById(
  userId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findUnique({
    where: { id: userId },
    select: friendUserSelect,
  });
}

function findFriendRequestBetweenUsers(
  senderId: number,
  receiverId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
  });
}

function findFriendRequestById(
  requestId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.findUnique({
    where: { id: requestId },
  });
}

function getUserFriendRequests(
  userId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: friendRequestWithUsersInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

function findFriendRequestsBetween(
  userId: number,
  otherUserIds: number[],
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: { in: otherUserIds },
        },
        {
          receiverId: userId,
          senderId: { in: otherUserIds },
        },
      ],
    },
  });
}

function findAcceptedFriendshipBetween(
  userId: number,
  friendId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.findFirst({
    where: {
      status: FRIEND_REQUEST_STATUS.ACCEPTED,
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });
}

function getUsersNotFriendsWith(
  currentUserId: number,
  options: { query?: string | undefined; offset: number; take: number },
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findMany({
    where: {
      id: {
        not: currentUserId,
      },
      ...(options.query
        ? { username: { contains: options.query, mode: "insensitive" } }
        : {}),
      AND: [
        {
          sentFriendRequests: {
            none: {
              receiverId: currentUserId,
              status: FRIEND_REQUEST_STATUS.ACCEPTED,
            },
          },
        },
        {
          receivedFriendRequests: {
            none: {
              senderId: currentUserId,
              status: FRIEND_REQUEST_STATUS.ACCEPTED,
            },
          },
        },
      ],
    },
    select: friendUserSelect,
    orderBy: {
      username: "asc",
    },
    skip: options.offset,
    take: options.take,
  });
}

function upsertFriendRequest(
  senderId: number,
  receiverId: number,
  status: FriendRequestStatus,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.upsert({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
    update: {
      status,
    },
    create: {
      senderId,
      receiverId,
    },
  });
}

function updateFriendRequestStatus(
  requestId: number,
  status: FriendRequestStatus,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

function updateFriendRequestStatusWithUsers(
  requestId: number,
  status: FriendRequestStatus,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.update({
    where: { id: requestId },
    data: { status },
    include: friendRequestWithUsersInclude,
  });
}

function deleteFriendRequestById(
  requestId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.friendRequest.delete({
    where: { id: requestId },
  });
}

export {
  findFriendUserById,
  findFriendRequestBetweenUsers,
  findFriendRequestById,
  getUserFriendRequests,
  findFriendRequestsBetween,
  findAcceptedFriendshipBetween,
  getUsersNotFriendsWith,
  upsertFriendRequest,
  updateFriendRequestStatus,
  updateFriendRequestStatusWithUsers,
  deleteFriendRequestById,
};
