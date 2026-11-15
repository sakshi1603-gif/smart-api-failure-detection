const ApiHealthLog = require("../models/ApiHealthLog.model");
const Api = require("../models/Api.model");

const WINDOW = 10; // number of recent logs considered
const MIN_SAMPLE = 5; // rate rules need this many logs, so 1 failure != "high error rate"
const BLOCK_AFTER = 3; // consecutive failures before BLOCKED
const BLOCK_COOLDOWN_MS = Number(
  process.env.BLOCK_COOLDOWN_MS || 5 * 60 * 1000
);

async function getRecentHealthLogs(apiId, limit = WINDOW, since = null) {
  if (!apiId) throw new Error("API ID is required");
  const q = { apiId };
  if (since) q.checkedAt = { $gte: since }; // window restarts after a recovery
  return ApiHealthLog.find(q).sort({ checkedAt: -1 }).limit(limit).lean();
}

/* ---------- pure rules (logs are newest first) ---------- */
function hasConsecutiveFailures(logs, threshold = BLOCK_AFTER) {
  let count = 0;
  for (const log of logs || []) {
    if (log.healthStatus !== "FAILED") break;
    if (++count >= threshold) return true;
  }
  return false;
}

function isFrequentlySlow(logs, slowLimit = 4) {
  return (
    (logs || []).filter((l) => l.healthStatus === "DEGRADED").length >=
    slowLimit
  );
}

function hasHighErrorRate(logs, threshold = 0.6) {
  if (!logs || logs.length === 0) return false;
  return (
    logs.filter((l) => l.healthStatus === "FAILED").length / logs.length >=
    threshold
  );
}

// Single decision point. `latest` = classifyCheck() of the check just logged.
function decideStatus(logs, latest) {
  if (latest.healthStatus === "FAILED" && hasConsecutiveFailures(logs)) {
    return {
      status: "BLOCKED",
      reason: `${BLOCK_AFTER} consecutive failures`,
      blockedUntil: new Date(Date.now() + BLOCK_COOLDOWN_MS),
    };
  }
  if (logs.length >= MIN_SAMPLE) {
    if (hasHighErrorRate(logs))
      return { status: "DEGRADED", reason: "High error rate" };
    if (isFrequentlySlow(logs))
      return { status: "DEGRADED", reason: "Frequently slow" };
  }
  if (latest.healthStatus === "FAILED")
    return { status: "FAILED", reason: latest.failureType };
  if (latest.healthStatus === "DEGRADED")
    return { status: "DEGRADED", reason: "SLA breach" };
  return { status: "HEALTHY", reason: null };
}

// Cooldown over: one probe decides. Fail = stay blocked, pass = recover and restart the window.
function decideAfterProbe(latest) {
  if (latest.healthStatus === "FAILED") {
    return {
      status: "BLOCKED",
      reason: "Failed cooldown recovery test",
      blockedUntil: new Date(Date.now() + BLOCK_COOLDOWN_MS),
    };
  }
  return {
    status: latest.healthStatus, // HEALTHY or DEGRADED
    reason: "Recovered after cooldown",
    blockedUntil: null,
    windowStart: new Date(),
  };
}

/* ---------- read-only reports ---------- */
async function analyzeApiDegradation(apiId) {
  const api = await Api.findById(apiId);
  if (!api) throw new Error("API not found");
  const logs = await getRecentHealthLogs(apiId, WINDOW, api.windowStart);
  const d = decideStatus(logs, {
    healthStatus: logs[0]?.healthStatus || "HEALTHY",
    failureType: logs[0]?.failureType,
  });
  return {
    apiId,
    apiName: api.name,
    apiUrl: api.url,
    currentHealthStatus: api.currentHealthStatus,
    isDegraded: d.status === "DEGRADED" || d.status === "BLOCKED",
    reason: d.reason,
    logsAnalyzed: logs.length,
  };
}

// ownerId is required: this used to return every user's APIs.
async function analyzeAllApisDegradation(ownerId) {
  if (!ownerId) throw new Error("ownerId is required");
  const apis = await Api.find({ owner: ownerId, isActive: true }, "_id");
  const report = await Promise.all(
    apis.map((a) => analyzeApiDegradation(a._id))
  );
  return {
    timestamp: new Date(),
    totalApisAnalyzed: apis.length,
    degradedCount: report.filter((r) => r.isDegraded).length,
    healthyCount: report.filter((r) => !r.isDegraded).length,
    allApis: report,
  };
}

module.exports = {
  WINDOW,
  MIN_SAMPLE,
  BLOCK_AFTER,
  BLOCK_COOLDOWN_MS,
  getRecentHealthLogs,
  hasConsecutiveFailures,
  isFrequentlySlow,
  hasHighErrorRate,
  decideStatus,
  decideAfterProbe,
  analyzeApiDegradation,
  analyzeAllApisDegradation,
};