const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const { checkApi } = require("./checkApi.service");
const { classifyCheck } = require("./failureDetector.service");
const { logEvent } = require("./eventLogger.service");
const {
  WINDOW,
  getRecentHealthLogs,
  decideStatus,
  decideAfterProbe,
} = require("./degradationAnalyzer.service");

// The ONLY place that writes Api.currentHealthStatus.
// check -> classify -> log -> decide -> compare-and-set -> event on transition.
async function runCheck(
  api,
  { isRetry = false, retryAttempt = null, isProbe = false } = {}
) {
  const result = await checkApi(api);
  const cls = classifyCheck(result, api.slaLatency);

  await ApiHealthLog.create({
    apiId: api._id,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    isSuccess: cls.healthStatus !== "FAILED",
    healthStatus: cls.healthStatus,
    failureType: cls.failureType,
    isRetry,
    retryAttempt,
    checkedAt: new Date(),
  });

  const decision = isProbe
    ? decideAfterProbe(cls)
    : decideStatus(
        await getRecentHealthLogs(api._id, WINDOW, api.windowStart),
        cls
      );

  const prev = api.currentHealthStatus;
  const set = {
    currentHealthStatus: decision.status,
    degradationReason: decision.reason,
    blockedUntil: decision.blockedUntil || null,
  };
  if (decision.windowStart) set.windowStart = decision.windowStart;

  // Compare-and-set: if another writer already moved the status, this one loses
  // and logs nothing, so a transition is recorded exactly once.
  const won = await Api.findOneAndUpdate(
    { _id: api._id, currentHealthStatus: prev },
    { $set: set }
  );

  if (won && prev !== decision.status) {
    const detail =
      `${cls.failureType === "NONE" ? "OK" : cls.failureType} | HTTP ${
        result.statusCode || "-"
      } | ${result.responseTime}ms` +
      (result.errorCode ? ` | ${result.errorCode}` : "");
    await logEvent({
      apiId: api._id,
      fromStatus: prev,
      toStatus: decision.status,
      reason: decision.reason ? `${decision.reason} (${detail})` : detail,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      failureType: cls.failureType,
    });
  }

  return { healthStatus: cls.healthStatus, status: decision.status, prev };
}

module.exports = { runCheck };