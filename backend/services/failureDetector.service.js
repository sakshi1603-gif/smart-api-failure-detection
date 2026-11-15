// One place that decides what a single check result means.
// result = { statusCode, responseTime, timedOut, errorCode }
function classifyCheck(result, slaLatency) {
  const { statusCode, responseTime, timedOut, errorCode } = result;

  if (errorCode === "SSRF_BLOCKED")
    return { healthStatus: "FAILED", failureType: "BLOCKED_TARGET" };
  if (timedOut) return { healthStatus: "FAILED", failureType: "TIMEOUT" };
  if (!statusCode)
    return { healthStatus: "FAILED", failureType: "NETWORK_ERROR" };
  if (statusCode >= 500)
    return { healthStatus: "FAILED", failureType: "SERVER_ERROR" };
  if (statusCode >= 400)
    return { healthStatus: "FAILED", failureType: "CLIENT_ERROR" };
  if (statusCode >= 300)
    return { healthStatus: "FAILED", failureType: "REDIRECT_ERROR" };
  if (responseTime > slaLatency)
    return { healthStatus: "DEGRADED", failureType: "SLA_BREACH" };

  return { healthStatus: "HEALTHY", failureType: "NONE" };
}

// Kept so older code that still calls detectHealthStatus keeps working.
function detectHealthStatus(result, slaLatency) {
  return classifyCheck(result, slaLatency).healthStatus;
}

module.exports = { classifyCheck, detectHealthStatus };