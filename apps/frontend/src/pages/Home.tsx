import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { LucideHeart, MessageSquare } from "lucide-react";
import type { PostFeedItem } from "@repo/zod-validations";
import { useEffect, useRef } from "react";

async function loader() {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  return posts.data;
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const userId = formData.get("currentUserId");
  const content = formData.get("content");

  const response = await fetch(`/api/users/${userId}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const post = await response.json();

  return post.data;
}

function Home() {
  const { user } = useRouteLoaderData("user-data");
  const posts: PostFeedItem[] = useLoaderData();

  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const isDone = fetcher.state === "idle" && fetcher.data != null;

  useEffect(() => {
    if (isDone && !fetcher.data?.error) {
      formRef.current?.reset();
    }
  }, [isDone, fetcher.data]);

  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="flex flex-1 items-center justify-center px-6 mt-20">
      <main className="w-full max-w-2xl space-y-4 text-center">
        <div className="flex flex-col gap-4 items-center">
          <img
            src={user.profileUrl}
            alt="user profile image"
            className="rounded-full max-h-20 max-w-20"
          />
          <p className="text-base opacity-80">
            Hello, {user.username}, what would you like to post today?
          </p>
          <div className="w-full border rounded-lg p-4 bg-white shadow-sm text-left mb-24">
            <div className="text-lg font-semibold mb-3 text-center text-gray-800">
              New Post
            </div>
            <fetcher.Form method="POST" className="space-y-4" ref={formRef}>
              <input type="hidden" name="currentUserId" value={user.id} />
              <div>
                <label htmlFor="content" className="sr-only">
                  Post Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  required
                  placeholder="Share something interesting..."
                  className="w-full p-3 border rounded-sm resize-none focus:outline-none focus:ring-2"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-stretch">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 w-full border rond font-medium rounded-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </fetcher.Form>
            <div></div>
          </div>
          <div className="flex flex-col gap-4 w-full mb-24">
            {posts.map((post) => {
              return (
                <div
                  className="border rounded-sm flex flex-col items-start"
                  key={post.id}
                >
                  <div className="flex gap-5 items-center p-3">
                    <img
                      src={post.user.profileUrl}
                      className="max-w-10 max-h-20 rounded-full"
                      alt={`${post.user.username} profile`}
                    />
                    <div>{post.user.username}</div>
                  </div>
                  <div className="p-3">{post.content}</div>
                  <div className="flex items-center p-3 gap-4 w-full">
                    <div className="flex gap-1">
                      <LucideHeart />
                      <div>{post.likes}</div>
                    </div>
                    <div className="flex gap-1">
                      <MessageSquare />
                      <div>{post._count.comments}</div>
                    </div>
                    <div className="text-sm ml-auto ">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
