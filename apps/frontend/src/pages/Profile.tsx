import {
  useFetcher,
  useLoaderData,
  useRouteLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { deletePost, getCurrentUserPosts, loadPosts } from "../services/posts";
import {
  UserUpdateBodySchema,
  z,
  type PostsGetResponse,
} from "@repo/zod-validations";
import PostItem from "../components/PostItem";
import { likePost, unlikePost } from "../services/likes";
import { updateUser } from "../services/users";
import toast from "react-hot-toast";
import { LucideTrash2 } from "lucide-react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
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

      return await updateUser(formData);
    }
    case "like-post":
      return await likePost(formData);
    case "unlike-post":
      return await unlikePost(formData);
    case "delete-post":
      return await deletePost(formData);
    default:
      throw new Response("Unknown intent", { status: 400 });
  }
}

function Profile() {
  const { user } = useRouteLoaderData("user-data");
  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const initialPage = useLoaderData() as PostsGetResponse;
  const profileUrlRef = useRef<string | null>(user.profileUrl);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(user.profileUrl);
  const [pages, setPages] = useState<PostsGetResponse[]>(() => [initialPage]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [postToDeleteId, setPostToDeleteId] = useState<number | null>(null);
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const profileObjectUrlRef = useRef<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const posts = pages.flatMap((page) => page.data);
  const nextCursor = pages[pages.length - 1]?.nextCursor ?? null;

  const isUpdating = fetcher.state === "submitting";
  const hasError = fetcher.data?.error;

  function handleProfilePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    profileObjectUrlRef.current = objectUrl;
    setProfilePreviewUrl(objectUrl);
  }

  // Toasts
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (hasError) {
        if (!fetcher.data.errors && profileObjectUrlRef.current) {
          URL.revokeObjectURL(profileObjectUrlRef.current);
          profileObjectUrlRef.current = null;
          setProfilePreviewUrl(profileUrlRef.current);
          if (profilePictureInputRef.current) {
            profilePictureInputRef.current.value = "";
          }
        }
        toast.error(fetcher.data.message ?? "Failed to update profile");
      } else {
        if (fetcher.data.profileUrl) {
          profileUrlRef.current = fetcher.data.profileUrl;
          setProfilePreviewUrl(fetcher.data.profileUrl);
          if (profileObjectUrlRef.current) {
            URL.revokeObjectURL(profileObjectUrlRef.current);
            profileObjectUrlRef.current = null;
          }
          if (profilePictureInputRef.current) {
            profilePictureInputRef.current.value = "";
          }
        }
        toast.success("Profile updated");
      }
    }
  }, [fetcher.data, fetcher.state, hasError]);

  useEffect(() => {
    return () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
      }
    };
  }, []);

  // Post deletion
  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteFetcher.data) {
      if (deleteFetcher.data.error) {
        toast.error(deleteFetcher.data.message ?? "Failed to delete post");
      } else if (deleteFetcher.data.id) {
        const deletedPostId = deleteFetcher.data.id;
        setPages((currentPages) =>
          currentPages.map((page) => ({
            ...page,
            data: page.data.filter((post) => post.id !== deletedPostId),
          })),
        );
        toast.success("Post deleted");
      }
    }
  }, [deleteFetcher.data, deleteFetcher.state]);

  // Cursor pagination
  const loadNextPage = useCallback(
    async (force = false) => {
      if (nextCursor === null || isLoadingMore || (loadError && !force)) {
        return;
      }

      setIsLoadingMore(true);

      try {
        const page = await loadPosts({ cursor: nextCursor, scope: "me" });
        setPages((currentPages) => [...currentPages, page]);
        setLoadError(null);
      } catch {
        setLoadError("Couldn't load more posts.");
        toast.error("Failed to load more posts");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [loadError, nextCursor, isLoadingMore],
  );
  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || nextCursor === null || isLoadingMore || loadError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        void loadNextPage();
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadNextPage, nextCursor, isLoadingMore, loadError]);

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
        <fetcher.Form
          className="flex flex-col w-full gap-4"
          method="POST"
          encType="multipart/form-data"
        >
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col items-center gap-2">
            <img
              src={profilePreviewUrl}
              alt={`${user.username} profile image`}
              className="h-24 w-24 rounded-full object-cover"
            />
            <label
              htmlFor="profilePicture"
              className="cursor-pointer text-sm font-semibold underline underline-offset-4 transition-colors hover:text-neutral-500"
            >
              Change picture
            </label>
            <input
              type="file"
              name="profilePicture"
              id="profilePicture"
              ref={profilePictureInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePictureChange}
              className="sr-only"
            />
          </div>
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
            deleteButton={
              <button
                type="button"
                disabled={deleteFetcher.state !== "idle"}
                onClick={(event) => {
                  event.stopPropagation();
                  setPostToDeleteId(post.id);
                }}
                aria-label="Delete post"
                className=" disabled:opacity-50"
              >
                <LucideTrash2 size={16} />
              </button>
            }
          />
        ))}
      </section>
      {postToDeleteId !== null && (
        <ConfirmDeleteModal
          onCancel={() => setPostToDeleteId(null)}
          onConfirm={() => {
            const postId = postToDeleteId;
            setPostToDeleteId(null);
            void deleteFetcher.submit(
              { intent: "delete-post", postId: String(postId) },
              { method: "POST" },
            );
          }}
        />
      )}
      <section
        ref={loadMoreRef}
        className="flex w-full items-center justify-center text-sm text-neutral-500"
      >
        {loadError ? (
          <button
            type="button"
            onClick={() => void loadNextPage(true)}
            className="rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200"
          >
            Retry loading more
          </button>
        ) : isLoadingMore ? (
          "Loading more posts..."
        ) : (
          nextCursor && "Scroll to load more"
        )}
      </section>
    </PageContainer>
  );
}

Profile.loader = loader;
Profile.action = action;

export default Profile;
