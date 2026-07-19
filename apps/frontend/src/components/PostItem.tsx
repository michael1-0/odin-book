import type { LikeFeed, PostFeedItem } from "@repo/zod-validations";
import { LucideHeart, MessageSquare } from "lucide-react";
import { Link, useFetcher, useNavigate } from "react-router";

type PostItemProps = {
  post: PostFeedItem;
  userId: number;
  includeHeader?: boolean;
};

function PostItem({ post, userId, includeHeader = true }: PostItemProps) {
  const likeFetcher = useFetcher();
  const navigate = useNavigate();
  const currentPost =
    likeFetcher.state === "idle" && likeFetcher.data
      ? (likeFetcher.data as PostFeedItem)
      : post;
  const likesCount = currentPost._count.likes;
  const isLikedByMe = checkIfLiked(currentPost.likes);

  function checkIfLiked(likes: LikeFeed[]) {
    return likes.some((like) => like.userId === userId);
  }

  function handleCardClick() {
    navigate(`/posts/${post.id}`);
  }

  return (
    <div
      onClick={handleCardClick}
      className="rounded-sm flex flex-col gap-5 py-4 items-start cursor-pointer"
    >
      {includeHeader && (
        <Link
          to={`/users/${post.user.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex gap-5 items-center"
        >
          <img
            src={post.user.profileUrl}
            className="max-w-10 max-h-20 rounded-full"
            alt={`${post.user.username} profile`}
          />
          <div>{post.user.username}</div>
        </Link>
      )}
      <div>{post.content}</div>
      <div className="flex items-center gap-4 w-full">
        <likeFetcher.Form className="flex gap-1" method="POST">
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            name="intent"
            value={isLikedByMe ? "unlike-post" : "like-post"}
            onClick={(e) => e.stopPropagation()}
            disabled={likeFetcher.state !== "idle"}
          >
            <LucideHeart
              className={`transition-colors ${isLikedByMe && "fill-black"}`}
            />
          </button>
          <div>{likesCount}</div>
        </likeFetcher.Form>
        <div className="flex gap-1">
          <MessageSquare />
          <div>{post._count.comments}</div>
        </div>
        <div className="text-sm ml-auto">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}

export default PostItem;
