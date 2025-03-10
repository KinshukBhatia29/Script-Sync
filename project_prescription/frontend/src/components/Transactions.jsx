import { useState, useEffect } from "react";
import axios from "axios";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setErrorMessage("No authentication token found");
        return;
      }

      const response = await axios.get("http://127.0.0.1:5000/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTransactions(response.data.transactions);
    } catch (error) {
      console.error("Error fetching transactions", error);
      setErrorMessage("Failed to load transactions. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-4">Your Transactions</h2>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      {transactions.length > 0 ? (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          {transactions.map((transaction) => (
            <div key={transaction.transaction_id} className="mb-6 p-4 border border-gray-300 rounded-lg">
              <h3 className="text-lg font-bold">Transaction ID: {transaction.transaction_id}</h3>
              <p className="text-gray-600">Date: {transaction.transaction_date}</p>
              <p className="text-gray-700 font-semibold">Total: ₹{transaction.total_balance}</p>

              <table className="w-full mt-4 border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 text-left">Medicine Name</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.medicine_name}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No transactions found.</p>
      )}
    </div>
  );
}
