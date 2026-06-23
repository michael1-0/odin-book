import { Link } from "react-router";
import Logo from "../components/Logo";

function NotFound() {
  return (
    <div className="flex items-center w-full flex-col justify-center min-h-dvh">
      <Logo isBig={true}/>
      <div className="min-w-full text-center my-8">
        Page Not Found
      </div>
      <Link to={"/"} className="underline font-bold">
        Go back home
      </Link>
    </div>
  );
}

export default NotFound;
