import { QUERY_PARAMS } from "../constants/fields";

// Loader-side read of the offset query param: absent, empty ("") or
// malformed ("abc", "1.5", "-1") all mean "no offset" ("" parses as 0,
// indistinguishable from absent), so a garbage URL loads page 1 instead of
// surfacing a backend 400. The write side lives in LoadMoreComments.
export function readOffsetParam(request: Request): number | undefined {
  const raw = new URL(request.url).searchParams.get(QUERY_PARAMS.offset);

  if (raw === null) {
    return undefined;
  }

  const offset = Number(raw);

  return Number.isInteger(offset) && offset >= 0 ? offset : undefined;
}
