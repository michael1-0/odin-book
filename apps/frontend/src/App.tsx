import { Toaster, ToastBar } from "react-hot-toast";
import { Outlet } from "react-router";
import { ScrollRestoration } from "react-router";

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
    <div className="container min-h-dvh max-w-app mx-auto font-ark">
      <ScrollRestoration />
      <Toaster
        position="top-right"
        containerStyle={{
          top: 84,
          right: "max(calc((100% - var(--container-app)) / 2), 1rem)",
        }}
        toastOptions={{
          removeDelay: 250,
          className: "app-toast",
          iconTheme: {
            primary: "black",
            secondary: "white",
          },
        }}
      >
        {(toast) => (
          <ToastBar
            toast={toast}
            style={{
              animation: toast.visible
                ? "toast-in 0.32s cubic-bezier(.21,1.02,.73,1) forwards"
                : "toast-out 0.25s cubic-bezier(.06,.71,.55,1) forwards",
            }}
          />
        )}
      </Toaster>
      <Outlet />
    </div>
  );
}

App.protectedLoader = protectedLoader;
App.guestLoader = guestLoader;

export default App;
