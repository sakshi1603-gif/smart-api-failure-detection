import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ApiMonitoring from "./pages/ApiMonitoring";
import ApiDetails from "./pages/ApiDetails";

import { AuthProvider } from "./context/AuthContext";
import Background3D from "./components/Background3D";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <AuthProvider>
      <Background3D />
    <BrowserRouter>

      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/monitoring"
          element={<ApiMonitoring />}
        />

        <Route
          path="/api/:id"
          element={<ApiDetails />}
        />
      </Routes>

    </BrowserRouter>
    
    </AuthProvider>
    
  );
}

export default App;