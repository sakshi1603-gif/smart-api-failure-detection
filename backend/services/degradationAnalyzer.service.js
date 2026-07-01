const ApiHealthLog = require("../models/ApiHealthLog.model");
const Api = require("../models/Api.model");
const { logEvent } = require("../services/eventLogger.service");

/* =========================
   FETCH RECENT HEALTH LOGS
========================= */
async function getRecentHealthLogs(apiId, limit = 10) {
  if (!apiId) throw new Error("API ID is required");

  return ApiHealthLog.find({ apiId })
    .sort({ checkedAt: -1 })
    .limit(limit)
    .lean();
}

/* =========================
   FAILURE / DEGRADATION CHECKS
========================= */
function hasConsecutiveFailures(logs, threshold = 3) {
  if (!logs || logs.length === 0) return false;

  let count = 0;
  for (const log of logs) {
    if (log.healthStatus === "FAILED") {
      count++;
      if (count >= threshold) return true;
    } else break;
  }
  return false;
}

function isFrequentlySlow(logs, slowLimit = 4) {
  if (!logs || logs.length === 0) return false;
  return logs.filter((log) => log.healthStatus === "SLOW").length >= slowLimit;
}

function hasHighErrorRate(logs, threshold = 0.5) {
  if (!logs || logs.length === 0) return false;
  const errorCount = logs.filter((log) => log.healthStatus === "FAILED").length;
  return errorCount / logs.length >= threshold;
}

function decideDegradation(logs) {
  if (logs.length === 0) {
    return { isDegraded: false, reason: null, severity: "NONE" };
  }

  if (hasConsecutiveFailures(logs, 3)) {
    return {
      isDegraded: true,
      reason: "3 consecutive failures detected",
      severity: "CRITICAL",
    };
  }

  if (hasHighErrorRate(logs, 0.6)) {
    return {
      isDegraded: true,
      reason: "High error rate detected",
      severity: "HIGH",
    };
  }

  if (isFrequentlySlow(logs, 4)) {
    return {
      isDegraded: true,
      reason: "API frequently slow",
      severity: "MEDIUM",
    };
  }

  return { isDegraded: false, reason: null, severity: "NONE" };
}

/* =========================
   ANALYZE SINGLE API
========================= */
async function analyzeApiDegradation(apiId) {
  const api = await Api.findById(apiId);
  if (!api) throw new Error("API not found");

  const logs = await getRecentHealthLogs(apiId, 10);
  const degradation = decideDegradation(logs);

  return {
    apiId,
    apiName: api.name,
    apiUrl: api.url,
    currentHealthStatus: api.currentHealthStatus,
    ...degradation,
    logsAnalyzed: logs.length,
  };
}

/* =========================
   ANALYZE ALL APIS
========================= */
async function analyzeAllApisDegradation() {
  const apis = await Api.find({ isActive: true });

  const report = await Promise.all(
    apis.map((api) => analyzeApiDegradation(api._id)),
  );

  return {
    timestamp: new Date(),
    totalApisAnalyzed: apis.length,
    degradedCount: report.filter((r) => r.isDegraded).length,
    healthyCount: report.filter((r) => !r.isDegraded).length,
    allApis: report,
  };
}

/* =========================
   UPDATE API STATUS (DAY 11)
========================= */
async function updateApiStatusBasedOnDegradation(apiId) {
  try {
    const api = await Api.findById(apiId);
    if (!api) throw new Error("API not found");

    const previousStatus = api.currentHealthStatus;
    const logs = await getRecentHealthLogs(apiId, 10);

    /* ---------- BLOCK CONDITION ---------- */
    if (hasConsecutiveFailures(logs, 3)) {
      const BLOCK_COOLDOWN_MINUTES = 5;

      const blockedUntil = new Date(
        Date.now() + BLOCK_COOLDOWN_MINUTES * 60 * 1000,
      );

      await Api.findByIdAndUpdate(apiId, {
        currentHealthStatus: "BLOCKED",
        blockedUntil,
        degradationReason: "3 consecutive failures. API temporarily blocked.",
      });

      // ✅ DAY 11 EVENT LOG (WHY visible)
      if (previousStatus !== "BLOCKED") {
        await logEvent({
          apiId,
          fromStatus: previousStatus,
          toStatus: "BLOCKED",
          reason: "API blocked due to 3 consecutive failures",
        });
      }

      console.log(`🚫 API ${apiId} BLOCKED until ${blockedUntil}`);
      return { status: "BLOCKED", blockedUntil };
    }

    /* ---------- DEGRADED ---------- */
    const degradation = decideDegradation(logs);
    if (degradation.isDegraded) {
      await Api.findByIdAndUpdate(apiId, {
        currentHealthStatus: "DEGRADED",
        degradationReason: degradation.reason,
        blockedUntil: null,
      });

      return { status: "DEGRADED" };
    }

    /* ---------- HEALTHY ---------- */
    await Api.findByIdAndUpdate(apiId, {
      currentHealthStatus: "HEALTHY",
      degradationReason: null,
      blockedUntil: null,
    });

    return { status: "HEALTHY" };
  } catch (err) {
    console.error("Error in updateApiStatusBasedOnDegradation:", err);
    throw err;
  }
}

module.exports = {
  getRecentHealthLogs,
  hasConsecutiveFailures,
  isFrequentlySlow,
  hasHighErrorRate,
  decideDegradation,
  analyzeApiDegradation,
  analyzeAllApisDegradation,
  updateApiStatusBasedOnDegradation,
};
