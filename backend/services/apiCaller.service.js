const axios = require("axios");
const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const { detectHealthStatus } = require("./failureDetector.service");
const { retryFailedApi } = require("./retry.service");
const {
  updateApiStatusBasedOnDegradation,
} = require("./degradationAnalyzer.service");
const { updateRecoveryStatus } = require("./recoveryStatusUpdater.service");
const { logEvent } = require("./eventLogger.service");

const TIMEOUT = 5000;

async function monitorAllAPIs() {
  const apis = await ApiModel.find();

  for (const api of apis) {
    if (
      api.currentHealthStatus === "BLOCKED" &&
      api.blockedUntil &&
      new Date() < api.blockedUntil
    ) {
      continue;
    }

    if (
      api.currentHealthStatus === "BLOCKED" &&
      api.blockedUntil &&
      new Date() >= api.blockedUntil
    ) {
      const start = Date.now();

      try {
        const response = await axios({
          method: api.method,
          url: api.url,
          timeout: TIMEOUT,
        });

        const responseTime = Date.now() - start;

        const healthStatus = detectHealthStatus(
          {
            statusCode: response.status,
            timedOut: false,
            responseTime,
          },
          api.slaLatency
        );

        await updateRecoveryStatus({
          apiId: api._id,
          healthStatus,
          responseTime,
          statusCode: response.status,
        });
      } catch (err) {
        await updateRecoveryStatus({
          apiId: api._id,
          healthStatus: "FAILED",
          responseTime: TIMEOUT,
          statusCode: 0,
        });
      }

      continue;
    }

    const start = Date.now();

    try {
      const response = await axios({
        method: api.method,
        url: api.url,
        timeout: TIMEOUT,
      });

      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus(
        {
          statusCode: response.status,
          timedOut: false,
          responseTime,
        },
        api.slaLatency
      );

      const previousStatus = api.currentHealthStatus;

      if (previousStatus !== healthStatus) {
        await logEvent({
          apiId: api._id,
          fromStatus: previousStatus,
          toStatus: healthStatus,
          reason: "Health status changed during monitoring",
        });
      }

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: response.status,
        responseTime,
        isSuccess: healthStatus !== "FAILED",
        healthStatus,
        failureType: "NONE",
        checkedAt: new Date(),
      });

      if (api.currentHealthStatus !== "BLOCKED") {
        await ApiModel.findByIdAndUpdate(api._id, {
          currentHealthStatus: healthStatus,
          degradationReason: null,
        });
      }

      if (healthStatus === "FAILED") {
        retryFailedApi(api).catch((err) =>
          console.error(`Retry error for ${api.url}:`, err.message)
        );
      }
    } catch (err) {
      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus(
        {
          statusCode: err.response?.status || 0,
          timedOut: err.code === "ECONNABORTED",
          responseTime,
        },
        api.slaLatency
      );

      const failureType =
        err.code === "ECONNABORTED" ? "TIMEOUT" : "SERVER_ERROR";

      const previousStatus = api.currentHealthStatus;

      if (previousStatus !== healthStatus) {
        await logEvent({
          apiId: api._id,
          fromStatus: previousStatus,
          toStatus: healthStatus,
          reason: failureType,
        });
      }

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: err.response?.status || 0,
        responseTime,
        isSuccess: false,
        healthStatus,
        failureType,
        checkedAt: new Date(),
      });

      if (api.currentHealthStatus !== "BLOCKED") {
        await ApiModel.findByIdAndUpdate(api._id, {
          currentHealthStatus: healthStatus,
          degradationReason: failureType,
        });
      }

      if (healthStatus === "FAILED") {
        retryFailedApi(api).catch((err) =>
          console.error(`Retry error for ${api.url}:`, err.message)
        );
      }
    }
  }

  for (const api of apis) {
    try {
      await updateApiStatusBasedOnDegradation(api._id);
    } catch (err) {
      console.error(
        `Degradation analysis error for ${api.url}:`,
        err.message
      );
    }
  }
}

module.exports = { monitorAllAPIs };