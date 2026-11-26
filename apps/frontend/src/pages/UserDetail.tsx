import {
  useLoaderData,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getUserProfile } from "../services/users";
import type { UserProfile } from "../services/users";
import { getMe } from "../services/auth";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import Back from "../components/Back";
import FollowButton from "../components/FollowButton";
import PageContainer from "../components/PageContainer";
import { followUser, unfollowUser } from "../services/follows";
import { APP_ROUTES, FORM_INTENTS } from "../constants/routes";
import { readIntent, unknownIntent } from "../utils/intent";
import useCurrentUser from "../hooks/useCurrentUser";

async function loader({ params }: LoaderFunctionArgs) {
  // A 401 from /auth/me (session expired mid-navigation) just skips the
  // self-profile redirect and renders the public profile below; network
  // errors still fail the loader.
  const currentUser = await getMe().catch((error: unknown) => {
    if (error instanceof Response) {
      return null;
    }

    throw error;
  });

  if (currentUser?.id === Number(params.userId)) {
    throw redirect(APP_ROUTES.profile);
  }

  return await getUserProfile(params.userId);
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (readIntent(formData)) {
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    case FORM_INTENTS.followUser:
      return await followUser(formData);
    case FORM_INTENTS.unfollowUser:
      return await unfollowUser(formData);
    default:
      throw unknownIntent();
  }
}

function UserDetail() {
  const user = useCurrentUser();
  const userWithPosts = useLoaderData<UserProfile>();

  return (
    <PageContainer>
      <Back />
      <section className="flex flex-col items-center gap-4">
        <img
          src={userWithPosts.profileUrl ?? undefined}
          alt={`${userWithPosts.username} profile image`}
          className="max-h-30 max-w-40 rounded-full"
        />
        <div className="text-xl">{userWithPosts.username}</div>
        <FollowButton
          targetUserId={userWithPosts.id}
          isFollowing={userWithPosts.isFollowing}
        />
        <div className="">{userWithPosts.noteToAll}</div>
      </section>
      <section>
        <div className="font-semibold">Posts</div>
        {userWithPosts.posts.length === 0 && (
          <div className="mt-2 text-sm text-neutral-500">
            {userWithPosts.username} hasn't posted anything yet.
          </div>
        )}
        {userWithPosts.posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            userId={user.id}
            includeHeader={false}
          />
        ))}
      </section>
    </PageContainer>
  );
}

UserDetail.loader = loader;
UserDetail.action = action;

export default UserDetail;
