import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1774&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
      <div className="bg-white bg-opacity-20 backdrop-blur-md shadow-lg rounded-xl p-10 text-center">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">Welcome to ReserVRoom</h1>
        <p className="text-lg text-gray-200 mt-4">Find and book the best hotels with ease.</p>
        <button
          className="mt-6 px-8 py-4 bg-yellow-700 text-white font-bold text-lg rounded-lg shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105"
          onClick={() => navigate("/auth")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
