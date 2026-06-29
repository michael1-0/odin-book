import { createBrowserRouter } from "react-router";
import AppLayout from "./layouts/AppLayout.tsx";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LogIn from "./pages/LogIn.tsx";
import Users from "./pages/Users.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        id: "user-data",
        loader: App.protectedLoader,
        children: [
          {
            Component: AppLayout,
            children: [
              { index: true, Component: Home },
              {
                path: "/users",
                Component: Users,
                loader: Users.loader,
                action: Users.action,
              },
            ],
          },
        ],
      },
      {
        loader: App.guestLoader,
        children: [{ path: "/login", Component: LogIn }],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default router;
