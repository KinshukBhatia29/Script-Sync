import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

export default function CreateBill() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Search User & Fetch Transaction Details
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setErrorMessage("Unauthorized access.");
        return;
      }

      const response = await axios.get(
        `http://127.0.0.1:5000/admin/search_user?query=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUserDetails(response.data.user);
      setTransactionDetails(response.data.transactions);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("User not found or no transactions available.");
      setUserDetails(null);
      setTransactionDetails([]);
    }
  };

  // ✅ Generate & Download Bill as PDF
  const generatePDF = () => {
    if (!userDetails || transactionDetails.length === 0) {
      alert("No bill data available.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Medical Bill", 80, 15);

    doc.setFontSize(12);
    doc.text(`User: ${userDetails.username}`, 15, 30);
    doc.text(`Email: ${userDetails.email}`, 15, 40);

    let y = 50;
    doc.setFontSize(10);
    doc.text("Medicine", 15, y);
    doc.text("Quantity", 80, y);
    doc.text("Price", 120, y);
    doc.text("Total", 160, y);
    y += 10;

    let totalAmount = 0;
    transactionDetails.forEach((item) => {
      doc.text(item.medicine_name, 15, y);
      doc.text(String(item.quantity), 85, y);
      doc.text(`₹${item.price}`, 120, y);
      doc.text(`₹${item.total_price}`, 160, y);
      totalAmount += item.total_price;
      y += 8;
    });

    y += 10;
    doc.text(`Grand Total: ₹${totalAmount}`, 140, y);
    doc.save(`Bill_${userDetails.username}.pdf`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Generate Bill</h2>

      {/* 🔎 Search User Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter user name or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-lg w-72 text-center"
        />
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {/* 🚨 Error Message */}
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      {/* ✅ Display User & Transactions */}
      {userDetails && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-blue-600">User: {userDetails.username}</h3>
          <p className="text-gray-700">Email: {userDetails.email}</p>

          {/* 📋 Transaction Table */}
          <table className="w-full mt-4 border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Medicine</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactionDetails.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.medicine_name}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">₹{item.price}</td>
                  <td className="p-2">₹{item.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🧾 Total Amount */}
          <div className="mt-6 text-xl font-bold text-right">
            Grand Total: <span className="text-green-600">₹{transactionDetails.reduce((sum, item) => sum + item.total_price, 0)}</span>
          </div>

          {/* 🖨️ Generate PDF Button */}
          <button
            onClick={generatePDF}
            className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition"
          >
            Download Bill
          </button>
        </div>
      )}
    </div>
  );
}
