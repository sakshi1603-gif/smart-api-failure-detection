const axios = require("axios");
const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const { detectHealthStatus } = require("./failureDetector.service");
const { retryFailedApi } = require("./retry.service");
const {
  updateApiStatusBasedOnDegradation
} = require("./degradationAnalyzer.service");

const TIMEOUT = 5000;

async function monitorAllAPIs() {
  const apis = await ApiModel.find();

  console.log(
    `\n📊 [${new Date().toLocaleTimeString()}] Monitoring ${apis.length} APIs...\n`
  );

  let successCount = 0;
  let failureCount = 0;
  let slowCount = 0;

  for (const api of apis) {

    /* =======================
       🚫 SKIP BLOCKED APIs
    ======================== */
    if (
      api.currentHealthStatus === "BLOCKED" &&
      api.blockedUntil &&
      new Date() < api.blockedUntil
    ) {
      console.log(
        `🚫 Skipping ${api.url} (BLOCKED until ${api.blockedUntil})`
      );
      continue;
    }

    /* =======================
       ✅ AUTO-UNBLOCK
    ======================== */
if (
  api.currentHealthStatus === "BLOCKED" &&
  api.blockedUntil &&
  new Date() >= api.blockedUntil
) {
    const start = Date.now();

  try {
    // 🔹 ONE test request after cooldown
    const response = await axios({
      method: api.method,
      url: api.url,
      timeout: TIMEOUT
    });

    const responseTime = Date.now() - start;

    const healthStatus = detectHealthStatus(
      {
        statusCode: response.status,
        timedOut: false,
        responseTime
      },
      api.slaLatency
    );

    // 🔹 Decide recovery
    if (healthStatus === "HEALTHY") {
      api.currentHealthStatus = "HEALTHY";
      api.degradationReason = null;
      api.blockedUntil = null;
    } 
    else if (healthStatus === "SLOW") {
      api.currentHealthStatus = "DEGRADED";
      api.degradationReason = "Slow response after cooldown test";
      api.blockedUntil = null;
    } 
    else {
      // FAILED again → re-block
      api.currentHealthStatus = "BLOCKED";
      api.blockedUntil = new Date(Date.now() + COOLDOWN_TIME);
    }

    await api.save();

  } catch (err) {
    // timeout / network / 5xx etc
    api.currentHealthStatus = "BLOCKED";
    api.blockedUntil = new Date(Date.now() + COOLDOWN_TIME);
    await api.save();
  }
}


    const start = Date.now();

    try {
      const response = await axios({
        method: api.method,
        url: api.url,
        timeout: TIMEOUT
      });

      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus(
        {
          statusCode: response.status,
          timedOut: false,
          responseTime
        },
        api.slaLatency
      );

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: response.status,
        responseTime,
        healthStatus,
        failureType: "NONE",
        checkedAt: new Date()
      });

      /* ❗ Do NOT overwrite BLOCKED */
      if (api.currentHealthStatus !== "BLOCKED") {
        await ApiModel.findByIdAndUpdate(api._id, {
          currentHealthStatus: healthStatus,
          degradationReason: null
        });
      }

      if (healthStatus === "FAILED") {
        retryFailedApi(api).catch(err =>
          console.error(`Retry error for ${api.url}:`, err.message)
        );
      }

      if (healthStatus === "SLOW") {
        slowCount++;
        console.log(
          `⚠️  SLOW   | ${api.name.padEnd(20)} | ${responseTime}ms`
        );
      } else if (healthStatus === "HEALTHY") {
        successCount++;
        console.log(
          `✅ HEALTHY | ${api.name.padEnd(20)} | ${responseTime}ms`
        );
      }

    } catch (err) {
      const responseTime = Date.now() - start;

      const healthStatus = detectHealthStatus(
        {
          statusCode: err.response?.status || 0,
          timedOut: err.code === "ECONNABORTED",
          responseTime
        },
        api.slaLatency
      );

      const failureType =
        err.code === "ECONNABORTED" ? "TIMEOUT" : "SERVER_ERROR";

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: err.response?.status || 0,
        responseTime,
        healthStatus,
        failureType,
        checkedAt: new Date()
      });

      /* ❗ Do NOT overwrite BLOCKED */
      if (api.currentHealthStatus !== "BLOCKED") {
        await ApiModel.findByIdAndUpdate(api._id, {
          currentHealthStatus: healthStatus,
          degradationReason: failureType
        });
      }

      if (healthStatus === "FAILED") {
        retryFailedApi(api).catch(err =>
          console.error(`Retry error for ${api.url}:`, err.message)
        );
      }

      failureCount++;
      console.log(
        `❌ FAILED  | ${api.name.padEnd(20)} | ${responseTime}ms | ${failureType}`
      );
    }
  }

  /* =======================
     📊 SUMMARY
  ======================== */
  console.log(`\n📈 Monitoring Cycle Summary:`);
  console.log(`   ✅ Healthy: ${successCount}`);
  console.log(`   ⚠️  Slow:    ${slowCount}`);
  console.log(`   ❌ Failed:  ${failureCount}`);
  console.log(`   📊 Total:   ${apis.length}\n`);

  /* =======================
     🧠 DEGRADATION ANALYSIS
  ======================== */
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
