import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { UserWithFollowStatus } from "@repo/zod-validations";
import {
  Link,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { followUser, unfollowUser } from "../services/follows";
import { getUsers } from "../services/users";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

type UsersLoaderData = {
  users: UserWithFollowStatus[];
  nextCursor: number | null;
};

async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const offsetParam = url.searchParams.get("offset");
  const offset = offsetParam ? Number(offsetParam) : undefined;

  const page = await getUsers(offset);

  return {
    users: page.data,
    nextCursor: page.meta.nextCursor,
  } satisfies UsersLoaderData;
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
  const { users, nextCursor } = useLoaderData() as UsersLoaderData;
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);

  if (nextCursor !== null) {
    loadMoreSearchParams.set("offset", String(nextCursor));
  }

  const isLoadMorePending =
    navigation.state === "loading" &&
    navigation.location?.search.includes("offset");

  return (
    <PageContainer>
      <PageHead title="Users" content="Explore Ark users." />
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 ">
        {users.map((user) => {
          const isSubmittingThisUser =
            fetcher.state !== "idle" &&
            fetcher.formData?.get("targetUserId") === String(user.id);

          return (
            <Link
              to={`/users/${user.id}`}
              className="rounded-sm flex flex-col items-center justify-center gap-3 min-w-0 bg-neutral-100 p-4 hover:bg-neutral-200 cursor-pointer"
              key={user.id}
            >
              <img
                src={user.profileUrl}
                alt={`${user.username} profile image`}
                className="rounded-full max-w-24 max-h-24"
              />
              <div
                className="w-full text-center truncate px-2"
                title={user.username}
              >
                {user.username}
              </div>
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
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.isFollowing ? "Unfollow" : "Follow"}
                </button>
              </fetcher.Form>
            </Link>
          );
        })}
      </section>
      {nextCursor !== null && (
        <section className="flex justify-center">
          <Link
            to={`?${loadMoreSearchParams.toString()}`}
            preventScrollReset
            className="bg-black text-white p-2 rounded-sm"
          >
            {isLoadMorePending ? "Loading more..." : "Load more"}
          </Link>
        </section>
      )}
    </PageContainer>
  );
}

Users.loader = loader;
Users.action = action;

export default Users;
