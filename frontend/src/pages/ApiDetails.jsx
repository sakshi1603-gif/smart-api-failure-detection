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
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        apiRes,
        historyRes,
        retryRes,
        degradationRes,
      ] = await Promise.all([
        api.get(`/${id}`),
        api.get(`/${id}/history`),
        api.get(`/${id}/retry-history`),
        api.get(`/${id}/degradation`)
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
    return <h2>Loading...</h2>;
  }

  return (
    <div className="details-container">
      <h1>API Details</h1>

      <hr />

      <div className="info-card">
  <h2>{apiData.name}</h2>

  <p>
    <strong>URL:</strong> {apiData.url}
  </p>

  <p>
    <strong>Method:</strong> {apiData.method}
  </p>

  <p>
    <strong>Status:</strong>

    <span
      className={`status ${apiData.currentHealthStatus}`}
    >
      {apiData.currentHealthStatus}
    </span>
  </p>

  <p>
    <strong>SLA:</strong> {apiData.slaLatency} ms
  </p>

  <p>
    <strong>Active:</strong>{" "}
    {apiData.isActive ? "Yes" : "No"}
  </p>

  <p>
    <strong>Degradation Reason:</strong>{" "}
    {apiData.degradationReason || "None"}
  </p>
</div>

      <hr />

      <h2>Health History</h2>

      <table border="1">
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
        <td>
          {new Date(item.checkedAt).toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      <hr />

      <h2>Retry Statistics</h2>

      {retryData && (
        <>
          <p>
            Total Retries:
            {" "}
            {retryData.retryStats.totalRetries}
          </p>

          <p>
            Successful Retries:
            {" "}
            {retryData.retryStats.successfulRetries}
          </p>

          <p>
            Failed Retries:
            {" "}
            {retryData.retryStats.failedRetries}
          </p>

          <p>
            Recovery Rate:
            {" "}
            {retryData.retryStats.recoveryRate}
          </p>
        </>
      )}

      <hr />

      <h2>Retry History</h2>

      {retryData?.retryDetails?.map((retry, index) => (
        <div key={index}>
          <p>
            Retry #{retry.retryAttempt}
            {" | "}
            {retry.healthStatus}
            {" | "}
            {retry.responseTime}
          </p>
        </div>
      ))}

      <hr />

      <h2>Degradation Analysis</h2>

{degradation && (
  <div>
    <p>
      <strong>Degraded:</strong>{" "}
      {degradation.isDegraded ? "Yes" : "No"}
    </p>

    <p>
      <strong>Severity:</strong>{" "}
      {degradation.severity}
    </p>

    <p>
      <strong>Reason:</strong>{" "}
      {degradation.reason}
    </p>

    <p>
      <strong>Logs Analyzed:</strong>{" "}
      {degradation.logsAnalyzed}
    </p>
  </div>
)}
    </div>
  );
}

export default ApiDetails;