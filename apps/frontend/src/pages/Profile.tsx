import { useRef } from "react";
import {
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import {
  UserUpdateBodySchema,
  type PostsGetResponse,
} from "@repo/zod-validations";
import { FORM_INTENTS, ROUTE_ID } from "../constants/routes";
import { FORM_FIELDS } from "../constants/fields";
import { LOAD_MORE_ERROR_TEXT, LOAD_MORE_ERROR_TOAST } from "../constants/ui";
import { readIntent, unknownIntent } from "../utils/intent";
import { submitForm } from "../utils/formValidation";
import { deletePost, getCurrentUserPosts } from "../services/posts";
import { likePost, unlikePost } from "../services/likes";
import { updateUser } from "../services/users";
import useInfiniteFeed from "../hooks/useInfiniteFeed";
import ProfileForm from "../components/ProfileForm";
import YourPosts from "../components/YourPosts";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";
import LoadMoreStatus from "../components/LoadMoreStatus";

async function loader() {
  return await getCurrentUserPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (readIntent(formData)) {
    case FORM_INTENTS.updateUser:
      return await submitForm(
        UserUpdateBodySchema,
        formData,
        {
          username: FORM_FIELDS.username,
          noteToAll: FORM_FIELDS.noteToAll,
        },
        updateUser,
      );
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    case FORM_INTENTS.deletePost:
      return await deletePost(formData);
    default:
      throw unknownIntent();
  }
}

function Profile() {
  const { user } = useRouteLoaderData(ROUTE_ID);
  const initialPage = useLoaderData() as PostsGetResponse;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // Cursor-paginated list of the user's own posts (see useInfiniteFeed).
  const {
    items: posts,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
    removeItem,
  } = useInfiniteFeed({
    initialPage,
    loadMoreRef,
    loadPage: getCurrentUserPosts,
    loadErrorText: LOAD_MORE_ERROR_TEXT,
    failureToast: LOAD_MORE_ERROR_TOAST,
  });

  return (
    <PageContainer>
      <PageHead
        title="Profile"
        content="Update your profile, and look at your posts."
      />
      <ProfileForm user={user} />
      <YourPosts posts={posts} userId={user.id} removeItem={removeItem} />
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

Profile.loader = loader;
Profile.action = action;

export default Profile;
