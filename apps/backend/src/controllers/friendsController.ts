import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type {
  Friend,
  FriendExploreItem,
  FriendExploreQuery,
  FriendRequestIdParams,
  FriendRequestWithUsers,
  FriendsGetResponse,
  TargetUserIdParams,
} from "@repo/zod-validations";
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
    throw new AppError("Unauthenticated", 401);
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
    if (request.status === "ACCEPTED") {
      const friend =
        request.senderId === currentUserId ? request.receiver : request.sender;
      friendsData.push({ ...friend, friendshipId: request.id });
    } else if (request.status === "PENDING") {
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
  req: Request<unknown, unknown, unknown, FriendExploreQuery>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const currentUserId = req.user.id;
  const offset = req.query.offset ?? 0;
  const limit = 12;
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
            none: { receiverId: currentUserId, status: "ACCEPTED" },
          },
        },
        {
          receivedFriendRequests: {
            none: { senderId: currentUserId, status: "ACCEPTED" },
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
  req: Request<TargetUserIdParams>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
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
    throw new AppError("User not found", 404);
  }

  const existingRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId,
        receiverId,
      },
    },
  });

  if (existingRequest?.status === "PENDING") {
    throw new AppError("Request already sent", 400);
  }

  if (existingRequest?.status === "ACCEPTED") {
    throw new AppError("You are already friends", 400);
  }

  const reverseRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId: receiverId,
        receiverId: senderId,
      },
    },
  });

  if (reverseRequest?.status === "ACCEPTED") {
    throw new AppError("You are already friends", 400);
  }

  if (reverseRequest?.status === "PENDING") {
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
      status: "PENDING",
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
      .emit("friend-request:new", { request: payload });
  }

  return res.status(200).json({ data: request });
}

async function cancelFriendRequest(
  req: Request<TargetUserIdParams>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
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

  if (!request || request.status !== "PENDING") {
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
  req: Request<FriendRequestIdParams>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const currentUserId = req.user.id;
  const { requestId } = req.params;

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError("Request not found", 404);
  }

  if (request.receiverId !== currentUserId) {
    throw new AppError("Unauthorized", 403);
  }

  if (request.status !== "PENDING") {
    throw new AppError("Request was already handled", 400);
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
    include: friendRequestWithUsersInclude,
  });

  const friendForSender: Friend = {
    ...updatedRequest.receiver,
    friendshipId: updatedRequest.id,
    lastMessage: null,
  };

  getIo()
    .to(userRoom(updatedRequest.senderId))
    .emit("friend-request:accepted", { friend: friendForSender });

  return res.status(200).json({ data: updatedRequest });
}

async function declineFriendRequest(
  req: Request<FriendRequestIdParams>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const currentUserId = req.user.id;
  const { requestId } = req.params;

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError("Request not found", 404);
  }

  if (request.receiverId !== currentUserId) {
    throw new AppError("Unauthorized", 403);
  }

  if (request.status !== "PENDING") {
    throw new AppError("Request was already handled", 400);
  }

  const updatedRequest = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "DECLINED" },
  });

  getIo()
    .to(userRoom(updatedRequest.senderId))
    .emit("friend-request:declined", { requestId: updatedRequest.id });

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
