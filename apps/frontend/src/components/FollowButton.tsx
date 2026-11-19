import { useEffect } from "react";
import { useFetcher } from "react-router";
import toast from "react-hot-toast";
import { FORM_FIELDS } from "../constants/fields";
import { FORM_INTENTS } from "../constants/routes";
import type { ActionResult } from "../utils/actionResult";
import type { FollowState } from "../services/follows";

type FollowButtonProps = {
  targetUserId: number;
  isFollowing: boolean;
};

// Follow/unfollow toggle for one user. The form posts to the current
// route's action (UserCard on Users, UserDetail on itself — both dispatch
// the follow intents), so the button submits without navigation like the
// like button in PostItem.
//
// Follow state derives from the fetcher response — the follow services
// report the resulting state as `{ isFollowing }` — falling back to the
// prop before the first response arrives; failures surface as a toast.
function FollowButton({
  targetUserId,
  isFollowing: initial,
}: FollowButtonProps) {
  const followFetcher = useFetcher<ActionResult<FollowState>>();
  const followResult = followFetcher.data;
  const isFollowing =
    followFetcher.state === "idle" && followResult?.ok
      ? followResult.data.isFollowing
      : initial;

  useEffect(() => {
    if (
      followFetcher.state === "idle" &&
      followResult &&
      !followResult.ok &&
      followResult.kind === "server"
    ) {
      toast.error(followResult.message);
    }
  }, [followFetcher.state, followResult]);

  return (
    <followFetcher.Form method="POST">
      <input
        type="hidden"
        name={FORM_FIELDS.targetUserId}
        value={targetUserId}
      />
      <input
        type="hidden"
        name={FORM_FIELDS.intent}
        value={
          isFollowing ? FORM_INTENTS.unfollowUser : FORM_INTENTS.followUser
        }
      />
      <button
        disabled={followFetcher.state !== "idle"}
        className={`w-20 rounded-sm bg-black p-2 text-xs text-white ${
          followFetcher.state !== "idle" ? "opacity-50" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </button>
    </followFetcher.Form>
  );
}

export default FollowButton;
