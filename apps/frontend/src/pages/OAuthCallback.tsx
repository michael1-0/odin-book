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
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Authenticating...</p>
    </div>
  );
}

export default OAuthCallback;
