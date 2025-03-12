import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Navbar from "./components/Navbar";
import HotelDetail from "./pages/HotelDetail";


const Layout = ({ children, currency, setCurrency }) => {
  const location = useLocation();
  
  return (
    <div>
      {location.pathname === "/dashboard" && <Navbar setCurrency={setCurrency} currency={currency} />}
      {children}
    </div>
  );
};

function App() {
  const [currency, setCurrency] = useState("USD");

  return (
    <Router>
      <Layout currency={currency} setCurrency={setCurrency}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard currency={currency} />} />
          <Route path="/hotel/:id" element={<HotelDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
