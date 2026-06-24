import { createBrowserRouter } from "react-router";

import AppLayout from "./layouts/AppLayout.tsx";

import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LogIn from "./pages/LogIn.tsx";

import { guestLoader, protectedLoader } from "./loaders/authLoader.ts";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        id: "user-data",
        loader: protectedLoader,
        children: [
          {
            Component: AppLayout,
            children: [{ index: true, Component: Home }],
          },
        ],
      },
      {
        loader: guestLoader,
        children: [{ path: "/login", Component: LogIn }],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default router;
