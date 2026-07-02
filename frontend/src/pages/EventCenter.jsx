import { useEffect, useState } from "react";
import "../styles/eventcenter.css";
import api from "../api/api";

// GET /apis/events -> Event.find().populate("apiId", "name url").sort({ createdAt: -1 })
// Response is a plain array. Field names below (type/status/message) are best
// guesses at your ApiEventLog schema — tell me the actual fields if these
// don't match and I'll adjust.
function EventCenter() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

useEffect(() => {
  async function fetchEvents() {
    try {
      setLoading(true);

      const res = await api.get("/events");
      const data = res.data;

      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  fetchEvents();
}, []);

  function getStatus(event) {
    return (
      event.status ||
      event.type ||
      event.eventType ||
      event.healthStatus ||
      "info"
    ).toLowerCase();
  }

  const filtered =
    filter === "all" ? events : events.filter((e) => getStatus(e) === filter);

  return (
    <div className="event-center-page">
      <div className="event-header">
        <div>
          <h1>Event Center</h1>
          <p>Every failure, recovery, and health check logged in one place.</p>
        </div>
        <div className="event-filters">
          {["all", "failure", "recovery", "success", "failed", "healthy"].map((f) => (
            <button
              key={f}
              className={`filter-chip${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="event-state">Loading events…</p>}
      {error && <p className="event-state error">Couldn't load events: {error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="event-state">
          No events yet. They'll show up here as soon as something happens.
        </p>
      )}

      <div className="event-list">
        {filtered.map((event, i) => {
          const status = getStatus(event);
          const apiName = event.apiId?.name || event.apiName || "Unknown API";
          const apiUrl = event.apiId?.url || event.url || "";
          const timestamp = event.createdAt || event.timestamp || event.checkedAt;

          return (
            <div key={event._id || i} className="event-row glass-panel">
              <div className="event-body">
                <div className="event-top">
                  <span className="event-name">{apiName}</span>
                  <span className="event-time">
                    {timestamp ? new Date(timestamp).toLocaleString() : ""}
                  </span>
                </div>
                <span className={`status-pill pulse status-${status}`}>{status}</span>
                <p className="event-message">
                  {event.message || event.description || event.reason || apiUrl || "No details provided."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventCenter;
