function detectHealthStatus(result, slaLatency) {
  if (result.timedOut || result.statusCode >= 500) {
    return "FAILED";
  }

  if (result.responseTime > slaLatency) {
    return "SLOW";
  }

  return "HEALTHY";
}
// const status = detectHealthStatus(
//   { statusCode: 200, timedOut: true, responseTime: 6000 },
//   5000
// );
// console.log(status);
// // → "FAILED"

module.exports = { detectHealthStatus };
