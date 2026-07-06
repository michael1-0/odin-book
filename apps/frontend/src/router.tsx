import { createBrowserRouter } from "react-router";
import AppLayout from "./layouts/AppLayout.tsx";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LogIn from "./pages/LogIn.tsx";
import Users from "./pages/Users.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import Profile from "./pages/Profile.tsx";

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
              {
                index: true,
                Component: Home,
                loader: Home.loader,
                action: Home.action,
              },
              {
                path: "/users",
                Component: Users,
                loader: Users.loader,
                action: Users.action,
              },
              {
                path: "/posts/:postId",
                Component: PostDetail,
                loader: PostDetail.loader,
                action: PostDetail.action,
              },
              {
                path: "/profile",
                Component: Profile,
                loader: Profile.loader,
                action: Profile.action,
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
