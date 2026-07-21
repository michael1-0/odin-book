import { prisma } from "./prisma.ts";
import { faker } from "@faker-js/faker";

const USER_COUNT = 100;
const POSTS_PER_USER = 3;
const FOLLOWS_PER_USER = 4;
const LIKES_PER_USER = 5;
const COMMENTS_PER_POST = 1;

async function main() {
  faker.seed(42);

  await resetDatabase();

  const users = await generateUsers(USER_COUNT);
  const posts = await generatePosts(users);

  await generateFollows(users);
  await generateLikes(users, posts);
  await generateComments(users, posts);
}

async function resetDatabase() {
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

async function generateUsers(count: number) {
  const usersData = Array.from({ length: count }, (_, index) => ({
    username: `user-${String(index + 1).padStart(3, "0")}`,
    profileUrl: faker.image.avatarGitHub(),
    githubId: String(1_000_000 + index),
    noteToAll: faker.lorem.sentence(12).slice(0, 280),
  }));

  await prisma.user.createMany({
    data: usersData,
  });

  return prisma.user.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });
}

async function generatePosts(users: { id: number }[]) {
  const postsData = users.flatMap((user, userIndex) =>
    Array.from({ length: POSTS_PER_USER }, (_, postIndex) => ({
      posterId: user.id,
      content: `${faker.lorem.paragraph()} #${userIndex + 1}-${postIndex + 1}`,
    })),
  );

  await prisma.post.createMany({
    data: postsData,
  });

  return prisma.post.findMany({
    select: { id: true, posterId: true },
    orderBy: { id: "asc" },
  });
}

async function generateFollows(users: { id: number }[]) {
  const followsData = users.flatMap((user, userIndex) => {
    const followIds = Array.from({ length: FOLLOWS_PER_USER }, (_, offset) => {
      const targetIndex = (userIndex + offset + 1) % users.length;

      return users[targetIndex]!.id;
    });

    return followIds.map((followingId) => ({
      followedById: user.id,
      followingId,
    }));
  });

  await prisma.follow.createMany({
    data: followsData,
  });
}

async function generateLikes(users: { id: number }[], posts: { id: number }[]) {
  const likesData = users.flatMap((user, userIndex) =>
    Array.from({ length: LIKES_PER_USER }, (_, offset) => {
      const postIndex = (userIndex * LIKES_PER_USER + offset) % posts.length;

      return {
        userId: user.id,
        postId: posts[postIndex]!.id,
      };
    }),
  );

  await prisma.like.createMany({
    data: likesData,
  });
}

async function generateComments(
  users: { id: number }[],
  posts: { id: number }[],
) {
  const commentsData = posts.flatMap((post, postIndex) =>
    Array.from({ length: COMMENTS_PER_POST }, (_, commentIndex) => {
      const userIndex = (postIndex + commentIndex) % users.length;

      return {
        postId: post.id,
        userId: users[userIndex]!.id,
        content: `${faker.lorem.sentences({ min: 1, max: 2 })} #${postIndex + 1}-${commentIndex + 1}`,
      };
    }),
  );

  await prisma.comment.createMany({
    data: commentsData,
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
