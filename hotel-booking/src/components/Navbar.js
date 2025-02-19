import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../utils/auth";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between p-4 bg-green-700 text-white">
      <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>Hotel Booking</h1>

      <div>
        {isLoggedIn() ? (
          <>
            <button className="px-4 py-2 bg-gray-600 rounded mr-2" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button className="px-4 py-2 bg-red-600 rounded" onClick={() => { logout(); navigate("/auth"); }}>Logout</button>
          </>
        ) : (
          <>
            <button className="px-4 py-2 bg-blue-600 rounded mr-2" onClick={() => navigate("/auth")}>Login</button>
            <button className="px-4 py-2 bg-yellow-500 rounded" onClick={() => navigate("/register")}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
