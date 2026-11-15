import { useState } from "react";
import "../styles/addapi.css";
import api from "../api/api";

const initialForm = {
  name: "",
  url: "",
  slaLatency: 1000,
};

const SLA_MIN = 50;
const SLA_MAX = 5000;

function normalizeUrl(raw) {
  const value = raw.trim();
  if (!value) return value;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
}

function AddApi() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const sla = Number(form.slaLatency);
    if (!Number.isFinite(sla) || sla < SLA_MIN || sla > SLA_MAX) {
      setStatus({
        state: "error",
        message: `SLA must be between ${SLA_MIN} and ${SLA_MAX} ms.`,
      });
      return;
    }

    let url = normalizeUrl(form.url);
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setStatus({
        state: "error",
        message: "Enter a valid URL, e.g. https://api.example.com/health",
      });
      return;
    }

    setStatus({ state: "loading", message: "" });

    try {
      await api.post("/apis", {
        name: form.name.trim(),
        url,
        method: "GET", // monitoring only supports GET
        slaLatency: sla,
      });

      setStatus({
        state: "success",
        message: "API registered. First check runs within 30 seconds.",
      });

      setForm(initialForm);
    } catch (err) {
      const data = err.response?.data;
      let message = data?.message || data?.error || err.message;
      if (err.response?.status === 400 && /duplicate|E11000/i.test(message)) {
        message = "You are already monitoring this URL.";
      }
      setStatus({ state: "error", message });
    }
  }

  return (
    <div className="add-api-page">
      <div className="add-api-card glass-panel">
        <h1>Register a new API</h1>
        <p className="add-api-sub">
          Register an API endpoint to monitor its health, latency, and
          availability.
        </p>

        <form onSubmit={handleSubmit} className="add-api-form">
          <label>
            API name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Payments Service"
              required
            />
          </label>

          <label>
            Endpoint URL
            <input
              name="url"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              value={form.url}
              onChange={handleChange}
              placeholder="https://api.example.com/health"
              required
            />
          </label>

          <label>
            SLA Latency (ms)
            <input
              name="slaLatency"
              type="number"
              min={SLA_MIN}
              max={SLA_MAX}
              value={form.slaLatency}
              onChange={handleChange}
              required
            />
          </label>

          <p className="form-hint">
            Checks use GET requests only, every 30 seconds, so monitoring never
            changes data on your API. SLA range: {SLA_MIN}–{SLA_MAX} ms.
          </p>

          <button
            type="submit"
            className="submit-btn"
            disabled={status.state === "loading"}
          >
            {status.state === "loading" ? "Registering…" : "Register API"}
          </button>

          {status.state === "success" && (
            <p className="form-feedback success">{status.message}</p>
          )}
          {status.state === "error" && (
            <p className="form-feedback error">{status.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default AddApi;