// The single result contract for mutations. Every route-action service
// returns this union, so components narrow on `ok`/`kind` instead of the
// three ad-hoc `{ error: true }` shapes that used to coexist (and on
// which nothing could soundly narrow).
//
// - ok: true            — the mutation succeeded; `data` is the payload.
// - kind: "validation"  — client-side zod validation failed (submitForm);
//                         `fieldErrors` renders inline per field.
// - kind: "server"      — the backend rejected the request, or a form
//                         invariant was broken; `message` is user-facing.

type ValidationFailure = {
  ok: false;
  kind: "validation";
  fieldErrors: Record<string, string[] | undefined>;
};

type ServerFailure = {
  ok: false;
  kind: "server";
  message: string;
};

type ActionResult<T> =
  | { ok: true; data: T }
  | ValidationFailure
  | ServerFailure;

function serverFailure(message: string): ServerFailure {
  return { ok: false, kind: "server", message };
}

export type { ActionResult, ValidationFailure, ServerFailure };
export { serverFailure };
