import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/dashboard.css";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const [apis, setApis] = useState([]);
  const { user } = useAuth();
  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    const res = await api.get("/apis");
    setApis(res.data.apis);
  };

  const totalApis = apis.length;
  const healthyApis = apis.filter(
    (a) => a.currentHealthStatus === "HEALTHY",
  ).length;
  const failedApis = apis.filter(
    (a) => a.currentHealthStatus === "FAILED",
  ).length;
  const blockedApis = apis.filter(
    (a) => a.currentHealthStatus === "BLOCKED",
  ).length;

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
      </div>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Total APIs</h3>
          <p>{totalApis}</p>
        </div>
        <div className="card healthy">
          <h3>Healthy APIs</h3>
          <p>{healthyApis}</p>
        </div>
        <div className="card failed">
          <h3>Failed APIs</h3>
          <p>{failedApis}</p>
        </div>
        <div className="card blocked">
          <h3>Blocked APIs</h3>
          <p>{blockedApis}</p>
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
            {apis.map((api) => (
              <tr key={api._id}>
                <td>{api.name}</td>
                <td>{api.method}</td>
                <td>
                  <span
                    className={`status-badge ${api.currentHealthStatus.toLowerCase()}`}
                  >
                    {api.currentHealthStatus}
                  </span>
                </td>
                <td>{api.slaLatency} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
