import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../utils/auth";
import { useState } from "react";

const Navbar = ({ setCurrency, currency }) => {
  const navigate = useNavigate();

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
  };
  return (
    <nav className="flex justify-between items-center p-4 bg-green-700 text-white">
      <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>
        ReserVRoom
      </h1>

      <div>
      <select
        value={currency}
        onChange={handleCurrencyChange}
        className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 bg-white text-black w-15 appearance-none"
      >
        <option value="USD">USD ($)</option>
        <option value="HUF">HUF (Ft)</option>
        <option value="LEI">LEI (RON)</option>
      </select>
        {isLoggedIn() ? (
          <>
            
            <button
              className="px-2 py-1 bg-red-600 text-white rounded-lg w-18 text-sm"
              onClick={() => {
                logout();
                navigate("/auth");  
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="px-4 py-2 bg-blue-600 rounded mr-2" onClick={() => navigate("/auth")}>
              Login
            </button>
            <button className="px-4 py-2 bg-yellow-500 rounded" onClick={() => navigate("/register")}>
              Register
            </button>
          </>
        )}
        
      </div>

      


    </nav>
  );
};

export default Navbar;
