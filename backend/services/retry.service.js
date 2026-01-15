const axios = require("axios");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const ApiModel = require("../models/Api.model");
const { detectHealthStatus } = require("./failureDetector.service");

const TIMEOUT = 5000;
const MAX_RETRIES = 3;
const BASE_DELAY = 10000; // 10 sec

async function retryFailedApi(api, retryAttempt = 1) {
  if (retryAttempt > MAX_RETRIES) {
    console.log(api.url, "→ Max retries reached");
    return;
  }

  const delay = retryAttempt * BASE_DELAY;

  setTimeout(async () => {
    const start = Date.now();

    try {
      const response = await axios({
        method: api.method,
        url: api.url,
        timeout: TIMEOUT
      });

      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus({
        statusCode: response.status,
        timedOut: false,
        responseTime
      }, api.slaLatency);

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: response.status,
        responseTime,
        healthStatus,
        failureType: "NONE",
        isRetry: true,
        retryAttempt,
        checkedAt: new Date()
      });

      await ApiModel.findByIdAndUpdate(api._id, {
        currentHealthStatus: healthStatus,
        degradationReason: null
      });

      console.log(api.url, `→ RECOVERED on retry ${retryAttempt}`);

    } catch (err) {
      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus({
        statusCode: err.response?.status || 0,
        timedOut: err.code === "ECONNABORTED",
        responseTime
      }, api.slaLatency);

      const failureType = err.code === "ECONNABORTED"
        ? "TIMEOUT"
        : "SERVER_ERROR";

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: err.response?.status || 0,
        responseTime,
        healthStatus,
        failureType,
        isRetry: true,
        retryAttempt,
        checkedAt: new Date()
      });

      await ApiModel.findByIdAndUpdate(api._id, {
        currentHealthStatus: healthStatus,
        degradationReason: healthStatus === "FAILED" ? "API FAILURE" : null
      });

      console.log(api.url, `→ Retry ${retryAttempt} FAILED`);

      retryFailedApi(api, retryAttempt + 1);
    }
  }, delay);
}

module.exports = { retryFailedApi };
