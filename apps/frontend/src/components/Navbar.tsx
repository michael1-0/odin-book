import { useState, useEffect, type ReactEventHandler } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { NavLink, useNavigate } from "react-router";
import { APP_ROUTES } from "../constants/routes";
import { logout } from "../services/auth";

type NavProps = {
  isOpen: boolean;
  toggleSidebar: ReactEventHandler;
  handleLogout: ReactEventHandler;
};

function DesktopMenu({ isOpen, toggleSidebar, handleLogout }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-white p-4">
      <NavLink to={APP_ROUTES.home}>
        <Logo />
      </NavLink>
      <div className="hidden items-center gap-6 font-semibold md:flex">
        <NavLink
          to={APP_ROUTES.home}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Home
        </NavLink>
        <NavLink
          to={APP_ROUTES.updates}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Updates
        </NavLink>
        <NavLink
          to={APP_ROUTES.users}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Users
        </NavLink>
        <NavLink
          to={APP_ROUTES.friends}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Friends
        </NavLink>
        <NavLink
          to={APP_ROUTES.profile}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Profile
        </NavLink>
        <button
          className="rounded-sm border bg-black p-2 text-sm text-white"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100/80 md:hidden"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>
    </nav>
  );
}

function MobileMenu({ isOpen, toggleSidebar, handleLogout }: NavProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-screen transform-gpu flex-col p-4 backdrop-blur-xl transition-all duration-150 ease-out md:hidden ${
        isOpen
          ? "pointer-events-auto scale-100 opacity-100"
          : "pointer-events-none scale-100 opacity-0"
      }`}
    >
      <div className="absolute top-4 right-4 z-50 flex h-12 items-center justify-end">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100/80"
        >
          <X className="size-6" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-2xl font-semibold tracking-wide">
        <NavLink
          to={APP_ROUTES.home}
          onClick={toggleSidebar}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Home
        </NavLink>
        <NavLink
          to={APP_ROUTES.updates}
          onClick={toggleSidebar}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Updates
        </NavLink>
        <NavLink
          to={APP_ROUTES.users}
          onClick={toggleSidebar}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Users
        </NavLink>
        <NavLink
          to={APP_ROUTES.friends}
          onClick={toggleSidebar}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Friends
        </NavLink>
        <NavLink
          to={APP_ROUTES.profile}
          onClick={toggleSidebar}
          className={({ isActive }) => (isActive ? "font-bold border-b-2" : "")}
        >
          Profile
        </NavLink>
        <button
          className="rounded-sm bg-black p-2 text-sm text-white"
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
      await logout();

      navigate(APP_ROUTES.login);
    } catch {
      navigate(APP_ROUTES.home);
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
