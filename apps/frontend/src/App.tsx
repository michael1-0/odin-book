import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router";

async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) return { isAuthenticated: false, user: null };

    const user = await response.json();
    return { isAuthenticated: true, user };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

async function protectedLoader() {
  const auth = await checkAuth();

  if (!auth.isAuthenticated) {
    throw new Response("Unauthorized", {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  return auth;
}

async function guestLoader() {
  const auth = await checkAuth();

  if (auth.isAuthenticated) {
    throw new Response("Authorized", {
      status: 302,
      headers: { Location: "/" },
    });
  }

  return null;
}

function App() {
  return (
    <div className="container min-h-dvh mx-auto font-ark">
      <Toaster
        toastOptions={{
          position: "bottom-center",
          iconTheme: {
            primary: "black",
            secondary: "white",
          },
        }}
      />
      <Outlet />
    </div>
  );
}

App.protectedLoader = protectedLoader;
App.guestLoader = guestLoader;

export default App;
