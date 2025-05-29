import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../utils/auth";
import { useState, useRef } from "react";

const Navbar = ({ setCurrency, currency }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-green-700 text-white relative">
      <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>
        ReserVRoom
      </h1>

      <div className="flex items-center space-x-4">
        <select
          value={currency}
          onChange={handleCurrencyChange}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 bg-white text-black w-20"
        >
          <option value="EUR">EUR (€)</option>
          <option value="HUF">HUF (Ft)</option>
          <option value="LEI">LEI (RON)</option>
        </select>

        {isLoggedIn() ? (
          <div className="relative">
            <button onClick={toggleDropdown} className="w-8 h-8">
            <img
              src="/profile-icon.png"
              alt="Profile"
              className="w-8 h-8 object-contain"
            />
          </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    
                    navigate("/profile");
                  }}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                    navigate("/auth");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
