const cron = require("node-cron");
const { monitorAllAPIs } = require("../services/apiCaller.service");

cron.schedule("*/30 * * * * *", async () => {
  try {
    await monitorAllAPIs();
  } catch (err) {
    console.error("Monitoring failed:", err.message);
  }
});
