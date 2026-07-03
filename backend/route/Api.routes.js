const express = require("express");
const router = express.Router();
const ApiController = require("../controller/Api.controller");
const { protect } = require("../middleware/authMiddleware");

// Protect everything below this line
router.use(protect);

// Main API routes
router.post("/", ApiController.registerApi);
router.get("/", ApiController.getApis);

// Events
router.get("/events", ApiController.getEvents);

// History
router.get("/:id/history", ApiController.getApiHistory);
router.get("/:id/retry-history", ApiController.getRetryHistory);

// Blocked APIs
router.get("/status/blocked", ApiController.getBlockedApis);

// Degradation
router.get("/:id/degradation", ApiController.getApiDegradationStatus);
router.get("/degradation/all", ApiController.getAllApisDegradationStatus);
router.post(
  "/:id/degradation/update",
  ApiController.updateApiDegradationStatus,
);

// Uptime
router.get("/:id/uptime", ApiController.getApiUptime);

// API Details
router.get("/:id", ApiController.getApiById);

module.exports = router;
