import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutation } from "./http";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function unparseableResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  } as unknown as Response;
}

function fetchMock() {
  return vi.fn<typeof fetch>();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends the cookie credentials and skips undefined query params", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetch);

    const result = await apiFetch("/api/posts", {
      query: { cursor: 5, scope: undefined, period: "month" },
      failureMessage: "Failed to load posts",
    });

    expect(result).toEqual({ data: [] });
    expect(fetch).toHaveBeenCalledWith(
      "/api/posts?cursor=5&period=month",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("omits the query string entirely when there are no params", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetch);

    await apiFetch("/api/health", { failureMessage: "Failed" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("serializes JSON bodies with a content-type header", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({ data: { id: 1 } }));
    vi.stubGlobal("fetch", fetch);

    await apiFetch("/api/comments", {
      method: "POST",
      body: { json: { postId: 1, content: "hi" } },
      failureMessage: "Failed",
    });

    expect(fetch).toHaveBeenCalledWith("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: 1, content: "hi" }),
    });
  });

  it("passes FormData through without setting a content type", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal("fetch", fetch);

    const formData = new FormData();
    formData.set("content", "hi");

    await apiFetch("/api/posts", {
      method: "POST",
      body: { formData },
      failureMessage: "Failed",
    });

    const [, options] = fetch.mock.calls[0] as [string, RequestInit];

    expect(options.body).toBe(formData);
    expect(options.headers).toBeUndefined();
  });

  it("throws a Response built from the backend error envelope", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(
      jsonResponse({ error: { code: 404, message: "Post not found" } }, 404),
    );
    vi.stubGlobal("fetch", fetch);

    const error = await apiFetch("/api/posts/1", {
      failureMessage: "Failed to load post",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(404);
    expect(await (error as Response).text()).toBe("Post not found");
  });

  it("falls back when the error body is not JSON", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(unparseableResponse(502));
    vi.stubGlobal("fetch", fetch);

    const error = await apiFetch("/api/posts", {
      failureMessage: "Proxy exploded",
    }).catch((caught: unknown) => caught);

    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).toBe("Proxy exploded");
  });

  it("propagates network errors", async () => {
    const fetch = fetchMock();
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);

    await expect(
      apiFetch("/api/posts", { failureMessage: "Failed" }),
    ).rejects.toThrow("Failed to fetch");
  });
});

describe("apiMutation", () => {
  it("unwraps the data envelope", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({ data: { id: 1 } }, 201));
    vi.stubGlobal("fetch", fetch);

    await expect(
      apiMutation("/api/posts", {
        method: "POST",
        body: { json: { content: "hi" } },
        failureMessage: "Failed",
      }),
    ).resolves.toEqual({ ok: true, data: { id: 1 } });
  });

  it("returns the server failure variant with the backend message", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(
      jsonResponse({ error: { code: 400, message: "Bad content" } }, 400),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(
      apiMutation("/api/posts", {
        method: "POST",
        body: { json: { content: "" } },
        failureMessage: "Failed to create post",
      }),
    ).resolves.toEqual({
      ok: false,
      kind: "server",
      message: "Bad content",
    });
  });

  it("uses the fallback for non-envelope error bodies", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValue(jsonResponse({ error: "nope" }, 500));
    vi.stubGlobal("fetch", fetch);

    await expect(
      apiMutation("/api/posts", {
        method: "POST",
        failureMessage: "Failed to create post",
      }),
    ).resolves.toEqual({
      ok: false,
      kind: "server",
      message: "Failed to create post",
    });
  });

  it("propagates network errors", async () => {
    const fetch = fetchMock();
    fetch.mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetch);

    await expect(
      apiMutation("/api/posts", {
        method: "POST",
        failureMessage: "Failed",
      }),
    ).rejects.toThrow("offline");
  });
});
