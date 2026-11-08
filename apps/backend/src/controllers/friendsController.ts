import type { Request, Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type {
  Friend,
  FriendExploreItem,
  FriendExploreSpec,
  FriendRequestIdParamsSpec,
  FriendRequestWithUsers,
  FriendsGetResponse,
  TargetUserIdParamsSpec,
} from "@repo/zod-validations";
import {
  FRIEND_REQUEST_STATUS,
  FRIENDS_PAGE_SIZE,
  SOCKET_EVENTS,
} from "@repo/constants";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import type { Prisma } from "../db/generated/prisma/client.ts";
import { getIo, userRoom } from "../socket/io.ts";

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

async function getFriends(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const currentUserId = req.user.id;

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    },
    include: friendRequestWithUsersInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  const friendsData: Omit<Friend, "lastMessage">[] = [];
  const incomingRequests: FriendRequestWithUsers[] = [];
  const outgoingRequests: FriendRequestWithUsers[] = [];

  for (const request of requests) {
    if (request.status === FRIEND_REQUEST_STATUS.ACCEPTED) {
      const friend =
        request.senderId === currentUserId ? request.receiver : request.sender;
      friendsData.push({ ...friend, friendshipId: request.id });
    } else if (request.status === FRIEND_REQUEST_STATUS.PENDING) {
      if (request.receiverId === currentUserId) {
        incomingRequests.push(request);
      } else {
        outgoingRequests.push(request);
      }
    }
  }

  const friends: Friend[] = await Promise.all(
    friendsData.map(async (friend) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, recipientId: friend.id },
            { senderId: friend.id, recipientId: currentUserId },
          ],
        },
        orderBy: {
          id: "desc",
        },
        select: {
          content: true,
          senderId: true,
          createdAt: true,
        },
      });

      return { ...friend, lastMessage };
    }),
  );

  const friendsWithMessages = friends
    .filter((friend) => friend.lastMessage !== null)
    .sort(
      (a, b) =>
        b.lastMessage!.createdAt.getTime() - a.lastMessage!.createdAt.getTime(),
    );
  const friendsWithoutMessages = friends.filter(
    (friend) => friend.lastMessage === null,
  );

  const response: FriendsGetResponse = {
    data: {
      friends: [...friendsWithMessages, ...friendsWithoutMessages],
      incomingRequests,
      outgoingRequests,
    },
  };

  return res.status(200).json(response);
}

async function exploreFriends(
  req: ValidatedRequest<FriendExploreSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const currentUserId = req.user.id;
  const offset = req.query.offset ?? 0;
  const limit = FRIENDS_PAGE_SIZE;
  const query = req.query.query;

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
      },
      ...(query ? { username: { contains: query, mode: "insensitive" } } : {}),
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
    skip: offset,
    take: limit + 1,
  });

  const hasNextPage = users.length > limit;
  const pagedUsers = hasNextPage ? users.slice(0, limit) : users;
  const nextCursor = hasNextPage ? offset + limit : null;

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId: currentUserId,
          receiverId: { in: pagedUsers.map((user) => user.id) },
        },
        {
          receiverId: currentUserId,
          senderId: { in: pagedUsers.map((user) => user.id) },
        },
      ],
    },
  });

  const formattedUsers: FriendExploreItem[] = pagedUsers.map((user) => {
    const request = requests.find(
      (candidate) =>
        (candidate.senderId === currentUserId &&
          candidate.receiverId === user.id) ||
        (candidate.receiverId === currentUserId &&
          candidate.senderId === user.id),
    );

    return {
      ...user,
      requestStatus: request?.status ?? null,
      requestId: request?.id ?? null,
    };
  });

  return res.status(200).json({
    data: formattedUsers,
    meta: {
      nextCursor,
      hasNextPage,
    },
  });
}

