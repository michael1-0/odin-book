import { useEffect } from "react";
import { useFetcher } from "react-router";
import { FORM_FIELDS } from "../constants/fields";
import { FORM_INTENTS } from "../constants/routes";
import toast from "react-hot-toast";
import type { ActionResult } from "../utils/actionResult";
import type { CommentRow } from "../services/comments";

type CommentComposerProps = {
  postId: number;
};

// The "create comment" form. Submits via useFetcher to the current route's
// action (no navigation); route revalidation then refreshes the comment list
// below the form. `key={submissionId}` remounts the form after a successful
// comment — clearing native inputs React can't control — while validation
// errors keep the form intact.
function CommentComposer({ postId }: CommentComposerProps) {
  const commentFetcher = useFetcher<ActionResult<CommentRow>>();

  const { state: commentFetcherState } = commentFetcher;
  const commentResult = commentFetcher.data;

  const isPosting = commentFetcherState === "submitting";

  // Form resets
  const submissionId = commentResult?.ok ? commentResult.data.id : "initial";

  useEffect(() => {
    if (commentFetcherState === "idle" && commentResult) {
      if (commentResult.ok) {
        toast.success("Comment posted");
      } else {
        toast.error(
          commentResult.kind === "server"
            ? commentResult.message
            : "Failed to create comment",
        );
      }
    }
  }, [commentResult, commentFetcherState]);

  const contentErrors =
    commentResult?.ok === false && commentResult.kind === "validation"
      ? commentResult.fieldErrors.content
      : undefined;

  return (
    <section>
      <commentFetcher.Form
        method="POST"
        className="flex flex-col items-stretch gap-4"
        key={submissionId}
      >
        <div className="mb-2 min-h-8 text-sm text-red-600">
          {contentErrors && contentErrors[0]}
        </div>
        <input type="hidden" name={FORM_FIELDS.postId} value={postId} />
        <label htmlFor="content" className="sr-only">
          Comment Content
        </label>
        <textarea
          id="content"
          name={FORM_FIELDS.content}
          required
          placeholder="Share your thoughts..."
          className="rounded-sm p-2 shadow-sm"
        />
        <button
          type="submit"
          name={FORM_FIELDS.intent}
          value={FORM_INTENTS.createComment}
          className="rounded-sm bg-black p-2 text-white"
          disabled={isPosting}
        >
          Post comment
        </button>
      </commentFetcher.Form>
    </section>
  );
}

export default CommentComposer;
