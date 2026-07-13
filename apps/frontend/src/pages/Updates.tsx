import type { PostFeedItem } from "@repo/zod-validations";
import { useLoaderData, useRouteLoaderData } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { getFollowingPostsFromLastMonth } from "../services/posts";

async function loader() {
  return await getFollowingPostsFromLastMonth();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Updates() {
  const { user } = useRouteLoaderData("user-data");
  const posts: PostFeedItem[] = useLoaderData();

  return (
    <div className="px-4 mt-20 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold ">Updates</h2>
        <p className="text-sm opacity-70">
          Posts from people you follow, over the last 30 days.
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full mb-24">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </div>
    </div>
  );
}

Updates.loader = loader;
Updates.action = action;

export default Updates;
