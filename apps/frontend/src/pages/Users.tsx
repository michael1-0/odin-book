import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { UserWithFollowStatus } from "@repo/zod-validations";
import { Link, useFetcher, useLoaderData } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
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
  const initialData = useLoaderData() as UsersLoaderData;
  const [pages, setPages] = useState<UsersLoaderData[]>([initialData]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fetcher = useFetcher();
  const { data: fetcherData, state: fetcherState } = fetcher;
  const followIntentRef = useRef<{ userId: number; follow: boolean } | null>(
    null,
  );

  const users = pages.flatMap((page) => page.users);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;

  const updateFollowStatus = useCallback(
    (userId: number, isFollowing: boolean) => {
      setPages((current) =>
        current.map((page) => ({
          ...page,
          users: page.users.map((user) =>
            user.id === userId ? { ...user, isFollowing } : user,
          ),
        })),
      );
    },
    [],
  );

  useEffect(() => {
    if (fetcherState !== "idle" || !fetcherData) {
      return;
    }

    const submission = followIntentRef.current;
    followIntentRef.current = null;

    if (!submission) {
      return;
    }

    if (fetcherData.error) {
      toast.error(fetcherData.message ?? "Failed to update follow status");
      return;
    }

    updateFollowStatus(submission.userId, submission.follow);
  }, [fetcherState, fetcherData, updateFollowStatus]);

  const loadNextPage = useCallback(
    async (force = false) => {
      if (nextCursor === null || isLoadingMore || (loadError && !force)) {
        return;
      }

      setIsLoadingMore(true);

      try {
        const page = await getUsers(nextCursor);
        const nextPage = {
          users: page.data as UserWithFollowStatus[],
          nextCursor: page.meta.nextCursor as number | null,
        };

        setPages((current) => {
          const seenIds = new Set(
            current.flatMap((page) => page.users.map((user) => user.id)),
          );
          const freshUsers = nextPage.users.filter(
            (user) => !seenIds.has(user.id),
          );

          return [...current, { ...nextPage, users: freshUsers }];
        });

        setLoadError(null);
      } catch {
        setLoadError("Couldn't load more users.");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [nextCursor, isLoadingMore, loadError],
  );

  return (
    <PageContainer>
      <PageHead title="Users" content="Explore Ark users." />
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-0 ">
        {users.map((user) => {
          const isSubmittingThisUser =
            fetcherState !== "idle" &&
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
              <fetcher.Form
                method="POST"
                action="/users"
                onSubmit={(event) => {
                  const formData = new FormData(event.currentTarget);
                  followIntentRef.current = {
                    userId: user.id,
                    follow: formData.get("intent") === "follow-user",
                  };
                }}
              >
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
          {loadError ? (
            <button
              type="button"
              onClick={() => void loadNextPage(true)}
              className="bg-black text-white p-2 rounded-sm"
            >
              Retry loading more
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void loadNextPage()}
              disabled={isLoadingMore}
              className="bg-black text-white p-2 rounded-sm disabled:opacity-50"
            >
              {isLoadingMore ? "Loading more..." : "Load more"}
            </button>
          )}
        </section>
      )}
    </PageContainer>
  );
}

Users.loader = loader;
Users.action = action;

export default Users;
