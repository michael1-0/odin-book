import {
  useFetcher,
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { getCurrentUserPosts } from "../services/posts";
import {
  UserUpdateBodySchema,
  z,
  type PostFeedItem,
} from "@repo/zod-validations";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { updateUser } from "../services/users";
import toast from "react-hot-toast";
import { useEffect } from "react";
import PageHead from "../components/PageHead";
import PageContainer from "../components/PageContainer";

async function loader() {
  return await getCurrentUserPosts();
}

async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "update-user": {
      const parsedUser = UserUpdateBodySchema.safeParse({
        username: formData.get("username"),
        noteToAll: formData.get("noteToAll"),
      });

      if (!parsedUser.success) {
        return {
          error: true,
          errors: z.flattenError(parsedUser.error).fieldErrors,
        };
      }

      return await updateUser(
        formData.get("userId"),
        parsedUser.data.username,
        parsedUser.data.noteToAll,
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

function Profile() {
  const { user } = useRouteLoaderData("user-data");
  const fetcher = useFetcher();
  const posts: PostFeedItem[] = useLoaderData();

  const isUpdating = fetcher.state === "submitting";
  const hasError = fetcher.data?.error;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (hasError) {
        toast.error("Failed to update profile");
      } else {
        toast.success("Profile updated");
      }
    }
  }, [fetcher.data, fetcher.state, hasError]);

  const errors = fetcher.data?.errors;
  const usernameErrors = errors?.username;
  const noteToAllErrors = errors?.noteToAll;

  return (
    <PageContainer>
      <PageHead
        title="Profile"
        content="Update your profile, and look at your posts."
      />
      <section className="flex flex-col items-center gap-4 bg-neutral-100 rounded-sm p-4">
        <img
          src={user.profileUrl}
          alt={`${user.username} profile image`}
          className="max-w-20 max-h-20 rounded-full"
        />
        <fetcher.Form className="flex flex-col w-full gap-4" method="POST">
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col">
            <label htmlFor="username" className="text-xs mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              defaultValue={user.username}
              className="shadow-sm rounded-sm p-3 bg-white"
            />
            <div className="mt-2 text-xs text-red-600 min-h-4">
              {usernameErrors && usernameErrors[0]}
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="noteToAll" className="text-xs mb-1">
              Note to all
            </label>
            <textarea
              id="noteToAll"
              name="noteToAll"
              rows={4}
              required
              className="w-full p-3 shadow-sm rounded-sm resize-none focus:outline-none focus:ring-2 bg-white"
              defaultValue={user.noteToAll}
            />
            <div className="mt-2 text-xs text-red-600 min-h-8">
              {noteToAllErrors && noteToAllErrors[0]}
            </div>
          </div>
          <button
            type="submit"
            name="intent"
            value="update-user"
            className="p-2 bg-black text-white rounded-sm  disabled:opacity-50 transition-colors"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </fetcher.Form>
      </section>
      <section>
        <div className="font-semibold text-xl">Your Posts</div>
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            userId={user.id}
            includeHeader={false}
          />
        ))}
      </section>
    </PageContainer>
  );
}

Profile.loader = loader;
Profile.action = action;

export default Profile;
