import { useRef } from "react";
import {
  useRouteLoaderData,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import {
  PostCreateBodySchema,
  z,
  type PostsGetResponse,
} from "@repo/zod-validations";
import { FORM_INTENTS, ROUTE_ID } from "../constants/routes";
import { createPost, loadPosts } from "../services/posts";
import { likePost, unlikePost } from "../services/likes";
import useInfiniteFeed from "../hooks/useInfiniteFeed";
import PostComposer from "../components/PostComposer";
import PostItem from "../components/PostItem";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

async function loader() {
  return await loadPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-post": {
      const parsedPost = PostCreateBodySchema.safeParse({
        content: formData.get("content"),
      });

      if (!parsedPost.success) {
        return {
          error: true,
          errors: z.flattenError(parsedPost.error).fieldErrors,
        };
      }

      return await createPost(formData);
    }
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Home() {
  const { user } = useRouteLoaderData(ROUTE_ID);
  const initialPage = useLoaderData() as PostsGetResponse;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const feed = useInfiniteFeed(initialPage, loadMoreRef);

  return (
    <PageContainer>
      <PageHead
        title="Home"
        content="You can post here, and look at the latest posts."
      />
      <PostComposer onCreated={feed.insertPost} />
      <section className="flex flex-col gap-4 w-full">
        {feed.posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </section>
      <section
        ref={loadMoreRef}
        className="flex w-full items-center justify-center text-sm text-neutral-500"
      >
        {feed.loadError ? (
          <button
            type="button"
            onClick={() => void feed.loadNextPage(true)}
            className="rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200"
          >
            Retry loading more
          </button>
        ) : feed.isLoadingMore ? (
          "Loading more posts..."
        ) : (
          feed.hasMore && "Scroll to load more"
        )}
      </section>
    </PageContainer>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
