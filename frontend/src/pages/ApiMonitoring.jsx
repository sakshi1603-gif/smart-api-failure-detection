import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/monitoring.css";

function ApiMonitoring() {
  const [apis, setApis] = useState([]);

  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    try {
      const res = await api.get("/");
      setApis(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container">
      <h1>API Monitoring</h1>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Method</th>
            <th>Status</th>
            <th>SLA</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {apis.map((apiItem) => (
            <tr key={apiItem._id}>
              <td>{apiItem.name}</td>

              <td>{apiItem.method}</td>

              <td>
                <span
                  className={`status ${apiItem.currentHealthStatus}`}
                >
                  {apiItem.currentHealthStatus}
                </span>
              </td>

              <td>{apiItem.slaLatency} ms</td>

              <td>
                <Link to={`/api/${apiItem._id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ApiMonitoring;