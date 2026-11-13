import type { PostComment } from "@repo/zod-validations";
import { Link } from "react-router";
import Avatar from "./Avatar";
import { userPath } from "../constants/routes";
import { formatShortDate } from "../utils/formatDate";

type CommentItemProps = {
  comment: PostComment;
};

// One comment card in a post's detail page: author link, content, timestamp.
function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-sm bg-neutral-100 p-4">
      <Link to={userPath(comment.user.id)} className="flex items-center gap-3">
        <Avatar user={comment.user} className="h-8 w-8" />
        <div>{comment.user.username}</div>
      </Link>
      <div>{comment.content}</div>
      <div className="text-sm ml-auto">
        {formatShortDate(comment.createdAt)}
      </div>
    </div>
  );
}

export default CommentItem;
