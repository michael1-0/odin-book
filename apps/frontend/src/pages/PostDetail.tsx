import {
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  CommentCreateBodySchema,
  type PostFeedItemWithComments,
} from "@repo/zod-validations";
import { FORM_FIELDS } from "../constants/fields";
import { FORM_INTENTS, ROUTE_ID } from "../constants/routes";
import { readIntent, unknownIntent } from "../utils/intent";
import { submitForm } from "../utils/formValidation";
import { readOffsetParam } from "../utils/queryParams";
import { createComment } from "../services/comments";
import { likePost, unlikePost } from "../services/likes";
import { getPostWithComments } from "../services/posts";
import PostItem from "../components/PostItem";
import Back from "../components/Back";
import CommentComposer from "../components/CommentComposer";
import CommentItem from "../components/CommentItem";
import LoadMoreComments from "../components/LoadMoreComments";
import PageContainer from "../components/PageContainer";

type PostDetailLoaderData = {
  post: PostFeedItemWithComments;
  nextCursor: number | null;
};

async function loader({ request, params }: LoaderFunctionArgs) {
  const page = await getPostWithComments(
    params.postId,
    readOffsetParam(request),
  );

  return {
    post: page.data,
    nextCursor: page.meta.nextCursor,
  } satisfies PostDetailLoaderData;
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  switch (readIntent(formData)) {
    case FORM_INTENTS.createComment:
      return await submitForm(
        CommentCreateBodySchema,
        formData,
        {
          content: FORM_FIELDS.content,
          postId: FORM_FIELDS.postId,
        },
        (_, { content, postId }) => createComment(content, postId),
      );
    case FORM_INTENTS.likePost:
      return await likePost(formData);
    case FORM_INTENTS.unlikePost:
      return await unlikePost(formData);
    default:
      throw unknownIntent();
  }
}

// A single post and its paginated comments. The composer owns the comment
// form (toasts, resets, validation); route revalidation refreshes the list
// after each successful comment, and LoadMoreComments pages through older
// ones via the offset query param.
function PostDetail() {
  const { user } = useRouteLoaderData(ROUTE_ID);
  const { post, nextCursor } = useLoaderData() as PostDetailLoaderData;

  return (
    <PageContainer>
      <Back />
      <PostItem post={post} userId={user.id} />
      <CommentComposer postId={post.id} />
      <section className="flex flex-col gap-4">
        {post.comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </section>
      <LoadMoreComments nextCursor={nextCursor} />
    </PageContainer>
  );
}

PostDetail.loader = loader;
PostDetail.action = action;

export default PostDetail;
