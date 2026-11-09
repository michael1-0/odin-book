// Shared "peek" pagination: the query layer fetches `pageSize + 1` rows, and
// this helper splits off the overflow row to detect whether another page
// exists. Callers compute their own cursors (offsets or ids) from these values.
type SplitPageResult<T> = {
  items: T[];
  hasMore: boolean;
};

function splitPage<T>(rows: T[], pageSize: number): SplitPageResult<T> {
  const hasMore = rows.length > pageSize;

  return {
    items: hasMore ? rows.slice(0, pageSize) : rows,
    hasMore,
  };
}

export type { SplitPageResult };
export { splitPage };
