import type { PostFeedItem, PostLike } from "@repo/zod-validations";
import { LucideHeart, MessageSquare } from "lucide-react";
import { Link, useFetcher, useNavigate } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { postPath, userPath, FORM_INTENTS } from "../constants/routes";
import { FORM_FIELDS } from "../constants/fields";
import type { ActionResult } from "../utils/actionResult";
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
  const likeFetcher = useFetcher<ActionResult<PostFeedItem>>();
  const navigate = useNavigate();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const likeResult = likeFetcher.data;
  const currentPost =
    likeFetcher.state === "idle" && likeResult?.ok ? likeResult.data : post;
  const likesCount = currentPost._count.likes;
  const isLikedByMe = checkIfLiked(currentPost.likes);
  const images = currentPost.images;
  const singleImage = images.length === 1 ? images[0] : undefined;

  useEffect(() => {
    if (
      likeFetcher.state === "idle" &&
      likeResult &&
      !likeResult.ok &&
      likeResult.kind === "server"
    ) {
      toast.error(likeResult.message);
    }
  }, [likeFetcher.state, likeResult]);

  function checkIfLiked(likes: PostLike[]) {
    return likes.some((like) => like.userId === userId);
  }

  function handleCardClick() {
    void navigate(postPath(post.id));
  }

  return (
    <div
      onClick={handleCardClick}
      className="flex cursor-pointer flex-col items-start gap-5 rounded-sm py-4"
    >
      {includeHeader && (
        <Link
          to={userPath(post.user.id)}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-5"
        >
          <img
            src={post.user.profileUrl ?? undefined}
            className="size-10 rounded-full object-cover"
            alt={`${post.user.username} profile`}
          />
          <div>{post.user.username}</div>
        </Link>
      )}
      <div>{post.content}</div>
      {singleImage && (
        <img
          src={getOptimizedImageUrl(singleImage.url, IMAGE_WIDTHS.large)}
          alt="Post image 1"
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageUrl(singleImage.url);
          }}
          className="max-h-80 w-full rounded-sm object-cover"
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
              className={`size-full rounded-sm object-cover ${index === 0 ? "row-span-2" : ""}`}
            />
          ))}
        </div>
      )}
      <div className="flex w-full items-center gap-4">
        <likeFetcher.Form className="flex gap-1" method="POST">
          <input type="hidden" name={FORM_FIELDS.postId} value={post.id} />
          <button
            type="submit"
            name={FORM_FIELDS.intent}
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
        <div className="ml-auto text-sm">{formatShortDate(post.createdAt)}</div>
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
