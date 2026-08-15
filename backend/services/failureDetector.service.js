function detectHealthStatus(result, slaLatency) {
  if (result.timedOut || result.statusCode >= 500) {
    return "FAILED";
  }

  if (result.responseTime > slaLatency) {
    return "SLOW";
  }

  return "HEALTHY";
}

module.exports = { detectHealthStatus };
