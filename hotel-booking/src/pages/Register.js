import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const Register = () => {
  const [user, setUser] = useState({ full_name: "", email: "", password: "" });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("http://localhost:5000/register", user);
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      alert("Registration failed");
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
        <h1 className="text-3xl font-bold text-green-800 mb-6">Create an Account</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name" 
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
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
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
          <button
            type="submit" 
            className="w-full px-6 py-3 bg-green-700 text-white rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg transition"
          >
            Register
          </button>
        </form>

        <p className="text-gray-600 mt-4 text-sm">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/auth")}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
