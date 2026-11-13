import { useEffect } from "react";
import { useFetcher } from "react-router";
import { FORM_FIELDS } from "../constants/fields";
import { FORM_INTENTS } from "../constants/routes";
import toast from "react-hot-toast";

type CommentComposerProps = {
  postId: number;
};

// The "create comment" form. Submits via useFetcher to the current route's
// action (no navigation); route revalidation then refreshes the comment list
// below the form. `key={submissionId}` remounts the form after a successful
// comment — clearing native inputs React can't control — while validation
// errors keep the form intact.
function CommentComposer({ postId }: CommentComposerProps) {
  const commentFetcher = useFetcher();

  const { data: commentFetcherData, state: commentFetcherState } =
    commentFetcher;

  const isPosting = commentFetcherState === "submitting";
  const hasError = commentFetcherData?.error;

  // Form resets
  const submissionId =
    commentFetcherData && !hasError ? commentFetcherData.id : "initial";

  useEffect(() => {
    if (commentFetcherState === "idle" && commentFetcherData) {
      if (hasError) {
        toast.error("Failed to create comment");
      } else {
        toast.success("Comment posted");
      }
    }
  }, [commentFetcherData, commentFetcherState, hasError]);

  const contentErrors = commentFetcherData?.errors?.content;

  return (
    <section>
      <commentFetcher.Form
        method="POST"
        className="flex flex-col items-stretch gap-4"
        key={submissionId}
      >
        <div className="mb-2 text-sm text-red-600 min-h-8">
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
          className="rounded-sm shadow-sm p-2"
        />
        <button
          type="submit"
          name={FORM_FIELDS.intent}
          value={FORM_INTENTS.createComment}
          className="bg-black text-white rounded-sm p-2"
          disabled={isPosting}
        >
          Post comment
        </button>
      </commentFetcher.Form>
    </section>
  );
}

export default CommentComposer;
