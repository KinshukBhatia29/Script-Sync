import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admin to dashboard if already logged in
    const token = localStorage.getItem("admin_token");
    if (token) {
      navigate("/admin_dashboard");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/admin_login", {
        email,
        password,
      });

      // Store the admin token
      localStorage.setItem("admin_token", response.data.access_token);

      // Dispatch events so Navbar (and other components) can update links without refresh
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("authChange"));

      setErrorMessage("");
      navigate("/admin_dashboard"); // Redirect to admin dashboard after login
    } catch (error) {
      setErrorMessage("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Admin Login</h2>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <input
          type="email"
          placeholder="Enter admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded-lg"
        />
        <button
          onClick={handleLogin}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Login
        </button>
        {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
      </div>
    </div>
  );
}
