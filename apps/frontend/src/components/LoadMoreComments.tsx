import { Link, useNavigation, useSearchParams } from "react-router";
import { QUERY_PARAMS } from "../constants/fields";

type LoadMoreCommentsProps = {
  nextCursor: number | null;
};

// The "load more" slot under a post's offset-paginated comment list: a link
// that re-runs the route loader with the next offset, reading "Loading
// more..." while that navigation is in flight. Renders nothing once the
// loader reports no further comments (`nextCursor === null`).
function LoadMoreComments({ nextCursor }: LoadMoreCommentsProps) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  if (nextCursor === null) {
    return null;
  }

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set(QUERY_PARAMS.offset, String(nextCursor));

  const isLoadMorePending =
    navigation.state === "loading" &&
    navigation.location.search.includes(QUERY_PARAMS.offset);

  return (
    <section className="flex justify-center">
      <Link
        to={`?${loadMoreSearchParams.toString()}`}
        preventScrollReset
        className="rounded-sm bg-black p-2 text-white"
      >
        {isLoadMorePending ? "Loading more..." : "Load more"}
      </Link>
    </section>
  );
}

export default LoadMoreComments;
