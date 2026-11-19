import { Link } from "react-router";
import Logo from "../components/Logo";

function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center">
      <Logo isBig={true} />
      <div className="my-8 min-w-full text-center">Page Not Found</div>
      <Link to={"/"} className="font-bold underline">
        Go back home
      </Link>
    </div>
  );
}

export default NotFound;
