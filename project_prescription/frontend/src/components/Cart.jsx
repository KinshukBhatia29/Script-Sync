import { useState, useEffect } from "react";
import axios from "axios";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setErrorMessage("No authentication token found");
        return;
      }

      const response = await axios.get("http://127.0.0.1:5000/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCartItems(response.data.cart_items);
    } catch (error) {
      console.error("Error fetching cart items", error);
      setErrorMessage("Failed to load cart items. Please try again.");
    }
  };

  const handleQuantityChange = async (cartId, newQuantity, maxQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxQuantity) {
      alert(`You cannot exceed available stock (${maxQuantity} pieces).`);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        "http://127.0.0.1:5000/update_cart_quantity",
        { cart_id: cartId, quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartId ? { ...item, quantity: newQuantity, total_price: newQuantity * item.price } : item
        )
      );
    } catch (error) {
      console.error("Failed to update cart quantity", error);
      setErrorMessage("Error updating quantity. Please try again.");
    }
  };

  const handleBuy = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:5000/buy",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(`Purchase Successful! Transaction ID: ${response.data.transaction_id} | Total: ₹${response.data.total_balance}`);
      setCartItems([]); // Clear cart in UI after successful purchase

    } catch (error) {
      console.error("Failed to complete purchase", error);
      setErrorMessage(error.response?.data?.message || "Purchase failed. Please try again.");
    }
  };

  // Calculate total balance
  const totalBalance = cartItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-4">Your Cart</h2>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      {cartItems.length > 0 ? (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Medicine Name</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.medicine_name}</td>
                  <td className="p-2">₹{item.price}</td>
                  <td className="p-2 flex items-center">
                    <input
                      type="range"
                      min="1"
                      max={item.pieces}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.pieces)}
                      className="mx-2 w-24"
                    />
                    <span className="px-2">{item.quantity}</span>
                  </td>
                  <td className="p-2">₹{item.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Balance Section */}
          <div className="mt-6 text-xl font-bold text-right">
            Total Balance: <span className="text-green-600">₹{totalBalance}</span>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            className="mt-4 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Buy Now
          </button>
        </div>
      ) : (
        <p className="text-gray-600">Your cart is empty.</p>
      )}
    </div>
  );
}
