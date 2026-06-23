import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ApiMonitoring from "./pages/ApiMonitoring";
import ApiDetails from "./pages/ApiDetails";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>
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
  );
}

export default App;