import { randomUUID } from "node:crypto";
import { FRIEND_REQUEST_STATUS } from "@repo/constants";
import type { Prisma } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";

let sequence = 0;

function uniqueLabel(prefix: string) {
  sequence += 1;
  return `${prefix}-${sequence}-${randomUUID().slice(0, 8)}`;
}

type UserOverrides = Partial<
  Omit<Prisma.UserUncheckedCreateInput, "githubId" | "username">
> & {
  githubId?: string;
  username?: string;
};

export function createUser(overrides: UserOverrides = {}) {
  return prisma.user.create({
    data: {
      githubId: uniqueLabel("github"),
      username: uniqueLabel("user").slice(0, 30),
      ...overrides,
    },
  });
}

type PostOverrides = Partial<Prisma.PostUncheckedCreateInput>;

export function createPost(posterId: number, overrides: PostOverrides = {}) {
  return prisma.post.create({
    data: {
      posterId,
      content: "Test post",
      ...overrides,
    },
  });
}

export function createComment(
  userId: number,
  postId: number,
  content = "Test comment",
  createdAt?: Date,
) {
  return prisma.comment.create({
    data: {
      userId,
      postId,
      content,
      ...(createdAt ? { createdAt } : {}),
    },
  });
}

export function createPostImage(
  postId: number,
  url = "https://res.cloudinary.com/test/image/upload/photo.png",
  position = 0,
) {
  return prisma.postImage.create({
    data: { postId, url, position },
  });
}

export function createLike(userId: number, postId: number) {
  return prisma.like.create({
    data: { userId, postId },
  });
}

export function createFollow(followedById: number, followingId: number) {
  return prisma.follow.create({
    data: { followedById, followingId },
  });
}

export function createFriendRequest(
  senderId: number,
  receiverId: number,
  status: Prisma.FriendRequestUncheckedCreateInput["status"] = FRIEND_REQUEST_STATUS.PENDING,
) {
  return prisma.friendRequest.create({
    data: { senderId, receiverId, status },
  });
}

export function createAcceptedFriendship(userId: number, friendId: number) {
  return createFriendRequest(userId, friendId, FRIEND_REQUEST_STATUS.ACCEPTED);
}

export function createMessage(
  senderId: number,
  recipientId: number,
  content = "Test message",
) {
  return prisma.message.create({
    data: { senderId, recipientId, content },
  });
}
