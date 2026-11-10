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
import { LOAD_MORE_ERROR_TEXT, LOAD_MORE_ERROR_TOAST } from "../constants/ui";
import { createPost, getLatestPosts } from "../services/posts";
import { likePost, unlikePost } from "../services/likes";
import useInfiniteFeed from "../hooks/useInfiniteFeed";
import PostComposer from "../components/PostComposer";
import LoadMoreStatus from "../components/LoadMoreStatus";
import PostItem from "../components/PostItem";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

async function loader() {
  return await getLatestPosts();
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
  const {
    items: posts,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
    insertItem,
  } = useInfiniteFeed({
    initialPage,
    loadMoreRef,
    loadPage: getLatestPosts,
    loadErrorText: LOAD_MORE_ERROR_TEXT,
    failureToast: LOAD_MORE_ERROR_TOAST,
  });

  return (
    <PageContainer>
      <PageHead
        title="Home"
        content="You can post here, and look at the latest posts."
      />
      <PostComposer onCreated={insertItem} />
      <section className="flex flex-col gap-4 w-full">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))}
      </section>
      <LoadMoreStatus
        loadMoreRef={loadMoreRef}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadError={loadError}
        onRetry={() => loadNextPage(true)}
      />
    </PageContainer>
  );
}

Home.loader = loader;
Home.action = action;

export default Home;
