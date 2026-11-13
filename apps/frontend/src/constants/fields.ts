// Field names that cross a write↔read boundary — hidden inputs and
// form fields written by components, read back by page actions and
// formData-based services. Every name lives here regardless of how many
// sites consume it, so the two ends of each pair can't drift.
//
// Kept frontend-local: intent is frontend-only — page actions dispatch on
// it and the backend never references it — while every other name appears
// exactly once in a backend @repo/zod-validations schema, so there is no
// backend-side duplication to bridge with @repo/constants.

// Hidden inputs / textareas read by actions and services.
export const FORM_FIELDS = {
  intent: "intent",
  postId: "postId",
  targetUserId: "targetUserId",
  requestId: "requestId",
  content: "content",
  userId: "userId",
  username: "username",
  noteToAll: "noteToAll",
} as const;

// URL query param names, each parsed by a backend zod-validations query
// schema. offset/beforeId/query also round-trip through loader URLs; the
// rest are written only by services. Values passed along with them stay
// inline in the single service function that owns each.
export const QUERY_PARAMS = {
  cursor: "cursor",
  offset: "offset",
  scope: "scope",
  period: "period",
  query: "query",
  beforeId: "beforeId",
  include: "include",
} as const;
