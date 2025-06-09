import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const Auth = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("https://backend-519v.onrender.com/login", credentials);
      localStorage.setItem("token", res.data.token);

      localStorage.setItem("user", JSON.stringify({
        id: res.data.id,
        full_name: res.data.full_name,
        email: res.data.email,
        created_at: res.data.created_at
      }));

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };
  

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1588151146398-00962e986475?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="bg-white p-8 rounded-xl shadow-xl w-96 text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-6">Login</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password" 
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-700 text-white rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg transition"
          >
            Login
          </button>
        </form>

        <p className="text-gray-600 mt-4 text-sm">
          Don't have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Sign up here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
