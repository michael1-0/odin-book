import type { PostFeedItem } from "@repo/zod-validations";
import { useLoaderData, useRouteLoaderData } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { getFollowingPostsFromLastMonth } from "../services/posts";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

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
    <PageContainer>
      <PageHead
        title="Updates"
        content="Posts from people you follow, over the last 30 days."
      />
      <section className="flex flex-col gap-4 w-full">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </section>
    </PageContainer>
  );
}

Updates.loader = loader;
Updates.action = action;

export default Updates;
