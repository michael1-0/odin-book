import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

function AppLayout() {
  return (
    <div>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default AppLayout;
