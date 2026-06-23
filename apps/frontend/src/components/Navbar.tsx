import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { Link } from "react-router";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleSidebar() {
    setIsOpen(!isOpen);
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
      {/* Desktop Menu */}
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white/75 backdrop-blur-lg">
        <Logo />

        <div className="hidden md:flex gap-6 items-center">
          <Link
            to="/"
            className="text-gray-600 hover:text-black transition-colors font-medium"
          >
            Home
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
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100/80 text-gray-600 transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
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
        </div>
      </div>
    </>
  );
}

export default Navbar;
