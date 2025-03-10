import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setErrorMessage("Unauthorized access.");
        return;
      }

      const response = await axios.get("http://127.0.0.1:5000/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(response.data.transactions);
    } catch (error) {
      setErrorMessage("Failed to fetch transactions.");
    }
  };

  const fetchTransactionDetails = async (transactionId) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`http://127.0.0.1:5000/admin/transaction_details/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactionDetails(response.data.transaction_details);
      setSelectedTransaction(transactionId);
    } catch (error) {
      setTransactionDetails([]);
      setErrorMessage("Failed to fetch transaction details.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Admin Transactions</h2>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-blue-600 mb-4">All Transactions</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Transaction ID</th>
              <th className="p-2 text-left">User Name</th>
              <th className="p-2 text-left">Total Balance</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.transaction_id} className="border-b">
                <td className="p-2">{transaction.transaction_id}</td>
                <td className="p-2">{transaction.username}</td>
                <td className="p-2">₹{transaction.total_balance}</td>
                <td className="p-2">{transaction.transaction_date}</td>
                <td className="p-2">
                  <button
                    onClick={() => fetchTransactionDetails(transaction.transaction_id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-700 transition"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
        <div className="w-full max-w-5xl bg-white p-6 mt-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-green-600 mb-4">
            Transaction Details ({selectedTransaction})
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Medicine Name</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Price Per Item</th>
                <th className="p-2 text-left">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {transactionDetails.map((detail, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{detail.medicine_name}</td>
                  <td className="p-2">{detail.quantity}</td>
                  <td className="p-2">₹{detail.price_per_item}</td>
                  <td className="p-2">₹{detail.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
