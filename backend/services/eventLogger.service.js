const ApiEventLog = require("../models/ApiEventLog.model");

async function logEvent({ apiId, fromStatus, toStatus, reason }) {
  await ApiEventLog.create({
    apiId,
    fromStatus,
    toStatus,
    reason,
  });
}

module.exports = { logEvent };
