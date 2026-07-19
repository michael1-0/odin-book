import {
  useRouteLoaderData,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { useEffect } from "react";
import { PostCreateSchema, z, type PostFeedItem } from "@repo/zod-validations";
import { createPost, loadPosts } from "../services/posts";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";
import toast from "react-hot-toast";
import { CircleX } from "lucide-react";

async function loader() {
  return await loadPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-post": {
      const parsedPost = PostCreateSchema.safeParse({
        content: formData.get("content"),
      });

      if (!parsedPost.success) {
        return {
          error: true,
          errors: z.flattenError(parsedPost.error).fieldErrors,
        };
      }

      return await createPost(parsedPost.data.content);
    }
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

  const isPosting = postFetcher.state === "submitting";
  const hasError = postFetcher.data?.error;

  // Form resets
  const submissionId =
    postFetcher.data && !hasError ? postFetcher.data.id : "initial";

  // Toasts
  useEffect(() => {
    if (postFetcher.state === "idle" && postFetcher.data) {
      if (hasError) {
        toast.error("Failed to create post");
      } else {
        toast.success("Post posted");
      }
    }
  }, [postFetcher.state, postFetcher.data, hasError]);

  const errors = postFetcher.data?.errors;
  const contentErrors = errors?.content;

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
          <div className="mb-2 text-sm text-red-600 min-h-8">
            {contentErrors && (
              <div className="flex gap-2 items-center">
                <CircleX size={20} />
                {contentErrors[0]}
              </div>
            )}
          </div>
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
          <button
            type="submit"
            disabled={isPosting}
            className="px-4 py-2 w-full bg-black text-white font-medium rounded-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors"
            name="intent"
            value="create-post"
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </postFetcher.Form>
      </section>
      <section className="flex flex-col gap-4 w-full">
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
