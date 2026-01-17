const ApiHealthLog = require("../models/ApiHealthLog.model");
const Api = require("../models/Api.model");

async function getRecentHealthLogs(apiId, limit = 10) {
  try {
    if (!apiId) {
      throw new Error("API ID is required");
    }

    const logs = await ApiHealthLog.find({ apiId })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean();

    return logs;
  } catch (error) {
    console.error("Error fetching health logs:", error);
    throw error;
  }
}

function hasConsecutiveFailures(logs, threshold = 3) {
  if(!logs || logs.length===0) return false;

  let consecutiveFailureCount = 0;

  for (const log of logs) {
    if (log.healthStatus === "FAILED") {
      consecutiveFailureCount++;

      if (consecutiveFailureCount >= threshold) {
        return true;
    }} else {
      break; // chain broken
    }
  }
  return false;
}

function isFrequentlySlow(logs, slowLimit = 4) {
  if(!logs || logs.length===0) return false;

  const slowCount = logs.filter(
    log => log.healthStatus === "SLOW"
  ).length;

  return slowCount >= slowLimit;
}

// Additional helper to check high error rate
function hasHighErrorRate(logs, errorRateThreshold = 0.5) {
  if(!logs || logs.length===0) return false;
  const errorCount = logs.filter(
    log => log.healthStatus === "FAILED"
  ).length;
  const errorRate = errorCount / logs.length;
  return errorRate >= errorRateThreshold;
}

function decideDegradation(logs) {
  if (logs.length === 0) {
    return {
      isDegraded: false,
      reason: null,
      severity: "NONE",
      recommendation: null
    };
  }

  if (hasConsecutiveFailures(logs, 3)) {
    return {
      isDegraded: true,
      reason: "3 consecutive failures detected",
      severity: "CRITICAL",
      recommendation: "API is Down. Check Server Status and Restart if necessary."
    };
  }

  if (hasHighErrorRate(logs, 0.6)) {
    return {
      isDegraded: true,
      reason: "High error rate detected (60%) in recent checks",
      severity: "HIGH",
      recommendation: "Investigate recent errors and monitor closely."
    };
  }

  if (isFrequentlySlow(logs, 4)) {
    return {
      isDegraded: true,
      reason: "API is frequently slow (4 or more slow responses)",
      severity: "MEDIUM",
      recommendation: "Monitor API performance and consider optimization."
    };
  }

  return {
    isDegraded: false,
    reason: null,
    severity: "NONE",
    recommendation: null
  };
}

// Analyze single API degradation status
async function analyzeApiDegradation(apiId) {
  try {
    const api = await Api.findById(apiId);
    if (!api) {
      throw new Error("API not found");
    }

    const recentLogs = await getRecentHealthLogs(apiId, 10);
    const degradationStatus = decideDegradation(recentLogs);

    return {
      apiId,
      apiName: api.name,
      apiUrl: api.url,
      currentHealthStatus: api.currentHealthStatus,
      ...degradationStatus,
      logsAnalyzed: recentLogs.length
    };
  } catch (error) {
    console.error("Error analyzing API degradation:", error);
    throw error;
  }
}

// Analyze ALL APIs for degradation
async function analyzeAllApisDegradation() {
  try {
    const activeApis = await Api.find({ isActive: true });

    const degradationReport = await Promise.all(
      activeApis.map(api => analyzeApiDegradation(api._id))
    );

    // Filter degraded APIs
    const degradedApis = degradationReport.filter(api => api.isDegraded);

    return {
      timestamp: new Date(),
      totalApisAnalyzed: activeApis.length,
      degradedCount: degradedApis.length,
      healthyCount: activeApis.length - degradedApis.length,
      degradedApis,
      allApis: degradationReport
    };
  } catch (error) {
    console.error("Error analyzing all APIs degradation:", error);
    throw error;
  }
}

// Update API status in database based on degradation
async function updateApiStatusBasedOnDegradation(apiId) {
  try {
    // 1. Get recent logs
    const logs = await getRecentHealthLogs(apiId, 10);

    // 2. Check if API should be blocked
    const shouldBlock = hasConsecutiveFailures(logs, 3);

    // 3. If BLOCK condition satisfied
    if (shouldBlock) {
      const BLOCK_COOLDOWN_MINUTES = 5;

      const blockedUntil = new Date(
        Date.now() + BLOCK_COOLDOWN_MINUTES * 60 * 1000
      );

      await Api.findByIdAndUpdate(
        apiId,
        {
          currentHealthStatus: "BLOCKED",
          blockedUntil: blockedUntil,
          degradationReason: "3 consecutive failures. API temporarily blocked."
        },
        { new: true }
      );

      console.log(
        `🚫 API ${apiId} BLOCKED until ${blockedUntil}`
      );

      return {
        status: "BLOCKED",
        blockedUntil
      };
    }

    // 4. If not blocked, mark as DEGRADED or HEALTHY
    const degradationStatus = decideDegradation(logs);

    if (degradationStatus.isDegraded) {
      await Api.findByIdAndUpdate(
        apiId,
        {
          currentHealthStatus: "DEGRADED",
          degradationReason: degradationStatus.reason,
          blockedUntil: null
        },
        { new: true }
      );

      return { status: "DEGRADED" };
    }

    // 5. If everything is fine → HEALTHY
    await Api.findByIdAndUpdate(
      apiId,
      {
        currentHealthStatus: "HEALTHY",
        degradationReason: null,
        blockedUntil: null
      },
      { new: true }
    );

    return { status: "HEALTHY" };

  } catch (error) {
    console.error(
      "Error in updateApiStatusBasedOnDegradation:",
      error
    );
    throw error;
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
  updateApiStatusBasedOnDegradation
};


