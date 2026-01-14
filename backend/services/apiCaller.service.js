const axios = require("axios");
const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const { detectHealthStatus } = require("./failureDetector.service");
const {retryFailedApi}=require("./retry.service.js");
const TIMEOUT = 5000;

async function monitorAllAPIs() {
  const apis = await ApiModel.find();

  for (const api of apis) {
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
        checkedAt: new Date()
      });
      if (healthStatus === "FAILED") {
            retryFailedApi(api);
      }
      console.log(api.url, "→", responseTime + "ms", "→", response.status);

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
        checkedAt: new Date()
      });
      if (healthStatus === "FAILED") {
            retryFailedApi(api);
      }

      console.log(api.url, "→", responseTime + "ms", "→ FAILED");
    }
  }
}

module.exports = { monitorAllAPIs };
