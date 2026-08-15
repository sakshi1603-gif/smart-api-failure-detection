const axios = require("axios");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const ApiModel = require("../models/Api.model");
const { detectHealthStatus } = require("./failureDetector.service");
const {
  updateApiStatusBasedOnDegradation,
} = require("./degradationAnalyzer.service");

const TIMEOUT = 5000;
const MAX_RETRIES = 3;
const BASE_DELAY = 10000; // 10 sec

async function retryFailedApi(api, retryAttempt = 1) {
  if (retryAttempt > MAX_RETRIES) {
    await updateApiStatusBasedOnDegradation(api._id);
    return;
  }

  const delay = retryAttempt * BASE_DELAY;

  setTimeout(async () => {
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
        api.slaLatency,
      );

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: response.status,
        responseTime,
        isSuccess: healthStatus !== "FAILED",
        healthStatus,
        failureType: "NONE",
        isRetry: true,
        retryAttempt,
        checkedAt: new Date(),
      });

      await ApiModel.findByIdAndUpdate(api._id, {
        currentHealthStatus: healthStatus,
        degradationReason: null,
      });

    } catch (err) {
      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus(
        {
          statusCode: err.response?.status || 0,
          timedOut: err.code === "ECONNABORTED",
          responseTime,
        },
        api.slaLatency,
      );

      const failureType =
        err.code === "ECONNABORTED" ? "TIMEOUT" : "SERVER_ERROR";

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: err.response?.status || 0,
        responseTime,
        isSuccess: false,
        healthStatus,
        failureType,
        isRetry: true,
        retryAttempt,
        checkedAt: new Date(),
      });

      await ApiModel.findByIdAndUpdate(api._id, {
        currentHealthStatus: healthStatus,
        degradationReason: healthStatus === "FAILED" ? failureType : null,
      });

      console.log(api.url, `→ Retry ${retryAttempt} FAILED`);

      retryFailedApi(api, retryAttempt + 1);
    }
  }, delay);
}

module.exports = { retryFailedApi };
