import type { UserWithFollowStatus } from "@repo/zod-validations";
import { Link } from "react-router";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import { userPath } from "../constants/routes";

type UserCardProps = {
  user: UserWithFollowStatus;
};

// One user card in the users grid: a link to the user's profile with
// avatar, username, and a follow toggle. The button stops propagation so
// pressing it doesn't follow the card's link.
function UserCard({ user }: UserCardProps) {
  return (
    <Link
      to={userPath(user.id)}
      className="flex min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm bg-neutral-100 p-4 hover:bg-neutral-200"
    >
      <Avatar user={user} className="max-h-24 max-w-24" />
      <div className="w-full truncate px-2 text-center" title={user.username}>
        {user.username}
      </div>
      <FollowButton targetUserId={user.id} isFollowing={user.isFollowing} />
    </Link>
  );
}

export default UserCard;
