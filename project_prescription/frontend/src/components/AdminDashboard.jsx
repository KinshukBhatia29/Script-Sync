import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin_login"); // Redirect to login if no token
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Transactions Card */}
        <div
          onClick={() => navigate("/admin/transactions")}
          className="p-6 bg-white shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-xl font-bold text-blue-600">Transactions</h3>
          <p className="text-gray-600 mt-2">View all past transactions.</p>
        </div>

        {/* Inventory Card */}
        <div
          onClick={() => navigate("/admin/inventory")}
          className="p-6 bg-white shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-xl font-bold text-green-600">Inventory</h3>
          <p className="text-gray-600 mt-2">Manage medicine stock and prices.</p>
        </div>

        {/* ✅ Corrected Link for "Create Bill" */}
        <div
          onClick={() => navigate("/admin/create-bill")} // Updated correct link
          className="p-6 bg-white shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition"
        >
          <h3 className="text-xl font-bold text-red-600">Create Bill</h3>
          <p className="text-gray-600 mt-2">Generate a bill for a customer.</p>
        </div>
      </div>
    </div>
  );
}
