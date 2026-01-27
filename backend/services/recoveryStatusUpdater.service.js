const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");

/**
 * Person B responsibility:
 * Persist recovery result after cooldown test
 */
async function updateRecoveryStatus({
  apiId,
  healthStatus,
  responseTime,
  statusCode
}) {
  const api = await ApiModel.findById(apiId);
  if (!api) return;

  if (healthStatus === "HEALTHY") {
    api.currentHealthStatus = "HEALTHY";
    api.degradationReason = "Recovered after cooldown test";
    api.blockedUntil = null;
  } 
  else if (healthStatus === "SLOW") {
    api.currentHealthStatus = "DEGRADED";
    api.degradationReason = "Slow response after cooldown test";
    api.blockedUntil = null;
  } 
  else {
    api.currentHealthStatus = "BLOCKED";
    api.degradationReason = "Failed cooldown recovery test";
    api.blockedUntil = new Date(Date.now() + api.cooldownTime);
  }

  await api.save();

  // Log recovery attempt (VERY important)
  await ApiHealthLog.create({
    apiId: api._id,
    statusCode,
    responseTime,
    healthStatus,
    failureType: "COOLDOWN_TEST",
    checkedAt: new Date()
  });
}

module.exports = { updateRecoveryStatus };
