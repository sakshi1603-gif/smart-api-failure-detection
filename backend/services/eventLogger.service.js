const ApiEventLog = require("../models/ApiEventLog.model");

// Extra fields (statusCode, responseTime, failureType) are stored only if the
// schema has them; the same detail is also in `reason`, so nothing is lost.
async function logEvent({
  apiId,
  fromStatus,
  toStatus,
  reason,
  statusCode,
  responseTime,
  failureType,
}) {
  await ApiEventLog.create({
    apiId,
    fromStatus,
    toStatus,
    reason,
    statusCode,
    responseTime,
    failureType,
  });
}

module.exports = { logEvent };