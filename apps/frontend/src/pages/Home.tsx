import { useLoaderData, useNavigate } from "react-router";

function Home() {
  const user = useLoaderData();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="flex flex-1 items-center min-h-dvh justify-center px-6">
      <main className="w-full max-w-2xl space-y-4 text-center">
        <h1 className="text-4xl font-bold">Ark</h1>
        <p className="text-base opacity-80">You are {user.username}</p>
        <button className="border p-2 rounded-sm" onClick={handleLogout}>
          Log out
        </button>
      </main>
    </div>
  );
}

export default Home;
