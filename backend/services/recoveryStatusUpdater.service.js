const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");

const BLOCK_COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutes

async function updateRecoveryStatus({
  apiId,
  healthStatus,
  responseTime,
  statusCode,
}) {
  const api = await ApiModel.findById(apiId);

  if (!api) return;

  if (healthStatus === "HEALTHY") {
    api.currentHealthStatus = "HEALTHY";
    api.degradationReason = "Recovered after cooldown test";
    api.blockedUntil = null;
  } else if (healthStatus === "SLOW") {
    api.currentHealthStatus = "DEGRADED";
    api.degradationReason = "Slow response after cooldown test";
    api.blockedUntil = null;
  } else {
    api.currentHealthStatus = "BLOCKED";
    api.degradationReason = "Failed cooldown recovery test";
    api.blockedUntil = new Date(Date.now() + BLOCK_COOLDOWN_TIME);
  }

  await api.save();

  await ApiHealthLog.create({
    apiId: api._id,
    statusCode,
    responseTime,
    isSuccess: healthStatus !== "FAILED",
    healthStatus,
    failureType: healthStatus === "FAILED" ? "SERVER_ERROR" : "NONE",
    checkedAt: new Date(),
  });
}

module.exports = { updateRecoveryStatus };
