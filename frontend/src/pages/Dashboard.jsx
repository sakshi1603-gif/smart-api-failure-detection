import { useState } from "react";
import api from "../api/api";
import usePolling from "../hooks/usePolling";
import "../styles/dashboard.css";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [apis, setApis] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const { user } = useAuth();

  usePolling(
    async () => {
      try {
        const res = await api.get("/apis", { params: { limit: 50 } });
        setApis(res.data.apis);
        setTotal(res.data.totalApis);
        setError("");
      } catch (err) {
        setError("Couldn't refresh. Retrying…");
      }
    },
    [],
    15000,
  );

  const count = (status) =>
    apis.filter((a) => a.currentHealthStatus === status).length;

  return (
    <div className="dashboard-page">
      {user?.email === "demo@smartapi.com" && (
        <div className="demo-banner">
          🚀 <strong>Demo Mode</strong>— You're exploring a pre-configured
          workspace. Browse the dashboard, monitoring, analytics, and event
          history without creating your own APIs.
        </div>
      )}

      <div className="dashboard-header">
        <h1>API Health Dashboard</h1>
        {error && <p className="event-state error">{error}</p>}
      </div>

      <div className="dashboard-cards">
        <div className="card">
          <h3>Total APIs</h3>
          <p>{total}</p>
        </div>
        <div className="card healthy">
          <h3>Healthy</h3>
          <p>{count("HEALTHY")}</p>
        </div>
        <div className="card degraded">
          <h3>Degraded</h3>
          <p>{count("DEGRADED")}</p>
        </div>
        <div className="card failed">
          <h3>Failed</h3>
          <p>{count("FAILED")}</p>
        </div>
        <div className="card blocked">
          <h3>Blocked</h3>
          <p>{count("BLOCKED")}</p>
        </div>
        <div className="card pending">
          <h3>Pending</h3>
          <p>{count("PENDING")}</p>
        </div>
      </div>

      <h2>Recent APIs</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Method</th>
              <th>Status</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {apis.slice(0, 5).map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.method}</td>
                <td>
                  <span
                    className={`status-badge ${item.currentHealthStatus.toLowerCase()}`}
                  >
                    {item.currentHealthStatus}
                  </span>
                </td>
                <td>{item.slaLatency} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;