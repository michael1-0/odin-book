import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutation } from "./http";
import { FORM_FIELDS } from "../constants/fields";
import { API_PATHS } from "../constants/api";
import { serverFailure } from "../utils/actionResult";
import {
  createPost,
  deletePost,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
  getLatestPosts,
  getPostWithComments,
} from "./posts";

vi.mock("./http", () => ({
  apiFetch: vi.fn(),
  apiMutation: vi.fn(),
}));

const fetchMock = vi.mocked(apiFetch);
const mutationMock = vi.mocked(apiMutation);

function formDataWith(field: string, value: string) {
  const formData = new FormData();
  formData.set(field, value);
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("posts service", () => {
  it("creates a post from FormData", async () => {
    const result = { ok: true as const, data: { id: 1 } };
    mutationMock.mockResolvedValue(result as never);
    const formData = formDataWith(FORM_FIELDS.content, "hello");

    await expect(createPost(formData)).resolves.toBe(result);
    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.posts, {
      method: "POST",
      body: { formData },
      failureMessage: "Failed to create post",
    });
  });

  it("rejects a delete without a post ID", async () => {
    await expect(deletePost(new FormData())).resolves.toEqual(
      serverFailure("Missing post ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("deletes by post ID", async () => {
    const result = { ok: true as const, data: { id: 12 } };
    mutationMock.mockResolvedValue(result as never);

    await expect(
      deletePost(formDataWith(FORM_FIELDS.postId, "12")),
    ).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.post(12), {
      method: "DELETE",
      failureMessage: "Failed to delete post",
    });
  });

  it("rejects a post detail load without a post ID", async () => {
    await expect(getPostWithComments(undefined)).rejects.toBeInstanceOf(
      Response,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads post detail with the comments page", async () => {
    fetchMock.mockResolvedValue({ data: {} } as never);

    await getPostWithComments("5", 10);

    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.post(5), {
      query: { include: "comments", offset: 10 },
      failureMessage: "Failed to load post",
    });
  });

  it("threads cursors and scopes through the feed wrappers", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);

    await getLatestPosts(3);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: 3, scope: undefined, period: undefined },
      failureMessage: "Failed to load posts",
    });

    await getCurrentUserPosts();
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: undefined, scope: "me", period: undefined },
      failureMessage: "Failed to load posts",
    });

    await getFollowingPostsFromLastMonth(8);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: 8, scope: "following", period: "month" },
      failureMessage: "Failed to load posts",
    });
  });

  it.each([
    {
      name: "createPost",
      run: () => createPost(formDataWith(FORM_FIELDS.content, "hi")),
    },
    {
      name: "deletePost",
      run: () => deletePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
  ])("$name propagates the server failure", async ({ run }) => {
    const failure = serverFailure("mutation failed");
    mutationMock.mockResolvedValue(failure as never);

    await expect(run()).resolves.toBe(failure);
  });
});
