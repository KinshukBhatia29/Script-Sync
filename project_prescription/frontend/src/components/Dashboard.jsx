import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [medicineNames, setMedicineNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setErrorMessage("No authentication token found");
          return;
        }

        const response = await axios.get("http://127.0.0.1:5000/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWelcomeMessage(response.data.message);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        setErrorMessage("Failed to load dashboard data. Please try again.");
      }
    };

    fetchWelcomeMessage();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.post(
        "http://127.0.0.1:5000/upload_prescription",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setMedicineNames(response.data.medicines);
      setLoading(false);
    } catch (error) {
      console.error("Upload error", error);
      setErrorMessage("Failed to process prescription. Please try again.");
      setLoading(false);
    }
  };

  const handleAddToCart = async (medicineName) => {
    try {
      setSuccessMessage("");
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "http://127.0.0.1:5000/add_to_cart",
        { medicine_name: medicineName },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(response.data.message);
    } catch (error) {
      console.error("Add to cart error", error);
      setErrorMessage("Failed to add item to cart.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {welcomeMessage ? (
        <h2 className="text-3xl font-bold mb-4">{welcomeMessage}</h2>
      ) : (
        <h2 className="text-3xl font-bold mb-4 text-red-500">{errorMessage}</h2>
      )}
      
      <h2 className="text-3xl font-bold mb-4">Upload Prescription</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 p-2 border rounded"
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Upload & Extract"}
      </button>

      {successMessage && <p className="mt-4 text-green-500">{successMessage}</p>}
      {errorMessage && <p className="mt-4 text-red-500">{errorMessage}</p>}

      {medicineNames.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicineNames.map((medicine, index) => (
            <div key={index} className="bg-white p-4 shadow-lg rounded-lg w-72">
              <h3 className="text-lg font-bold mb-2">{medicine}</h3>
              <button
                onClick={() => handleAddToCart(medicine)}
                className="px-3 py-1 bg-green-600 text-white rounded shadow-md hover:bg-green-700 transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
