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

async function loader({ params }: LoaderFunctionArgs) {
  const response = await fetch("/api/auth/me");

  if (response.ok) {
    const currentUser = await response.json();

    if (currentUser.id === Number(params.userId)) {
      throw redirect("/profile");
    }
  }

  return await getUserProfile(params.userId);
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

function UserDetail() {
  const { user } = useRouteLoaderData("user-data");
  const userWithPosts: UserWithPosts = useLoaderData();

  return (
    <>
      <Back />
      <div className="px-4 mt-15 flex flex-col gap-20">
        <div className="flex flex-col items-center gap-4">
          <img
            src={userWithPosts.profileUrl}
            alt={`${userWithPosts.username} profile image`}
            className="max-w-40 max-h-30 rounded-full"
          />
          <div className="text-xl">{userWithPosts.username}</div>
          <div className="">{userWithPosts.noteToAll}</div>
        </div>
        <div>
          <div className="font-semibold">Posts</div>
          {userWithPosts.posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              userId={user.id}
              includeHeader={false}
            />
          ))}
        </div>
      </div>
    </>
  );
}

UserDetail.loader = loader;
UserDetail.action = action;

export default UserDetail;
