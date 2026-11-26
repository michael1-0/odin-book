import { useRouteLoaderData } from "react-router";
import type { ProtectedRouteData } from "../App";
import { ROUTE_ID } from "../constants/routes";

// The root route's loader always runs before any child route renders, so
// data for ROUTE_ID is guaranteed here. Throwing keeps the return type
// honest instead of asserting non-null at every call site.
function useCurrentUser(): ProtectedRouteData["user"] {
  const data = useRouteLoaderData<ProtectedRouteData>(ROUTE_ID);

  if (!data) {
    throw new Error("Protected route data is missing");
  }

  return data.user;
}

export default useCurrentUser;
