import { useRef } from "react";
import {
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { getFollowingPostsFromLastMonth } from "../services/posts";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";
import useInfiniteFeed from "../hooks/useInfiniteFeed";
import LoadMoreStatus from "../components/LoadMoreStatus";
import type { PostsGetResponse } from "@repo/zod-validations";
import { FORM_INTENTS, ROUTE_ID } from "../constants/routes";
import { LOAD_MORE_ERROR_TEXT, LOAD_MORE_ERROR_TOAST } from "../constants/ui";

async function loader() {
  return await getFollowingPostsFromLastMonth();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Updates() {
  const { user } = useRouteLoaderData(ROUTE_ID);
  const initialPage = useLoaderData() as PostsGetResponse;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    items: posts,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
  } = useInfiniteFeed({
    initialPage,
    loadMoreRef,
    loadPage: getFollowingPostsFromLastMonth,
    loadErrorText: LOAD_MORE_ERROR_TEXT,
    failureToast: LOAD_MORE_ERROR_TOAST,
  });

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

Updates.loader = loader;
Updates.action = action;

export default Updates;
