const ApiHealthLog = require("../models/ApiHealthLog.model");

async function getRecentHealthLogs(apiId, limit = 5) {
  return ApiHealthLog.find({ apiId })
    .sort({ checkedAt: -1 }) // newest first
    .limit(limit);
}


function hasConsecutiveFailures(logs, threshold = 3) {
  let count = 0;

  for (const log of logs) {
    if (log.healthStatus === "FAILED") {
      count++;

      if (count >= threshold) {
        return true;
    }} else {
      break; // chain broken
    }
  }

  return false;
}


function isFrequentlySlow(logs, slowLimit = 4) {
  const slowCount = logs.filter(
    log => log.healthStatus === "SLOW"
  ).length;

  return slowCount >= slowLimit;
}


function decideDegradation(logs) {
  if (logs.length === 0) {
    return {
      degraded: false,
      reason: null
    };
  }

  if (hasConsecutiveFailures(logs, 3)) {
    return {
      degraded: true,
      reason: "3 consecutive failures detected"
    };
  }

  if (isFrequentlySlow(logs, 4)) {
    return {
      degraded: true,
      reason: "API slow in most recent checks"
    };
  }

  return {
    degraded: false,
    reason: null
  };
}


