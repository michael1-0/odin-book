import { useState, useEffect, type ReactEventHandler } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { Link, useNavigate } from "react-router";

type NavProps = {
  isOpen: boolean;
  toggleSidebar: ReactEventHandler;
  handleLogout: ReactEventHandler;
};

function DesktopMenu({ isOpen, toggleSidebar, handleLogout }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white/75 backdrop-blur-lg">
      <Link to={"/"}>
        <Logo />
      </Link>
      <div className="hidden md:flex gap-6 items-center">
        <Link
          to="/"
          className="text-gray-600 hover:text-black transition-colors font-medium"
        >
          Home
        </Link>
        <Link
          to="/updates"
          className="text-gray-600 hover:text-black transition-colors font-medium"
        >
          Updates
        </Link>
        <Link
          to="/users"
          className="text-gray-600 hover:text-black transition-colors font-medium"
        >
          Users
        </Link>
        <Link
          to="/profile"
          className="text-gray-600 hover:text-black transition-colors font-medium"
        >
          Profile
        </Link>
        <button
          className="bg-black text-white text-sm border p-2 rounded-sm"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
      <button
        onClick={toggleSidebar}
        className="md:hidden p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-600 transition-colors"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </nav>
  );
}

function MobileMenu({ isOpen, toggleSidebar, handleLogout }: NavProps) {
  return (
    <div
      className={`fixed inset-0 z-50 h-screen w-screen backdrop-blur-xl p-4 transform-gpu transition-all duration-300 ease-out md:hidden flex flex-col ${
        isOpen
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-100 pointer-events-none"
      }`}
    >
      <div className="absolute top-4 right-4 z-50 flex justify-end items-center h-12">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-col gap-6 text-2xl font-semibold items-center justify-center flex-1 tracking-wide">
        <Link
          to="/"
          onClick={toggleSidebar}
          className="text-gray-800 hover:text-black transition-colors py-2 w-full text-center"
        >
          Home
        </Link>
        <Link
          to="/updates"
          onClick={toggleSidebar}
          className="text-gray-800 hover:text-black transition-colors py-2 w-full text-center"
        >
          Updates
        </Link>
        <Link
          to="/users"
          onClick={toggleSidebar}
          className="text-gray-800 hover:text-black transition-colors py-2 w-full text-center"
        >
          Users
        </Link>
        <Link
          to="/profile"
          onClick={toggleSidebar}
          className="text-gray-800 hover:text-black transition-colors py-2 w-full text-center"
        >
          Profile
        </Link>
        <button
          className="text-sm bg-black text-white p-2 rounded-sm"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  function toggleSidebar() {
    setIsOpen(!isOpen);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      navigate("/login");
    } catch {
      navigate("/");
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  return (
    <>
      <DesktopMenu
        handleLogout={handleLogout}
        toggleSidebar={toggleSidebar}
        isOpen={isOpen}
      />
      <MobileMenu
        handleLogout={handleLogout}
        toggleSidebar={toggleSidebar}
        isOpen={isOpen}
      />
    </>
  );
}

export default Navbar;
