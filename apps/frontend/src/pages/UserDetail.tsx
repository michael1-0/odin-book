import {
  useLoaderData,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useRouteLoaderData,
  useFetcher,
} from "react-router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { getUserProfile } from "../services/users";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import type { UserWithPosts } from "@repo/zod-validations";
import Back from "../components/Back";
import PageContainer from "../components/PageContainer";
import { followUser, unfollowUser } from "../services/follows";
import { APP_ROUTES, FORM_INTENTS, ROUTE_ID } from "../constants/routes";
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
  const intent = formData.get("intent");

  switch (intent) {
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    case FORM_INTENTS.followUser:
      return await followUser(formData);
    case FORM_INTENTS.unfollowUser:
      return await unfollowUser(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function UserDetail() {
  const { user } = useRouteLoaderData(ROUTE_ID);
  const userWithPosts: UserWithPosts = useLoaderData();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    const data = fetcher.data as { error?: unknown; message?: string };

    if (data.error) {
      toast.error(data.message ?? "Failed to update follow status");
    }
  }, [fetcher.state, fetcher.data]);

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
        <fetcher.Form method="POST">
          <input type="hidden" name="targetUserId" value={userWithPosts.id} />
          <input
            type="hidden"
            name="intent"
            value={
              userWithPosts.isFollowing
                ? FORM_INTENTS.unfollowUser
                : FORM_INTENTS.followUser
            }
          />
          <button
            disabled={fetcher.state !== "idle"}
            className={`bg-black text-white rounded-sm p-2 text-xs w-20 ${
              fetcher.state !== "idle" ? "opacity-50" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {userWithPosts.isFollowing ? "Unfollow" : "Follow"}
          </button>
        </fetcher.Form>
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
