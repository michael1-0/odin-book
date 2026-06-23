import { createBrowserRouter } from "react-router";

import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LogIn from "./pages/LogIn.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";
import { GuestRoute, ProtectedRoute } from "./components/AuthRoutes.tsx";
import AppLayout from "./layouts/AppLayout.tsx";

async function homeLoader() {
  const token = localStorage.getItem("token");
  return fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AppLayout, children: [
              { index: true, Component: Home, loader: homeLoader },
              
            ]
          },
        ],
      },
      {
        Component: GuestRoute,
        children: [
          { path: "/login", Component: LogIn },
          { path: "/auth/callback", Component: OAuthCallback },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default router;
