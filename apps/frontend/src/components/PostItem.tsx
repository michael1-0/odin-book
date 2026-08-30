import type { PostFeedItem, PostLike } from "@repo/zod-validations";
import { LucideHeart, MessageSquare } from "lucide-react";
import { Link, useFetcher, useNavigate } from "react-router";
import { useState } from "react";
import PostImageModal from "./PostImageModal";
import getOptimizedImageUrl from "../utils/cloudinaryUrl";

type PostItemProps = {
  post: PostFeedItem;
  userId: number;
  includeHeader?: boolean;
};

function PostItem({ post, userId, includeHeader = true }: PostItemProps) {
  const likeFetcher = useFetcher();
  const navigate = useNavigate();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const currentPost =
    likeFetcher.state === "idle" && likeFetcher.data
      ? (likeFetcher.data as PostFeedItem)
      : post;
  const likesCount = currentPost._count.likes;
  const isLikedByMe = checkIfLiked(currentPost.likes);
  const images = currentPost.images;

  function checkIfLiked(likes: PostLike[]) {
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
            className="object-cover w-10 h-10 rounded-full"
            alt={`${post.user.username} profile`}
          />
          <div>{post.user.username}</div>
        </Link>
      )}
      <div>{post.content}</div>
      {images.length === 1 && (
        <img
          src={getOptimizedImageUrl(images[0].url, 1200)}
          alt="Post image 1"
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageUrl(images[0].url);
          }}
          className="w-full max-h-80 rounded-sm object-cover"
        />
      )}
      {images.length === 2 && (
        <div className="grid w-full grid-cols-2 gap-2">
          {images.map((image, index) => (
            <img
              key={image.id}
              src={getOptimizedImageUrl(image.url, 600)}
              alt={`Post image ${index + 1}`}
              loading="lazy"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageUrl(image.url);
              }}
              className="h-64 w-full rounded-sm object-cover"
            />
          ))}
        </div>
      )}
      {images.length >= 3 && (
        <div className="grid h-96 w-full grid-cols-2 grid-rows-2 gap-2">
          {images.slice(0, 3).map((image, index) => (
            <img
              key={image.id}
              src={getOptimizedImageUrl(image.url, index === 0 ? 900 : 600)}
              alt={`Post image ${index + 1}`}
              loading="lazy"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageUrl(image.url);
              }}
              className={`h-full w-full rounded-sm object-cover ${index === 0 ? "row-span-2" : ""}`}
            />
          ))}
        </div>
      )}
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
      {selectedImageUrl && (
        <PostImageModal
          imageUrl={selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
        />
      )}
    </div>
  );
}

export default PostItem;
