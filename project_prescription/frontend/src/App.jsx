import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Cart from "./components/Cart";
import Transactions from "./components/Transactions"; 
import Navbar from "./components/Navbar";
import Search from "./components/Search"; 
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminTransactions from "./components/AdminTransactions";
import AdminInventory from "./components/AdminInventory";
import CreateBill from "./components/CreateBill"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/transactions" element={<Transactions />} /> 
        <Route path="/search" element={<Search />} />
        <Route path="/admin_login" element={<AdminLogin />} />
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/create-bill" element={<CreateBill />} /> 
      </Routes>
    </Router>
  );
}

export default App;
