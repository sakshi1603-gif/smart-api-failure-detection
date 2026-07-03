import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ApiMonitoring from "./pages/ApiMonitoring";
import ApiDetails from "./pages/ApiDetails";
import EventCenter from "./pages/EventCenter";
import AddApi from "./pages/AddApi";
import ProtectedRoute from "./components/ProtectedRoute";
import Background3D from "./components/Background3D";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <>
      <Background3D />
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute>
                <ApiMonitoring />
              </ProtectedRoute>
            }
          />

          <Route
            path="/api/:id"
            element={
              <ProtectedRoute>
                <ApiDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-api"
            element={
              <ProtectedRoute>
                <AddApi />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
