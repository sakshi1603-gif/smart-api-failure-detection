const express = require("express");
const router = express.Router();

const {
  getDashboardAnalytics,
} = require("../controller/analytics.controller");

router.get("/dashboard", getDashboardAnalytics);

module.exports = router;