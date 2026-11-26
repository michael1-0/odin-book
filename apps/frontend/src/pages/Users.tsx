import { useRef } from "react";
import {
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import type { UsersGetResponse } from "@repo/zod-validations";
import { FORM_INTENTS } from "../constants/routes";
import { LOAD_MORE_USERS_ERROR_TEXT } from "../constants/ui";
import { readIntent, unknownIntent } from "../utils/intent";
import { readOffsetParam } from "../utils/queryParams";
import { followUser, unfollowUser } from "../services/follows";
import { getUsers } from "../services/users";
import useInfiniteFeed from "../hooks/useInfiniteFeed";
import UserCard from "../components/UserCard";
import LoadMoreStatus from "../components/LoadMoreStatus";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

async function loader({ request }: LoaderFunctionArgs) {
  return await getUsers(readOffsetParam(request));
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (readIntent(formData)) {
    case FORM_INTENTS.followUser:
      return await followUser(formData);
    case FORM_INTENTS.unfollowUser:
      return await unfollowUser(formData);
    default:
      throw unknownIntent();
  }
}

// The users grid, mirroring Home's client-side cursor pagination: the
// loader provides the first page, useInfiniteFeed accumulates pages as the
// sentinel scrolls into view, and each card owns its follow button.
function Users() {
  const initialPage = useLoaderData<UsersGetResponse>();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    items: users,
    hasMore,
    isLoadingMore,
    loadError,
    loadNextPage,
  } = useInfiniteFeed({
    initialPage,
    loadMoreRef,
    loadPage: getUsers,
    loadErrorText: LOAD_MORE_USERS_ERROR_TEXT,
  });

  return (
    <PageContainer>
      <PageHead title="Users" content="Explore Ark users." />
      <section className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {users.length === 0 && (
          <div className="col-span-full text-sm text-neutral-500">
            No other users yet.
          </div>
        )}
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
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

Users.loader = loader;
Users.action = action;

export default Users;
