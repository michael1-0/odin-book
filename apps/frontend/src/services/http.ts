import type { ActionResult } from "./actionResult";

// The single HTTP primitive for every /api call. Wraps fetch with the
// conventions every service used to hand-roll: cookie credentials on
// every request, query-string assembly, JSON or FormData bodies, and one
// error path per consumption mode. Services stay responsible for their
// own response shapes.
//
// Two adapters over one core `requestJson`:
// - apiFetch    — loader idiom: throws a Response on failure, which
//                 React Router catches and ErrorBoundary renders.
// - apiMutation — action idiom: returns the ActionResult union so route
//                 actions (and direct callers like ChatModal) get a
//                 value instead of an exception.
//
// Network failures (fetch itself rejecting) propagate from both — they
// are transport errors, not server responses.

// Values map to query params; undefined entries are skipped so callers
// pass optional params straight through.
type QueryParams = Record<string, string | number | undefined>;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: QueryParams;
  // Body — exactly one of a JSON value (serialized with a content-type
  // header) or a FormData; the union makes passing both a compile error.
  body?: { json: unknown } | { formData: FormData };
  // Used when the error body is not the backend's `{ error: { message } }`
  // envelope (a proxy's HTML 502 page, an empty body).
  failureMessage: string;
};

type RequestFailure = {
  ok: false;
  status: number;
  message: string;
};

// Pulls `error.message` out of a parsed error body, or falls back.
function extractErrorMessage(body: unknown, fallback: string): string {
  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { error?: unknown }).error === "object" &&
    (body as { error?: unknown }).error !== null &&
    typeof (body as { error?: { message?: unknown } }).error?.message ===
      "string"
  ) {
    return (body as { error: { message: string } }).error.message;
  }

  return fallback;
}

async function requestJson(
  path: string,
  { method, query, body, failureMessage }: RequestOptions,
): Promise<{ ok: true; body: unknown } | RequestFailure> {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  const response = await fetch(queryString ? `${path}?${queryString}` : path, {
    method: method ?? "GET",
    credentials: "include",
    ...(body && "json" in body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body.json),
        }
      : {}),
    ...(body && "formData" in body ? { body: body.formData } : {}),
  });

  if (!response.ok) {
    let message = failureMessage;

    try {
      message = extractErrorMessage(await response.json(), failureMessage);
    } catch {
      // Not JSON (proxy error page, empty body) — keep the fallback.
    }

    return { ok: false, status: response.status, message };
  }

  return { ok: true, body: await response.json() };
}

// Loader-facing adapter: returns the parsed JSON body typed as `T` and
// throws a Response on failure — the router turns it into an error
// response ErrorBoundary can render.
async function apiFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const result = await requestJson(path, options);

  if (!result.ok) {
    throw new Response(result.message, { status: result.status });
  }

  return result.body as T;
}

// Action-facing adapter: unwraps the backend's `{ data }` envelope into
// the ActionResult union. All mutation endpoints are enveloped.
async function apiMutation<T>(
  path: string,
  options: RequestOptions,
): Promise<ActionResult<T>> {
  const result = await requestJson(path, options);

  if (!result.ok) {
    return { ok: false, kind: "server", message: result.message };
  }

  return {
    ok: true,
    data: (result.body as { data: T }).data,
  };
}

export type { QueryParams, RequestOptions };
export { apiFetch, apiMutation };
