import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router";

function Back() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="px-4 mt-5 flex gap-2 font-bold items-center text-sm"
    >
      <Undo2 size={20} /> Back
    </button>
  );
}

export default Back;
