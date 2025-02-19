import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Navbar from "./components/Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div>
      {location.pathname === "/dashboard" && <Navbar />}
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register/>}/>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
