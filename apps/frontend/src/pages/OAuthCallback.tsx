import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/");
    } else {
      // Handle error or lack of token
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-dvh animate-pulse">
      <p>Loading...</p>
    </div>
  );
}

export default OAuthCallback;
