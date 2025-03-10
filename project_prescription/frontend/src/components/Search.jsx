import { useState } from "react";
import axios from "axios";

export default function Search() {
  const [query, setQuery] = useState("");
  const [medicine, setMedicine] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setErrorMessage("Please enter a medicine name.");
      return;
    }

    try {
      const response = await axios.get(`http://127.0.0.1:5000/search_medicine?query=${query}`);
      setMedicine(response.data.medicines[0]); // Take the first result
      setErrorMessage("");
    } catch (error) {
      setMedicine(null);
      if (error.response && error.response.status === 404) {
        setErrorMessage("No medicine found. Please check the name.");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Search for a Medicine</h2>

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter medicine name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 border rounded-lg w-64"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}

      {medicine && (
        <div className="mt-6 p-6 bg-white shadow-lg rounded-lg w-full max-w-lg">
          <h3 className="text-2xl font-bold text-blue-600">{medicine["Medicine Name"]}</h3>
          <p className="mt-2"><strong>Composition:</strong> {medicine.Composition}</p>
          <p className="mt-2"><strong>Uses:</strong> {medicine.Uses}</p>
          <p className="mt-2"><strong>Side Effects:</strong> {medicine.Side_effects}</p>
        </div>
      )}
    </div>
  );
}
