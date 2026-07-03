import type { ActionFunctionArgs } from "react-router";
import type { UserWithFollowStatus } from "@repo/zod-validations";
import { useFetcher, useLoaderData } from "react-router";
import { followUser, unfollowUser } from "../services/follows";

async function loader() {
  const response = await fetch("/api/users");
  const users = await response.json();

  return users.data;
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "follow-user":
      return await followUser(formData);
    case "unfollow-user":
      return await unfollowUser(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Users() {
  const users: UserWithFollowStatus[] = useLoaderData();
  const fetcher = useFetcher();

  return (
    <div className="px-4 mt-20">
      <h2 className="text-xl text-center mb-6">Explore Users</h2>
      {users.map((user) => {
        const isSubmittingThisUser =
          fetcher.state !== "idle" &&
          fetcher.formData?.get("targetUserId") === String(user.id);

        return (
          <div
            className="mt-8 p-4 rounded-sm flex flex-col items-center justify-center gap-3"
            key={user.id}
          >
            <img
              src={user.profileUrl}
              alt={`${user.username} profile image`}
              className="rounded-full max-w-24 max-h-24"
            />
            <div>{user.username}</div>
            <fetcher.Form method="POST" action="/users">
              <input type="hidden" name="targetUserId" value={user.id} />
              <input
                type="hidden"
                name="intent"
                value={user.isFollowing ? "unfollow-user" : "follow-user"}
              />
              <button
                disabled={isSubmittingThisUser}
                className={`bg-black text-white rounded-sm p-2 text-xs w-20 ${
                  isSubmittingThisUser ? "opacity-50" : ""
                }`}
              >
                {user.isFollowing ? "Unfollow" : "Follow"}
              </button>
            </fetcher.Form>
          </div>
        );
      })}
    </div>
  );
}

Users.loader = loader;
Users.action = action;

export default Users;
