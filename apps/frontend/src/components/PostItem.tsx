import type { LikeFeed, PostFeedItem } from "@repo/zod-validations";
import { LucideHeart, MessageSquare } from "lucide-react";
import { useFetcher } from "react-router";

function PostItem({ post, userId }: { post: PostFeedItem; userId: number }) {
  const likeFetcher = useFetcher();

  function checkIfLiked(likes: LikeFeed[]) {
    return likes.some((like) => like.userId === userId);
  }

  const isLikedByMe = checkIfLiked(post.likes);

  return (
    <div className="rounded-sm flex flex-col gap-5 py-6 items-start">
      <div className="flex gap-5 items-center">
        <img
          src={post.user.profileUrl}
          className="max-w-10 max-h-20 rounded-full"
          alt={`${post.user.username} profile`}
        />
        <div>{post.user.username}</div>
      </div>
      <div className="">{post.content}</div>
      <div className="flex items-center gap-4 w-full">
        <likeFetcher.Form
          className="flex gap-1"
          method={isLikedByMe ? "DELETE" : "POST"}
        >
          <input type="hidden" name="currentUserId" value={userId} />
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            name="intent"
            value={isLikedByMe ? "unlike-post" : "like-post"}
          >
            <LucideHeart
              className={`transition-colors ${isLikedByMe && "fill-black"}`}
            />
          </button>
          <div>{post._count.likes}</div>
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
