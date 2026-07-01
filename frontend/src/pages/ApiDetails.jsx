import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import "../styles/details.css";

function ApiDetails() {
  const { id } = useParams();

  const [apiData, setApiData] = useState(null);
  const [history, setHistory] = useState([]);
  const [retryData, setRetryData] = useState(null);
  const [degradation, setDegradation] = useState(null);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAllData = async () => {
    try {
      const [apiRes, historyRes, retryRes, degradationRes] = await Promise.all([
        api.get(`/${id}`),
        api.get(`/${id}/history`),
        api.get(`/${id}/retry-history`),
        api.get(`/${id}/degradation`),
      ]);

      setApiData(apiRes.data);
      setHistory(historyRes.data.history);
      setRetryData(retryRes.data);
      setDegradation(degradationRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!apiData) {
    return <h2 className="loading-state">Loading...</h2>;
  }

  return (
    <div className="details-container">
      <h1>API Details</h1>

      <div className="info-card">
        <h2>{apiData.name}</h2>

        <p>
          <strong>URL:</strong> {apiData.url}
        </p>

        <p>
          <strong>Method:</strong> {apiData.method}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          <span className={`status ${apiData.currentHealthStatus}`}>
            {apiData.currentHealthStatus}
          </span>
        </p>

        <p>
          <strong>SLA:</strong> {apiData.slaLatency} ms
        </p>

        <p>
          <strong>Active:</strong> {apiData.isActive ? "Yes" : "No"}
        </p>

        <p>
          <strong>Degradation Reason:</strong>{" "}
          {apiData.degradationReason || "None"}
        </p>
      </div>

      <h2 className="section-title">Health History</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Response Time</th>
              <th>Failure Type</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {history.slice(0, 10).map((item) => (
              <tr key={item._id}>
                <td>{item.healthStatus}</td>
                <td>{item.responseTime}</td>
                <td>{item.failureType}</td>
                <td>{new Date(item.checkedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Retry Statistics</h2>

      {retryData && (
        <div className="info-card stats-grid">
          <div className="stat">
            <span className="stat-label">Total Retries</span>
            <span className="stat-value">
              {retryData.retryStats.totalRetries}
            </span>
          </div>

          <div className="stat">
            <span className="stat-label">Successful Retries</span>
            <span className="stat-value">
              {retryData.retryStats.successfulRetries}
            </span>
          </div>

          <div className="stat">
            <span className="stat-label">Failed Retries</span>
            <span className="stat-value">
              {retryData.retryStats.failedRetries}
            </span>
          </div>

          <div className="stat">
            <span className="stat-label">Recovery Rate</span>
            <span className="stat-value">
              {retryData.retryStats.recoveryRate}
            </span>
          </div>
        </div>
      )}

      <h2 className="section-title">Retry History</h2>

      <div className="retry-list">
        {retryData?.retryDetails?.map((retry, index) => (
          <div className="retry-row" key={index}>
            <p>
              Retry #{retry.retryAttempt}
              {" | "}
              {retry.healthStatus}
              {" | "}
              {retry.responseTime}
            </p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Degradation Analysis</h2>

      {degradation && (
        <div className="info-card">
          <p>
            <strong>Degraded:</strong> {degradation.isDegraded ? "Yes" : "No"}
          </p>

          <p>
            <strong>Severity:</strong> {degradation.severity}
          </p>

          <p>
            <strong>Reason:</strong> {degradation.reason}
          </p>

          <p>
            <strong>Logs Analyzed:</strong> {degradation.logsAnalyzed}
          </p>
        </div>
      )}
    </div>
  );
}

export default ApiDetails; //ApiDetails.jsx
