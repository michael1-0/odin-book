import {
  useFetcher,
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getPostWithComments, likePost, unlikePost } from "../services/posts";
import type { PostFeedItemWithComments } from "@repo/zod-validations";
import PostItem from "../components/PostItem";
import { createComment } from "../services/comments";
import { useEffect, useRef } from "react";

async function loader({ params }: LoaderFunctionArgs) {
  return await getPostWithComments(params.postId);
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create-comment":
      return await createComment(formData);
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
  const formRef = useRef<HTMLFormElement>(null);

  const isDone = commentFetcher.state === "idle" && commentFetcher.data != null;
  useEffect(() => {
    if (isDone && !commentFetcher.data?.error) {
      formRef.current?.reset();
    }
  }, [isDone, commentFetcher.data]);

  const isPosting = commentFetcher.state === "submitting";

  return (
    <div className="px-4 mt-20 flex flex-col gap-14">
      <PostItem post={post} userId={user.id} />
      <commentFetcher.Form
        className=" flex flex-col items-stretch gap-4"
        method="POST"
        ref={formRef}
      >
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
      <div className="flex flex-col gap-4">
        {post.comments.map((comment) => {
          return (
            <div
              key={comment.id}
              className="flex flex-col gap-3 rounded-sm bg-neutral-50 p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={comment.user.profileUrl}
                  className="max-w-8 max-h-8 rounded-full"
                  alt={`${comment.user.username} profile picture`}
                />
                <div>{comment.user.username}</div>
              </div>
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
      </div>
    </div>
  );
}

PostDetail.loader = loader;
PostDetail.action = action;

export default PostDetail;
