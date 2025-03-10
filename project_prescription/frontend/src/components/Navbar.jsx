import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Check tokens in localStorage
  const checkAuth = () => {
    const userToken = localStorage.getItem("access_token");
    const adminToken = localStorage.getItem("admin_token");

    setIsAuthenticated(!!userToken || !!adminToken);
    setIsAdmin(!!adminToken);
  };

  useEffect(() => {
    // Check immediately on mount
    checkAuth();

    // Handler to update auth state
    const handleAuthChange = () => {
      checkAuth();
    };

    // Listen for both "storage" (for other tabs) and custom "authChange" events
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = isAdmin
        ? localStorage.getItem("admin_token")
        : localStorage.getItem("access_token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      if (isAdmin) {
        // Admin Logout
        await axios.post("http://127.0.0.1:5000/admin_logout", {}, { headers });
        localStorage.removeItem("admin_token");
      } else {
        // User Logout
        await axios.get("http://127.0.0.1:5000/logout", { headers });
        localStorage.removeItem("access_token");
      }

      // Dispatch events so Navbar (and other components) update
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("authChange"));

      setIsAuthenticated(false);
      setIsAdmin(false);
      navigate(isAdmin ? "/admin_login" : "/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="flex justify-between items-center px-10 py-4 bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <h1 className="text-2xl font-bold text-orange-500">SCRIPTSYNC</h1>

      <ul className="flex space-x-6 text-gray-700 font-semibold">
        <li><Link to="/">Home</Link></li>

        {/* User Links */}
        {isAuthenticated && !isAdmin && (
          <>
            <li>
              <Link to="/search" className="text-blue-500 hover:underline">
                Search Medicines
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-blue-500 hover:underline">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/transactions" className="text-blue-500 hover:underline">
                Transactions
              </Link>
            </li>
          </>
        )}

        {/* Admin Links */}
        {isAuthenticated && isAdmin && (
          <>
            <li>
              <Link to="/admin/transactions" className="text-blue-500 hover:underline">
                Transactions
              </Link>
            </li>
            <li>
              <Link to="/admin/inventory" className="text-blue-500 hover:underline">
                Inventory
              </Link>
            </li>
            <li>
              <Link to="/admin/create_bill" className="text-blue-500 hover:underline">
                Create Bill
              </Link>
            </li>
          </>
        )}
      </ul>
      
      <div className="flex space-x-4">
        {isAuthenticated ? (
          <>
            <Link
              to={isAdmin ? "/admin_dashboard" : "/dashboard"}
              className="px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition"
            >
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition"
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
