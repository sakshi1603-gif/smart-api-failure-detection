const Api = require("../models/Api.model");
const { runCheck } = require("./statusEngine.service");

const MAX_RETRIES = 3;
const BASE_DELAY = Number(process.env.RETRY_BASE_DELAY_MS || 10000);
const retrying = new Set(); // one retry chain per API; cycles used to stack chains

function scheduleRetries(apiId, attempt = 1) {
  const key = String(apiId);
  if (attempt === 1) {
    if (retrying.has(key)) return;
    retrying.add(key);
  }
  if (attempt > MAX_RETRIES) return void retrying.delete(key);

  setTimeout(async () => {
    let next = false;
    try {
      const api = await Api.findById(key).lean();
      if (api && api.isActive && api.currentHealthStatus !== "BLOCKED") {
        const out = await runCheck(api, {
          isRetry: true,
          retryAttempt: attempt,
        });
        next = out.healthStatus === "FAILED" && out.status !== "BLOCKED";
      }
    } catch (err) {
      console.error(`Retry error for ${key}:`, err.message);
    }
    if (next) scheduleRetries(key, attempt + 1);
    else retrying.delete(key);
  }, attempt * BASE_DELAY);
}

module.exports = {
  scheduleRetries,
  retryFailedApi: (api) => scheduleRetries(api._id),
};