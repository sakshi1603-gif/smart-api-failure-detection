import { useState } from "react";
import "../styles/addapi.css";
import api from "../api/api";

// POST /apis -> Api.create(req.body), so any fields you send get saved.
// Adjust this initial shape if your Api.model.js schema differs.
const initialForm = {
  name: "",
  url: "",
  method: "GET",
  slaLatency: 1000,
};

function AddApi() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

async function handleSubmit(e) {
  e.preventDefault();
  setStatus({ state: "loading", message: "" });

  try {
    const res = await api.post("/", form);
    const data = res.data;

    setStatus({
      state: "success",
      message: "API registered. Monitoring will pick it up shortly.",
    });

    setForm(initialForm);
  } catch (err) {
    setStatus({
      state: "error",
      message: err.response?.data?.error || err.message,
    });
  }
}

  return (
    <div className="add-api-page">
      <div className="add-api-card glass-panel">
        <h1>Register a new API</h1>
        <p className="add-api-sub">Register an API endpoint to monitor its health, latency, and availability.</p>

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
              type="url"
              value={form.url}
              onChange={handleChange}
              placeholder="https://api.example.com/health"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Method
              <select name="method" value={form.method} onChange={handleChange}>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </label>
          </div>
          <label>
  SLA Latency (ms)
  <input
    name="slaLatency"
    type="number"
    min="0"
    value={form.slaLatency}
    onChange={handleChange}
    required
  />
</label>

          <button type="submit" className="submit-btn" disabled={status.state === "loading"}>
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
