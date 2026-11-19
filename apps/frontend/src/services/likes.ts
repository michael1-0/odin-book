import type { ActionResult } from "./actionResult";
import type { PostFeedItem } from "@repo/zod-validations";
import { serverFailure } from "./actionResult";
import { API_PATHS } from "../constants/api";
import { FORM_FIELDS } from "../constants/fields";
import { readFormField } from "../utils/formData";
import { apiMutation } from "./http";

// Both return the updated post detail, so PostItem renders the new
// like state straight from the result data.
async function likePost(
  formData: FormData,
): Promise<ActionResult<PostFeedItem>> {
  const postId = readFormField(formData, FORM_FIELDS.postId);

  if (postId === undefined) {
    return serverFailure("Missing post ID");
  }

  return await apiMutation<PostFeedItem>(API_PATHS.likes(postId), {
    method: "POST",
    failureMessage: "Failed to like post",
  });
}

async function unlikePost(
  formData: FormData,
): Promise<ActionResult<PostFeedItem>> {
  const postId = readFormField(formData, FORM_FIELDS.postId);

  if (postId === undefined) {
    return serverFailure("Missing post ID");
  }

  return await apiMutation<PostFeedItem>(API_PATHS.likes(postId), {
    method: "DELETE",
    failureMessage: "Failed to unlike post",
  });
}

export { likePost, unlikePost };
