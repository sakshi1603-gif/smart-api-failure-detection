# Smart API Failure Monitor

Monitors your HTTP endpoints every 30 seconds, classifies each check, and tracks health with a status state machine. It blocks endpoints that keep failing, retries failures, and logs every status change in an event history.

**Live demo:** <your-live-url> · **Backend:** Node.js on Render · **Demo login:** `demo@smartapi.com` (read-only)

## Features

- Registers GET endpoints with an SLA latency target and checks them every 30 seconds
- Status model: `PENDING → HEALTHY / DEGRADED / FAILED → BLOCKED`
- Failure types: timeout, network error, 4xx, 5xx, redirect error, SLA breach, blocked target
- Auto-blocks an API after 3 consecutive failures, then probes it after a 5-minute cooldown and recovers it automatically
- Event Center: a log entry only when the status changes, with the failure type, HTTP status and latency
- Dashboard, monitoring table with search/filter/pagination, per-API history, retry stats and uptime
- Auto-refreshing UI (15 s, pauses while the tab is hidden), responsive layout, delete API

## Architecture

```
React (CRA)  ──HTTP + JWT──►  Express API  ──►  MongoDB
                                  │
                           node-cron (30 s)
                                  ▼
                     monitorAllAPIs  (worker pool)
                                  ▼
          checkApi ─► classifyCheck ─► statusEngine ─► events
          (GET,        (one place that   (single writer of
           SSRF-safe)   decides status)   Api.currentHealthStatus)
```

**Check flow:** `checkApi` makes a GET request and never throws → `classifyCheck` turns the result into HEALTHY / DEGRADED / FAILED plus a failure type → `statusEngine` logs it, decides the new status from the recent history window, and updates the API with a compare-and-set. An event is written only if that update actually changed the status, so each transition is logged once, even under races.

### Status rules

| Condition | Status |
|---|---|
| First check not done yet | `PENDING` |
| 2xx within the SLA | `HEALTHY` |
| 2xx but slower than the SLA | `DEGRADED` (SLA breach) |
| Timeout, network error, 3xx/4xx/5xx | `FAILED` |
| 3 failures in a row | `BLOCKED` for 5 minutes, then one probe decides |
| ≥60% failures, or ≥4 slow in the last 10 (min. 5 checks) | `DEGRADED` |

## Security

- **SSRF protection** (`backend/utils/ssrfGuard.js`): blocks private, loopback, link-local (including cloud metadata `169.254.169.254`), CGNAT and IPv6 equivalents. Checked at the hostname, at connect time on the resolved IP (stops DNS rebinding) and on every redirect hop.
- Monitoring is **GET-only** and discards response bodies, so it can't change data on a monitored API and never stores target content.
- Every API, event and report query is scoped to the logged-in owner; input is whitelisted and validated; search input is regex-escaped; page size is capped; each user is limited to 10 APIs.

## Benchmarks

Run locally against a deterministic mock server (`tools/mock-target.js`). Reproduce with `node bench/accuracy.js` and `node bench/throughput.js`.

| What | Result |
|---|---|
| Classification accuracy | **10/10**: healthy, redirect, slow (SLA breach), 404, 500, 503, timeout, dead domain, SSRF via private IP and via metadata IP |
| Outage detection | 5/5 outages detected, each within **one 30-second check interval** (measured ≈ 30 s right after a cycle) |
| Checker capacity, sequential (old loop) | ≈ **274** APIs per 30 s cycle |
| Checker capacity, worker pool of 20 | ≈ **4,400** APIs per cycle (about 16×) |
| Checker capacity, worker pool of 50 | ≈ **7,000–8,000** APIs per cycle |

*Throughput measures the checker only: local mock targets answering in about 100 ms, no database writes. Real APIs are slower and writes add cost, so treat these as an upper bound, not end-to-end capacity.*

## Tech stack

React · Node.js · Express · MongoDB (Mongoose) · JWT auth · node-cron · axios

## Run locally

```bash
# backend
cd backend
npm install
# create .env:
#   <MONGO_URI variable name from your .env>=<your MongoDB connection string>
#   JWT_SECRET=<long random string>
#   PORT=5000
node app.js

# frontend
cd frontend
npm install
npm start
```

Optional backend settings: `MAX_APIS_PER_USER` (default 10), `MONITOR_CONCURRENCY` (default 20), `BLOCK_COOLDOWN_MS` (default 300000), `RETRY_BASE_DELAY_MS` (default 10000).

**Testing against the local mock server:**
```bash
node tools/mock-target.js                      # terminal 1
ALLOW_LOOPBACK_TARGETS=true node app.js        # terminal 2 (from backend/)
```
`ALLOW_LOOPBACK_TARGETS` lets the checker reach `127.0.0.1` and exists for local testing only. **Never set it in production.** Private ranges and cloud metadata stay blocked even when it is on.

## API

All routes require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/apis` | Register an API (name, url, slaLatency) |
| GET | `/apis` | List with `page`, `limit`, `search`, `status` |
| GET | `/apis/:id` | API details |
| DELETE | `/apis/:id` | Delete an API and its history |
| GET | `/apis/:id/history` | Recent health checks |
| GET | `/apis/:id/retry-history` | Retry attempts and stats |
| GET | `/apis/:id/degradation` | Degradation analysis |
| GET | `/apis/:id/uptime` | Uptime for 24 h / 7 d / 30 d |
| GET | `/apis/events` | Status-change events |
| GET | `/apis/degradation/all` | Degradation report for your APIs |
| GET | `/apis/status/blocked` | Currently blocked APIs |

## Known limitations

- **Single instance.** The "cycle already running" guard and retry timers live in process memory. Running two instances would double the checks (events stay deduplicated). Scaling out needs a distributed lock or a job queue.
- **No network-level SSRF backstop.** Protection is in code. Render's free tier offers no egress firewall.
- Retry timers are lost on restart. Block state is stored in the database and survives.
- Thresholds (3 failures, 60% error rate, 5-minute cooldown) are reasonable defaults, not tuned values.
- GET requests only, fixed 30-second interval, no alert notifications yet.
- Health logs expire after 30 days (TTL index).

## Future work

Email/Slack alerts, a per-API check interval, a job queue with a distributed lock for horizontal scaling, a status-history chart, and a summary endpoint for dashboard counts.