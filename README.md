## ✨ Features

Smart API Failure Detection & Auto-Recovery System is designed as a **real-world engineering tool**, not a college demo.  
It continuously monitors APIs, detects failures intelligently, and automatically takes recovery actions while visualizing system health.

---

## 🔹 Core Features (Must-Have)

### 1️⃣ API Registration & Configuration
Allows developers to register APIs that need monitoring.

Each API can be configured with:
- API name
- Endpoint URL
- HTTP method (GET / POST)
- SLA (expected response time)
- Required response fields

➡️ This makes the system **config-driven**, avoiding hardcoded logic and reflecting real production systems.

---

### 2️⃣ Automated Health Checks (Background Monitoring)
The system periodically checks each registered API in the background.

For every check, it captures:
- Response time
- HTTP status code
- Timeout occurrences
- Response validity

➡️ This forms the **core monitoring engine** of the application.

---

### 3️⃣ Failure Detection Logic (Rules-Based)
The system evaluates API health using rule-based logic and classifies APIs into states:

- 🟢 **Healthy**
- 🟡 **Slow**
- 🔴 **Failed**
- ⚫ **Blocked**

Failures are detected based on:
- Timeouts or 5xx errors
- Latency exceeding SLA
- Missing required response fields
- Degradation over time (error patterns)

➡️ This logic differentiates the project from basic CRUD applications.

---

### 4️⃣ Auto-Recovery Mechanism
When an API becomes unhealthy, the system automatically takes recovery actions:

- Retry requests with delay
- Temporarily block APIs after repeated failures
- Allow test requests after cooldown
- Serve fallback responses when needed

➡️ Demonstrates **defensive and resilient system design**.

---

### 5️⃣ Metrics & History Storage
Every health check result is stored with:
- Timestamp
- Response time
- Status code
- Failure type

➡️ Enables historical analysis, debugging, and reasoning during interviews.

---

### 6️⃣ Real-Time Dashboard (React)
A visual dashboard displays:
- List of monitored APIs
- Current health status
- Last response time
- Last checked timestamp

➡️ Makes backend intelligence visible and easy to understand.

---

## 🔹 Important Features (Should-Have)

### 7️⃣ Health Timeline / History View
Displays how an API’s health changes over time:

**Healthy → Slow → Failed → Blocked → Healthy**

➡️ Highlights degradation patterns and recovery behavior.

---

### 8️⃣ Event Logging (Why Something Happened)
Logs important system events such as:
- Health state changes
- API blocking
- Recovery attempts

➡️ Helps explain *why* the system behaved a certain way.

---

### 9️⃣ Manual Enable / Disable Monitoring
Provides operator control to:
- Temporarily disable monitoring for an API
- Re-enable monitoring when required

➡️ Reflects real-world operational needs.

---

## 🔹 Optional / Stretch Features

These are implemented only if time allows:

- **Mock Alerting System**  
  Console-based or simulated alerts when APIs fail repeatedly.

- **API Proxy Mode**  
  Routes requests through the system and automatically returns fallback responses when APIs are unhealthy.

- **SLA Reports**  
  Generates uptime and availability summaries over time.

---

## ❌ Intentionally Excluded Features

To maintain clarity and interview focus, the following are intentionally not included:
- Authentication & roles
- Microservices architecture
- Kafka / message queues
- AI / ML-based detection
- Kubernetes / Docker (initial stage)
- Over-designed UI

---

## 🎯 One-Line Feature Summary

> **The system continuously monitors third-party APIs, detects different types of failures using rule-based logic, automatically prevents cascading failures through recovery actions, and visualizes API health over time.**
