import {
  useLoaderData,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useRouteLoaderData,
} from "react-router";
import { getUserProfile } from "../services/users";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import type { UserWithPosts } from "@repo/zod-validations";
import Back from "../components/Back";
import FollowButton from "../components/FollowButton";
import PageContainer from "../components/PageContainer";
import { followUser, unfollowUser } from "../services/follows";
import { APP_ROUTES, FORM_INTENTS, ROUTE_ID } from "../constants/routes";
import { readIntent, unknownIntent } from "../utils/intent";
import { API_PATHS } from "../constants/api";

async function loader({ params }: LoaderFunctionArgs) {
  const response = await fetch(API_PATHS.authMe);

  if (response.ok) {
    const currentUser = await response.json();

    if (currentUser.id === Number(params.userId)) {
      throw redirect(APP_ROUTES.profile);
    }
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
  const { user } = useRouteLoaderData(ROUTE_ID);
  const userWithPosts: UserWithPosts = useLoaderData();

  return (
    <PageContainer>
      <Back />
      <section className="flex flex-col items-center gap-4">
        <img
          src={userWithPosts.profileUrl ?? undefined}
          alt={`${userWithPosts.username} profile image`}
          className="max-w-40 max-h-30 rounded-full"
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
