import {
  Link,
  useFetcher,
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getPostWithComments } from "../services/posts";
import {
  CommentCreateBodySchema,
  z,
  type PostFeedItemWithComments,
} from "@repo/zod-validations";
import PostItem from "../components/PostItem";
import { createComment } from "../services/comments";
import { likePost, unlikePost } from "../services/likes";
import Back from "../components/Back";
import PageContainer from "../components/PageContainer";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { CircleX } from "lucide-react";

async function loader({ params }: LoaderFunctionArgs) {
  return await getPostWithComments(params.postId);
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-comment": {
      const parsedComment = CommentCreateBodySchema.safeParse({
        content: formData.get("content"),
        postId: formData.get("postId"),
      });

      if (!parsedComment.success) {
        return {
          error: true,
          errors: z.flattenError(parsedComment.error).fieldErrors,
        };
      }

      return await createComment(
        parsedComment.data.content,
        parsedComment.data.postId,
      );
    }
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function PostDetail() {
  const { user } = useRouteLoaderData("user-data");
  const post: PostFeedItemWithComments = useLoaderData();
  const commentFetcher = useFetcher();

  const isPosting = commentFetcher.state === "submitting";
  const hasError = commentFetcher.data?.error;

  const submissionId =
    commentFetcher.data && !hasError ? commentFetcher.data.id : "initial";

  useEffect(() => {
    if (commentFetcher.state === "idle" && commentFetcher.data) {
      if (hasError) {
        toast.error("Failed to create comment");
      } else {
        toast.success("Comment posted");
      }
    }
  }, [commentFetcher.data, commentFetcher.state, hasError]);

  const errors = commentFetcher.data?.errors;
  const contentErrors = errors?.content;

  return (
    <PageContainer>
      <Back />
      <PostItem post={post} userId={user.id} />
      <section>
        <commentFetcher.Form
          className=" flex flex-col items-stretch gap-4"
          method="POST"
          key={submissionId}
        >
          <div className="mb-2 text-sm text-red-600 min-h-8">
            {contentErrors && (
              <div className="flex gap-2 items-center">
                <CircleX size={20} />
                {contentErrors[0]}
              </div>
            )}
          </div>
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            id="content"
            name="content"
            className="rounded-sm shadow-sm p-2"
            placeholder="Share your thoughts..."
          ></textarea>
          <button
            type="submit"
            name="intent"
            value="create-comment"
            className="bg-black text-white rounded-sm p-2"
            disabled={isPosting}
          >
            {" "}
            Post comment
          </button>
        </commentFetcher.Form>
      </section>
      <section className="flex flex-col gap-4">
        {post.comments.map((comment) => {
          return (
            <div
              key={comment.id}
              className="flex flex-col gap-3 rounded-sm bg-neutral-100 p-4"
            >
              <Link
                to={`/users/${comment.user.id}`}
                className="flex items-center gap-3"
              >
                <img
                  src={comment.user.profileUrl}
                  className="max-w-8 max-h-8 rounded-full"
                  alt={`${comment.user.username} profile picture`}
                />
                <div>{comment.user.username}</div>
              </Link>
              <div>{comment.content}</div>
              <div className="text-sm ml-auto">
                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          );
        })}
      </section>
    </PageContainer>
  );
}

PostDetail.loader = loader;
PostDetail.action = action;

export default PostDetail;
