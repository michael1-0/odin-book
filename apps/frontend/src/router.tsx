import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout.tsx";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import ErrorBoundary from "./pages/ErrorBoundary.tsx";
import LogIn from "./pages/LogIn.tsx";
import Users from "./pages/Users.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import Profile from "./pages/Profile.tsx";
import UserDetail from "./pages/UserDetail.tsx";
import Updates from "./pages/Updates.tsx";
import Friends from "./pages/Friends.tsx";
import { APP_ROUTES, ROUTE_ID, ROUTE_PATTERNS } from "./constants/routes";

const router = createBrowserRouter([
  {
    path: APP_ROUTES.home,
    Component: App,
    errorElement: <ErrorBoundary />,
    children: [
      {
        id: ROUTE_ID,
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
                path: APP_ROUTES.updates,
                Component: Updates,
                loader: Updates.loader,
                action: Updates.action,
              },
              {
                path: APP_ROUTES.users,
                Component: Users,
                loader: Users.loader,
                action: Users.action,
              },
              {
                path: APP_ROUTES.friends,
                Component: Friends,
                loader: Friends.loader,
                action: Friends.action,
              },
              {
                path: ROUTE_PATTERNS.userDetail,
                Component: UserDetail,
                loader: UserDetail.loader,
                action: UserDetail.action,
              },
              {
                path: ROUTE_PATTERNS.postDetail,
                Component: PostDetail,
                loader: PostDetail.loader,
                action: PostDetail.action,
              },
              {
                path: APP_ROUTES.profile,
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
        children: [{ path: APP_ROUTES.login, Component: LogIn }],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default router;
