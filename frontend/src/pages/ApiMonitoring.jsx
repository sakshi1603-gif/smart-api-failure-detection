import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/monitoring.css";

function ApiMonitoring() {
  const [apis, setApis] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchApis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const fetchApis = async () => {
    try {
      const res = await api.get("/apis", {
        params: {
          page,
          limit,
          search,
          status,
        },
      });

      setApis(res.data.apis);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="monitoring-page">
      <h1>API Monitoring</h1>
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

          <option value="HEALTHY">Healthy</option>

          <option value="FAILED">Failed</option>

          <option value="SLOW">Slow</option>

          <option value="BLOCKED">Blocked</option>

          <option value="DEGRADED">Degraded</option>
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
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ApiMonitoring;
