import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout.tsx";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LogIn from "./pages/LogIn.tsx";
import Users from "./pages/Users.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import Profile from "./pages/Profile.tsx";
import UserDetail from "./pages/UserDetail.tsx";
import Updates from "./pages/Updates.tsx";

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
                path: "/updates",
                Component: Updates,
                loader: Updates.loader,
                action: Updates.action,
              },
              {
                path: "/users",
                Component: Users,
                loader: Users.loader,
                action: Users.action,
              },
              {
                path: "/users/:userId",
                Component: UserDetail,
                loader: UserDetail.loader,
                action: UserDetail.action,
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
