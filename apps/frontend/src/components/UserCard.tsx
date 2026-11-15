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
      className="rounded-sm flex flex-col items-center justify-center gap-3 min-w-0 bg-neutral-100 p-4 hover:bg-neutral-200 cursor-pointer"
    >
      <Avatar user={user} className="max-w-24 max-h-24" />
      <div className="w-full text-center truncate px-2" title={user.username}>
        {user.username}
      </div>
      <FollowButton targetUserId={user.id} isFollowing={user.isFollowing} />
    </Link>
  );
}

export default UserCard;
