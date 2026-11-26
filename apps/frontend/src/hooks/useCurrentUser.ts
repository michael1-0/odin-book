import { useRouteLoaderData } from "react-router";
import { ROUTE_ID } from "../constants/routes";
import type { AuthUser } from "../services/auth";

type ProtectedRouteData = { user: AuthUser };

// The root route's loader always runs before any child route renders, so
// data for ROUTE_ID is guaranteed here. Throwing keeps the return type
// honest instead of asserting non-null at every call site.
function useCurrentUser(): AuthUser {
  const data = useRouteLoaderData<ProtectedRouteData>(ROUTE_ID);

  if (!data) {
    throw new Error("Protected route data is missing");
  }

  return data.user;
}

export default useCurrentUser;
