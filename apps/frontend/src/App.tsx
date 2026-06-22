import { Outlet } from "react-router";

function App() {
  return (
    <div className="container min-h-dvh mx-auto font-ark">
      <Outlet />
    </div>
  );
}

export default App;
