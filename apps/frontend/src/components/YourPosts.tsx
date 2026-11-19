import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { type PostFeedItem } from "@repo/zod-validations";
import { FORM_INTENTS } from "../constants/routes";
import { FORM_FIELDS } from "../constants/fields";
import type { ActionResult } from "../utils/actionResult";
import PostItem from "./PostItem";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import toast from "react-hot-toast";
import { LucideTrash2 } from "lucide-react";

type YourPostsProps = {
  posts: PostFeedItem[];
  userId: number;
  removeItem: (itemId: number) => void;
};

// The signed-in user's own posts, with delete. Deleting submits via
// useFetcher to the current route's action (no navigation); on success the
// effect removes the item from the feed pages via `removeItem`, owned by
// the page's infinite feed. The list itself is never edited here.
function YourPosts({ posts, userId, removeItem }: YourPostsProps) {
  const deleteFetcher = useFetcher<ActionResult<{ id: number }>>();
  const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
  const deleteResult = deleteFetcher.data;

  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteResult) {
      if (deleteResult.ok) {
        removeItem(deleteResult.data.id);
        toast.success("Post deleted");
      } else {
        toast.error(
          deleteResult.kind === "server"
            ? deleteResult.message
            : "Failed to delete post",
        );
      }
    }
  }, [deleteResult, deleteFetcher.state, removeItem]);

  return (
    <section>
      <div className="text-xl font-semibold">Your Posts</div>
      {posts.length === 0 && (
        <div className="mt-2 text-sm text-neutral-500">
          You haven't posted anything yet.
        </div>
      )}
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          userId={userId}
          includeHeader={false}
          deleteButton={
            <button
              type="button"
              disabled={deleteFetcher.state !== "idle"}
              onClick={(event) => {
                // PostItem navigates on click; deleting shouldn't.
                event.stopPropagation();
                setPostToDeleteId(post.id);
              }}
              aria-label="Delete post"
              className="disabled:opacity-50"
            >
              <LucideTrash2 size={16} />
            </button>
          }
        />
      ))}
      {postToDeleteId !== null && (
        <ConfirmDeleteModal
          onCancel={() => setPostToDeleteId(null)}
          onConfirm={() => {
            // Capture before clearing so the modal text and submission
            // always refer to the same post.
            const postId = postToDeleteId;
            setPostToDeleteId(null);
            void deleteFetcher.submit(
              {
                [FORM_FIELDS.intent]: FORM_INTENTS.deletePost,
                [FORM_FIELDS.postId]: String(postId),
              },
              { method: "POST" },
            );
          }}
        />
      )}
    </section>
  );
}

export default YourPosts;
