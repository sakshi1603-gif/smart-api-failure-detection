import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ApiMonitoring from "./pages/ApiMonitoring";
import ApiDetails from "./pages/ApiDetails";
import EventCenter from "./pages/EventCenter";
import AddApi from "./pages/AddApi";

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
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<ApiMonitoring />} />
          <Route path="/api/:id" element={<ApiDetails />} />
          <Route path="/events" element={<EventCenter />} />
          <Route path="/add-api" element={<AddApi />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
