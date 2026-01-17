const express = require("express");
const router = express.Router();
const ApiController = require("../controller/Api.controller");

//main API routes
router.post("/", ApiController.registerApi);
router.get("/", ApiController.getApis);

//history routes
router.get("/:id/history", ApiController.getApiHistory);
router.get("/:id/retry-history", ApiController.getRetryHistory);

//Blocked APIs routes
router.get("/status/blocked", ApiController.getBlockedApis);

//degradation analysis routes
router.get("/:id/degradation", ApiController.getApiDegradationStatus);
router.get("/degradation/all", ApiController.getAllApisDegradationStatus);
router.post("/:id/degradation/update", ApiController.updateApiDegradationStatus);

module.exports = router;