import type { PostFeedItem, PostLike } from "@repo/zod-validations";
import { LucideHeart, MessageSquare } from "lucide-react";
import { Link, useFetcher, useNavigate } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { postPath, userPath, FORM_INTENTS } from "../constants/routes";
import PostImageModal from "./PostImageModal";
import getOptimizedImageUrl from "../utils/cloudinaryUrl";
import { formatShortDate } from "../utils/formatDate";
import { IMAGE_WIDTHS } from "../constants/ui";

type PostItemProps = {
  post: PostFeedItem;
  userId: number;
  includeHeader?: boolean;
  deleteButton?: ReactNode;
};

function PostItem({
  post,
  userId,
  includeHeader = true,
  deleteButton,
}: PostItemProps) {
  const likeFetcher = useFetcher();
  const navigate = useNavigate();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const likeFetcherData = likeFetcher.data as
    | (PostFeedItem & { error?: never })
    | { error: true; message?: string }
    | undefined;
  const currentPost =
    likeFetcher.state === "idle" && likeFetcherData && !likeFetcherData.error
      ? likeFetcherData
      : post;
  const likesCount = currentPost._count.likes;
  const isLikedByMe = checkIfLiked(currentPost.likes);
  const images = currentPost.images;

  useEffect(() => {
    if (likeFetcher.state === "idle" && likeFetcherData?.error) {
      toast.error(likeFetcherData.message ?? "Failed to update like");
    }
  }, [likeFetcher.state, likeFetcherData]);

  function checkIfLiked(likes: PostLike[]) {
    return likes.some((like) => like.userId === userId);
  }

  function handleCardClick() {
    navigate(postPath(post.id));
  }

  return (
    <div
      onClick={handleCardClick}
      className="rounded-sm flex flex-col gap-5 py-4 items-start cursor-pointer"
    >
      {includeHeader && (
        <Link
          to={userPath(post.user.id)}
          onClick={(e) => e.stopPropagation()}
          className="flex gap-5 items-center"
        >
          <img
            src={post.user.profileUrl ?? undefined}
            className="object-cover w-10 h-10 rounded-full"
            alt={`${post.user.username} profile`}
          />
          <div>{post.user.username}</div>
        </Link>
      )}
      <div>{post.content}</div>
      {images.length === 1 && (
        <img
          src={getOptimizedImageUrl(images[0].url, IMAGE_WIDTHS.large)}
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
              src={getOptimizedImageUrl(image.url, IMAGE_WIDTHS.small)}
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
              src={getOptimizedImageUrl(
                image.url,
                index === 0 ? IMAGE_WIDTHS.medium : IMAGE_WIDTHS.small,
              )}
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
            value={
              isLikedByMe ? FORM_INTENTS.unlikePost : FORM_INTENTS.likePost
            }
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
        <div className="text-sm ml-auto">{formatShortDate(post.createdAt)}</div>
        {deleteButton}
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
