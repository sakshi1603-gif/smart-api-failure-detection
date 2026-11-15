const Api = require("../models/Api.model");
const { runCheck } = require("./statusEngine.service");
const { scheduleRetries } = require("./retry.service");

const CONCURRENCY = Number(process.env.MONITOR_CONCURRENCY || 20);
let running = false; // node-cron starts a new run even if the last one is still going

async function pool(items, limit, fn) {
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await fn(item);
      } catch (err) {
        console.error(`Check failed for ${item.url}:`, err.message);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
}

async function checkOne(api) {
  if (api.currentHealthStatus === "BLOCKED") {
    if (api.blockedUntil && Date.now() < new Date(api.blockedUntil).getTime())
      return; // still cooling down
    await runCheck(api, { isProbe: true }); // cooldown over: single probe
    return;
  }
  const out = await runCheck(api);
  if (out.healthStatus === "FAILED" && out.status !== "BLOCKED")
    scheduleRetries(api._id);
}

async function monitorAllAPIs() {
  if (running) {
    console.warn("Previous monitoring cycle still running, skipping");
    return { skipped: true };
  }
  running = true;
  const t0 = Date.now();
  try {
    const apis = await Api.find({ isActive: true }).lean();
    await pool(apis, CONCURRENCY, checkOne);
    return { checked: apis.length, ms: Date.now() - t0 };
  } finally {
    running = false;
  }
}

module.exports = { monitorAllAPIs };