import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, [page]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setErrorMessage("Unauthorized access.");
        return;
      }

      const response = await axios.get(`http://127.0.0.1:5000/admin/inventory?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInventory(response.data.medicines);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      setErrorMessage("Failed to fetch inventory.");
    }
  };

  const updatePieces = async (inventoryId, newPieces) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(
        "http://127.0.0.1:5000/admin/update_inventory",
        { inventory_id: inventoryId, pieces: newPieces },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update UI after successful update
      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.id === inventoryId ? { ...item, pieces: newPieces } : item
        )
      );
    } catch (error) {
      setErrorMessage("Failed to update stock.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Admin Inventory</h2>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-blue-600 mb-4">All Medicines (Page {page} of {totalPages})</h3>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Medicine Name</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Available Pieces</th>
              <th className="p-2 text-left">Update Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.name}</td>
                <td className="p-2">₹{item.price}</td>
                <td className="p-2">{item.pieces}</td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={item.pieces}
                    onChange={(e) => updatePieces(item.id, parseInt(e.target.value))}
                    className="p-2 border rounded-lg w-20 text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-4 py-2 rounded-lg shadow-md transition ${
              page === 1 ? "bg-gray-400 text-white" : "bg-blue-500 text-white hover:bg-blue-700"
            }`}
          >
            Previous
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-4 py-2 rounded-lg shadow-md transition ${
              page === totalPages ? "bg-gray-400 text-white" : "bg-blue-500 text-white hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
