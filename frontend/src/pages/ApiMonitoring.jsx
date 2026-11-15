import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import usePolling from "../hooks/usePolling";
import { useAuth } from "../context/AuthContext";
import "../styles/monitoring.css";

function ApiMonitoring() {
  const [apis, setApis] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");

  const { user } = useAuth();
  const isDemo = user?.email === "demo@smartapi.com";

  const fetchApis = async () => {
    try {
      const res = await api.get("/apis", {
        params: { page, limit, search, status },
      });

      setApis(res.data.apis);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
    }
  };

  usePolling(fetchApis, [page, search, status], 15000);

  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Delete "${item.name}"? Its history and events will be removed too.`,
    );
    if (!ok) return;

    try {
      await api.delete(`/apis/${item._id}`);
      setMessage(`Deleted "${item.name}".`);

      // If that was the last row on this page, go back one page
      if (apis.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchApis();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Couldn't delete this API.");
    }
  };

  return (
    <div className="monitoring-page">
      <h1>API Monitoring</h1>

      {message && <p className="monitoring-message">{message}</p>}

      <div className="monitoring-toolbar">
        <input
          type="text"
          placeholder="Search API..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="HEALTHY">Healthy</option>
          <option value="DEGRADED">Degraded</option>
          <option value="FAILED">Failed</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <div className="table-wrapper">
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
                  <span className={`status ${apiItem.currentHealthStatus}`}>
                    {apiItem.currentHealthStatus}
                  </span>
                </td>
                <td>{apiItem.slaLatency} ms</td>
                <td>
                  <Link to={`/api/${apiItem._id}`} className="view-link">
                    View
                  </Link>
                  {!isDemo && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(apiItem)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>

        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ApiMonitoring;