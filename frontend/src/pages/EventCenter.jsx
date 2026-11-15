import { useState } from "react";
import "../styles/eventcenter.css";
import api from "../api/api";
import usePolling from "../hooks/usePolling";

function EventCenter() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/apis/events", {
        params: { page, status: filter === "all" ? "" : filter },
      });
      setEvents(res.data.events);
      setTotalPages(res.data.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchEvents, [page, filter], 15000);

  function getStatus(event) {
    return (event.toStatus || "info").toLowerCase();
  }

  return (
    <div className="event-center-page">
      <div className="event-header">
        <div>
          <h1>Event Center</h1>
          <p>Every status change, recovery, and failure logged in one place.</p>
        </div>
        <div className="event-filters">
          {["all", "HEALTHY", "DEGRADED", "FAILED", "BLOCKED"].map((f) => (
            <button
              key={f}
              className={`filter-chip${filter === f ? " active" : ""}`}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="event-state">Loading events…</p>}
      {error && (
        <p className="event-state error">Couldn't load events: {error}</p>
      )}
      {!loading && !error && events.length === 0 && (
        <p className="event-state">
          No events yet. They'll show up here as soon as something happens.
        </p>
      )}

      <div className="event-list">
        {events.map((event, i) => {
          const status = getStatus(event);
          const apiName = event.apiId?.name || "Unknown API";
          const timestamp = event.createdAt;

          return (
            <div key={event._id || i} className="event-row glass-panel">
              <div className="event-body">
                <div className="event-top">
                  <span className="event-name">{apiName}</span>
                  <span className="event-time">
                    {timestamp ? new Date(timestamp).toLocaleString() : ""}
                  </span>
                </div>
                <span className={`status-pill pulse status-${status}`}>
                  {status}
                </span>
                <p className="event-message">
                  {event.fromStatus && event.toStatus
                    ? `${event.fromStatus} → ${event.toStatus}: `
                    : ""}
                  {event.reason || event.apiId?.url || "No details provided."}
                </p>
              </div>
            </div>
          );
        })}
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

export default EventCenter;