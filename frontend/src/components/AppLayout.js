import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const hideNav = ["/login", "/verify"].includes(pathname);

  return (
    <div>
      {!hideNav && <Navbar />}
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
