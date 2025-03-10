import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/signup", formData);
      alert("Signup successful! Please login.");
      navigate("/login");
    } catch (error) {
      alert("Signup failed: " + error.response.data.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-3xl font-bold text-center mb-4">Signup</h2>
        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Username" className="w-full p-3 border rounded mb-3" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" className="w-full p-3 border rounded mb-3" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" className="w-full p-3 border rounded mb-3" onChange={handleChange} required />
          <button className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600">Signup</button>
        </form>
      </div>
    </div>
  );
}
