import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router";

function Back() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => void navigate(-1)}
      className="flex items-center gap-2 text-sm font-bold"
    >
      <Undo2 size={20} /> Back
    </button>
  );
}

export default Back;
