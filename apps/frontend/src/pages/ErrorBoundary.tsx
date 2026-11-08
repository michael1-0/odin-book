import {
  Link,
  Navigate,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import Logo from "../components/Logo";
import { APP_ROUTES } from "../constants/routes";

function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 401) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  let title = "Something went wrong";
  let message: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || "Error"}`.trim();
    message = typeof error.data === "string" ? error.data : undefined;
  }

  return (
    <div className="font-ark flex items-center w-full flex-col justify-center min-h-dvh">
      <Logo isBig={true} />
      <div className="min-w-full text-lg text-center my-8">
        <div>{title}</div>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </div>
      <Link to={APP_ROUTES.home} className="underline font-bold">
        Go back home
      </Link>
    </div>
  );
}

export default ErrorBoundary;
