import { useRouteLoaderData } from "react-router";

function Home() {
  const user = useRouteLoaderData("user-data").user;

  return (
    <div className="flex flex-1 items-center justify-center px-6 mt-20">
      <main className="w-full max-w-2xl space-y-4 text-center">
        <div className="flex flex-col gap-4 items-center">
          <img
            src={user.profileUrl}
            alt="user profile image"
            className="rounded-full max-h-20 max-w-20"
          />
          <p className="text-base opacity-80">
            Hello, {user.username}, what would you like to post today?
          </p>
        </div>
      </main>
    </div>
  );
}

export default Home;