async function sendFriendRequest(
  req: ValidatedRequest<TargetUserIdParamsSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const senderId = req.user.id;
  const receiverId = req.params.targetUserId;

  if (senderId === receiverId) {
    throw new AppError("Can't add yourself as a friend", 400);
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!receiver) {
    throw new AppError(ERROR_MESSAGES.userNotFound, 404);
  }

  const existingRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
  });

  if (existingRequest?.status === FRIEND_REQUEST_STATUS.PENDING) {
    throw new AppError("Request already sent", 400);
  }

  if (existingRequest?.status === FRIEND_REQUEST_STATUS.ACCEPTED) {
    throw new AppError(ERROR_MESSAGES.alreadyFriends, 400);
  }

  const reverseRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId: receiverId,
        receiverId: senderId,
      },
    },
  });

  if (reverseRequest?.status === FRIEND_REQUEST_STATUS.ACCEPTED) {
    throw new AppError(ERROR_MESSAGES.alreadyFriends, 400);
  }

  if (reverseRequest?.status === FRIEND_REQUEST_STATUS.PENDING) {
    throw new AppError("This user already sent you a request", 400);
  }

  const request = await prisma.friendRequest.upsert({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
    update: {
      status: FRIEND_REQUEST_STATUS.PENDING,
    },
    create: {
      senderId,
      receiverId,
    },
  });

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: friendUserSelect,
  });

  if (sender) {
    const payload: FriendRequestWithUsers = {
      ...request,
      sender,
      receiver: {
        id: receiver.id,
        username: receiver.username,
        profileUrl: receiver.profileUrl,
        createdAt: receiver.createdAt,
      },
    };

    getIo()
      .to(userRoom(receiverId))
      .emit(SOCKET_EVENTS.friendRequestNew, { request: payload });
  }

  return res.status(200).json({ data: request });
}

async function cancelFriendRequest(
  req: ValidatedRequest<TargetUserIdParamsSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const senderId = req.user.id;
  const receiverId = req.params.targetUserId;

  const request = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
  });

  if (!request || request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw new AppError("No pending request found", 404);
  }

  const deletedRequest = await prisma.friendRequest.delete({
    where: {
      id: request.id,
    },
  });

  return res.status(200).json({ data: deletedRequest });
}

async function acceptFriendRequest(
  req: ValidatedRequest<FriendRequestIdParamsSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const currentUserId = req.user.id;
  const { requestId } = req.params;

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError(ERROR_MESSAGES.friendRequestNotFound, 404);
  }

  if (request.receiverId !== currentUserId) {
    throw new AppError(ERROR_MESSAGES.unauthorized, 403);
  }

  if (request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw new AppError(ERROR_MESSAGES.friendRequestAlreadyHandled, 400);
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FRIEND_REQUEST_STATUS.ACCEPTED },
    include: friendRequestWithUsersInclude,
  });

  const friendForSender: Friend = {
    ...updatedRequest.receiver,
    friendshipId: updatedRequest.id,
    lastMessage: null,
  };

  getIo()
    .to(userRoom(updatedRequest.senderId))
    .emit(SOCKET_EVENTS.friendRequestAccepted, { friend: friendForSender });

  return res.status(200).json({ data: updatedRequest });
}

async function declineFriendRequest(
  req: ValidatedRequest<FriendRequestIdParamsSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const currentUserId = req.user.id;
  const { requestId } = req.params;

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError(ERROR_MESSAGES.friendRequestNotFound, 404);
  }

  if (request.receiverId !== currentUserId) {
    throw new AppError(ERROR_MESSAGES.unauthorized, 403);
  }

  if (request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw new AppError(ERROR_MESSAGES.friendRequestAlreadyHandled, 400);
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: FRIEND_REQUEST_STATUS.DECLINED },
  });

  getIo()
    .to(userRoom(updatedRequest.senderId))
    .emit(SOCKET_EVENTS.friendRequestDeclined, {
      requestId: updatedRequest.id,
    });

  return res.status(200).json({ data: updatedRequest });
}

export {
  getFriends,
  exploreFriends,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
};
