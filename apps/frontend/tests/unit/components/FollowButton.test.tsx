import { createRoutesStub } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import FollowButton from "../../../src/components/FollowButton";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn() },
}));

function renderButton(action: () => Promise<unknown>, isFollowing = false) {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: () => (
        <FollowButton targetUserId={2} isFollowing={isFollowing} />
      ),
      action,
    },
  ]);

  render(<Stub initialEntries={["/"]} />);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("FollowButton", () => {
  it("flips to Unfollow after a successful follow", async () => {
    renderButton(() =>
      Promise.resolve({ ok: true, data: { isFollowing: true } }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Follow" }));

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("Unfollow");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("keeps the label and toasts when the follow fails", async () => {
    renderButton(() =>
      Promise.resolve({
        ok: false,
        kind: "server",
        message: "Failed to follow user",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Follow" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to follow user");
    });
    expect(screen.getByRole("button")).toHaveTextContent("Follow");
  });
});
