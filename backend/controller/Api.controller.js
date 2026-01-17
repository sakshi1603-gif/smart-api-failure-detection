const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const mongoose = require("mongoose");
const{
  analyzeApiDegradation,
  analyzeAllApisDegradation,
  updateApiStatusBasedOnDegradation
}=require("../services/degradationAnalyzer.service");
//POST /apis
exports.registerApi = async (req, res) => {
    try {
        const api = await Api.create(req.body);
        res.status(201).json(api);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//GET /apis
exports.getApis = async (req, res) => {
    const apis = await Api.find();
    res.status(200).json(apis);
};

// Utility function to log health check results
exports.logHealthCheck = async (apiId, result) => {
    try {
        const healthLog = await ApiHealthLog.create({
            apiId,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            healthStatus: result.healthStatus, // "HEALTHY", "SLOW", "FAILED"
            failureType: result.failureType || "NONE",
            checkedAt: new Date()
        });

        // Update Api.currentHealthStatus based on result
        await Api.findByIdAndUpdate(
            apiId,
            { currentHealthStatus: result.healthStatus,
              degradationReason: result.healthStatus === "FAILED" ? "API FAILURE" : null
            },
            { new: true }
        );
        return healthLog;
    } catch (error) {
        console.error("Error logging health check:", error);
        throw error;
    }
};

//GET /apis/:id/history
exports.getApiHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }

    const history = await ApiHealthLog.find({ apiId: id })
      .sort({ checkedAt: -1 })
      .limit(100);

    const enhancedHistory = history.map(log => ({
      _id: log._id,
      healthStatus: log.healthStatus,
      statusCode: log.statusCode,
      responseTime: log.responseTime + "ms",
      failureType: log.failureType,
      isRetry: log.isRetry,
      retryAttempt: log.retryAttempt,
      checkedAt: log.checkedAt,
      label: log.isRetry
        ? `Retry #${log.retryAttempt}`
        : "Initial Check"
    }));

    return res.status(200).json({
      apiId: id,
      count: history.length,
      history: enhancedHistory
    });
  } catch (err) {
    console.error("getApiHistoryEnhanced error:", err);
    return res.status(500).json({ error: "Failed to fetch API history" });
  }
};

//GET /apis/:id/retries
exports.getRetryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }

    // Get API details
    const api = await Api.findById(id);
    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }

    // Get all retry attempts
    const retries = await ApiHealthLog.find({ 
      apiId: id,
      isRetry: true  // ✅ Only retry attempts
    })
      .sort({ checkedAt: -1 })
      .limit(50);

    // Stats
    const totalRetries = retries.length;
    const successfulRetries = retries.filter(r => r.healthStatus === "HEALTHY").length;
    const failedRetries = retries.filter(r => r.healthStatus === "FAILED").length;

    return res.status(200).json({
      apiId: id,
      apiName: api.name,
      apiUrl: api.url,
      retryStats: {
        totalRetries,
        successfulRetries,
        failedRetries,
        recoveryRate: totalRetries > 0 
          ? ((successfulRetries / totalRetries) * 100).toFixed(2) + "%"
          : "N/A"
      },
      retryDetails: retries.map(r => ({
        retryAttempt: r.retryAttempt,
        healthStatus: r.healthStatus,
        statusCode: r.statusCode,
        responseTime: r.responseTime + "ms",
        failureType: r.failureType,
        timestamp: r.checkedAt
      }))
    });
  } catch (err) {
    console.error("getRetryHistory error:", err);
    return res.status(500).json({ error: "Failed to fetch retry history" });
  }
};

//GET /apis/:id/degradation - check degradation status of single API
exports.getApiDegradationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }

    const degradationStatus = await analyzeApiDegradation(id);

    return res.status(200).json(degradationStatus);
  } catch (err) {
    console.error("getApiDegradationStatus error:", err);
    return res.status(500).json({ error: "Failed to fetch API degradation status" });
  }
};

//GET /apis/degradation/all - check degradation status of ALL APIs
exports.getAllApisDegradationStatus = async (req, res) => {
  try {
    const degradationReport = await analyzeAllApisDegradation();
    return res.status(200).json(degradationReport);
  } catch (err) {
    console.error("getAllApisDegradationStatus error:", err);
    return res.status(500).json({ error: "Failed to fetch APIs degradation status" });
  }
};

//POST /apis/:id/degradation/update - update API status based on degradation analysis
exports.updateApiDegradationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }
    await updateApiStatusBasedOnDegradation(id);
    return res.status(200).json({ message: "API degradation status updated successfully" });
  } catch (err) {
    console.error("updateApiDegradationStatus error:", err);
    return res.status(500).json({ error: "Failed to update API degradation status" });
  }
};

//GET /apis/status/blocked - get all currently blocked APIs
exports.getBlockedApis = async (req, res) => {
  try {
    const blockedApis = await Api.find({
      currentHealthStatus: "BLOCKED",
      blockedUntil: { $gt: new Date() }
    }).select("name url blockedUntil degradationReason");

    return res.status(200).json({
      count: blockedApis.length,
      blockedApis,
      timestamp: new Date()
    });
  } catch (err) {
    console.error("getBlockedApis error:", err);
    return res.status(500).json({ error: "Failed to fetch blocked APIs" });
  }
};