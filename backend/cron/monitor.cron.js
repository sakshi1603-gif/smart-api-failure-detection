const cron = require("node-cron");
const { monitorAllAPIs } = require("../services/apiCaller.service");

cron.schedule("*/30 * * * * *", async () => {
  console.log("⏱️ Monitoring APIs...");
  try {
    await monitorAllAPIs();
  } catch (err) {
    console.error("Monitoring failed:", err.message);
  }
});
