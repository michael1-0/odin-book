import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import type { PostFeedItem } from "@repo/zod-validations";
import { createPost, loadPosts } from "../services/posts";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

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

  const submissionId =
    postFetcher.data && !postFetcher.data.error
      ? postFetcher.data.id
      : "initial";
  const isPosting = postFetcher.state === "submitting";

  return (
    <PageContainer>
      <PageHead
        title="Home"
        content="You can post here, and look at the latest posts."
      />
      <section className="w-full rounded-lg bg-white text-left">
        <postFetcher.Form
          method="POST"
          className="space-y-4"
          key={submissionId}
        >
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
      </section>
      <section className="flex flex-col gap-4 w-full mb-24">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </section>
    </PageContainer>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
