import { Link } from "react-router-dom";
import deliveryImage from "../assets/delivery-image.jpg";  // ✅ Import the image

export default function Home() {
  return (
    <div className="bg-green-100 min-h-screen flex flex-col items-center justify-center text-center">
      <div className="container flex flex-col md:flex-row items-center justify-between px-10 pt-32">
        {/* Left Side - Text */}
        <div className="md:w-1/2">
          <h1 className="text-5xl font-bold text-gray-800">Welcome to <span className="text-blue-600">SCRIPTSYNC</span></h1>
          <p className="text-lg text-gray-600 mt-2">Your only medicine assistant.</p>
          <div className="mt-6 flex space-x-4">
            <Link to="/signup" className="flex items-center px-6 py-3 border border-gray-500 text-gray-700 rounded-lg shadow-md text-lg hover:bg-gray-200 transition">
              Get Started
            </Link>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="md:w-1/2">
          <img src={deliveryImage} alt="Medicine Delivery" className="w-full" />  {/* ✅ Corrected */}
        </div>
      </div>
    </div>
  );
}
