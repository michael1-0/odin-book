import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import type { PostFeedItem } from "@repo/zod-validations";
import { useEffect, useRef } from "react";
import { createPost, likePost, loadPosts, unlikePost } from "../services/posts";
import PostItem from "../components/PostItem";

async function loader() {
  return await loadPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-post":
      return await createPost(formData);
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Home() {
  const { user } = useRouteLoaderData("user-data");
  const posts: PostFeedItem[] = useLoaderData();

  const postFetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const isDone = postFetcher.state === "idle" && postFetcher.data != null;

  useEffect(() => {
    if (isDone && !postFetcher.data?.error) {
      formRef.current?.reset();
    }
  }, [isDone, postFetcher.data]);

  const isPosting = postFetcher.state === "submitting";

  return (
    <div className="flex flex-1 items-center justify-center px-4 mt-20">
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
          <div className="w-full rounded-lg py-4 bg-white text-left mb-24">
            <postFetcher.Form method="POST" className="space-y-4" ref={formRef}>
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
                  className="w-full p-3 shadow-sm rounded-sm resize-none focus:outline-none focus:ring-2"
                  disabled={isPosting}
                />
              </div>
              <div className="flex justify-stretch">
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-4 py-2 w-full bg-black text-white font-medium rounded-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors"
                  name="intent"
                  value="create-post"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </postFetcher.Form>
          </div>
          <div className="flex flex-col gap-4 w-full mb-24">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} userId={user.id} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
