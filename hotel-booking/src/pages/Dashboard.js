import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../utils/auth";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-96 text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-6">Welcome to Your Dashboard</h1>
        <p className="text-gray-600 mb-4">You are logged in!</p>

        <button
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg transition"
          onClick={() => {
            logout();
            navigate("/auth");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
