import { Outlet } from "react-router";
import Navbar from "./Navbar";

function AppLayout() {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}

export default AppLayout;
