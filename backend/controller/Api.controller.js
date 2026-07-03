const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const Event = require("../models/ApiEventLog.model");

const mongoose = require("mongoose");
const {
  analyzeApiDegradation,
  analyzeAllApisDegradation,
  updateApiStatusBasedOnDegradation,
} = require("../services/degradationAnalyzer.service");
//POST /apis
exports.registerApi = async (req, res) => {
  try {
    const api = await Api.create({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "API registered successfully.",
      api,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//GET /apis
//GET /apis
exports.getApis = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {
      owner: req.user._id,
    };

    // Search by API name
    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by health status
    if (status) {
      query.currentHealthStatus = status;
    }

    const totalApis = await Api.countDocuments(query);

    const apis = await Api.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalApis,
      totalPages: Math.ceil(totalApis / limit),
      hasNextPage: page < Math.ceil(totalApis / limit),
      hasPrevPage: page > 1,
      apis,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    let { page = 1, limit = 10, status = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const userApis = await Api.find({ owner: req.user._id }, "_id");

    const apiIds = userApis.map((api) => api._id);

    const query = {
      apiId: {
        $in: apiIds,
      },
    };

    // Filter by status
    if (status) {
      query.toStatus = status;
    }

    const totalEvents = await Event.countDocuments(query);

    const events = await Event.find(query)
      .populate("apiId", "name url")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalEvents,
      totalPages: Math.ceil(totalEvents / limit),
      hasNextPage: page < Math.ceil(totalEvents / limit),
      hasPrevPage: page > 1,
      events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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
      checkedAt: new Date(),
    });

    // Update Api.currentHealthStatus based on result
    await Api.findByIdAndUpdate(
      apiId,
      {
        currentHealthStatus: result.healthStatus,
        degradationReason:
          result.healthStatus === "FAILED" ? "API FAILURE" : null,
      },
      { new: true },
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

    const api = await Api.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        message: "API not found.",
      });
    }
    const history = await ApiHealthLog.find({ apiId: id })
      .sort({ checkedAt: -1 })
      .limit(100);

    const enhancedHistory = history.map((log) => ({
      _id: log._id,
      healthStatus: log.healthStatus,
      statusCode: log.statusCode,
      responseTime: log.responseTime + "ms",
      failureType: log.failureType,
      isRetry: log.isRetry,
      retryAttempt: log.retryAttempt,
      checkedAt: log.checkedAt,
      label: log.isRetry ? `Retry #${log.retryAttempt}` : "Initial Check",
    }));

    return res.status(200).json({
      apiId: id,
      count: history.length,
      history: enhancedHistory,
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
    const api = await Api.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        message: "API not found.",
      });
    }

    // Get all retry attempts
    const retries = await ApiHealthLog.find({
      apiId: id,
      isRetry: true, // ✅ Only retry attempts
    })
      .sort({ checkedAt: -1 })
      .limit(50);

    // Stats
    const totalRetries = retries.length;
    const successfulRetries = retries.filter(
      (r) => r.healthStatus === "HEALTHY",
    ).length;
    const failedRetries = retries.filter(
      (r) => r.healthStatus === "FAILED",
    ).length;

    return res.status(200).json({
      apiId: id,
      apiName: api.name,
      apiUrl: api.url,
      retryStats: {
        totalRetries,
        successfulRetries,
        failedRetries,
        recoveryRate:
          totalRetries > 0
            ? ((successfulRetries / totalRetries) * 100).toFixed(2) + "%"
            : "N/A",
      },
      retryDetails: retries.map((r) => ({
        retryAttempt: r.retryAttempt,
        healthStatus: r.healthStatus,
        statusCode: r.statusCode,
        responseTime: r.responseTime + "ms",
        failureType: r.failureType,
        timestamp: r.checkedAt,
      })),
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
    const api = await Api.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        message: "API not found.",
      });
    }
    const degradationStatus = await analyzeApiDegradation(id);

    return res.status(200).json(degradationStatus);
  } catch (err) {
    console.error("getApiDegradationStatus error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch API degradation status" });
  }
};

//GET /apis/degradation/all - check degradation status of ALL APIs
exports.getAllApisDegradationStatus = async (req, res) => {
  try {
    const degradationReport = await analyzeAllApisDegradation();
    return res.status(200).json(degradationReport);
  } catch (err) {
    console.error("getAllApisDegradationStatus error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch APIs degradation status" });
  }
};

//POST /apis/:id/degradation/update - update API status based on degradation analysis
exports.updateApiDegradationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }
    const api = await Api.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        message: "API not found.",
      });
    }

    await updateApiStatusBasedOnDegradation(id);

    return res.status(200).json({
      success: true,
      message: "API degradation status updated successfully",
    });
    return res
      .status(200)
      .json({ message: "API degradation status updated successfully" });
  } catch (err) {
    console.error("updateApiDegradationStatus error:", err);
  }
};

//GET /apis/status/blocked - get all currently blocked APIs
exports.getBlockedApis = async (req, res) => {
  try {
    //   const blockedApis = await Api.find({
    //     currentHealthStatus: "BLOCKED",
    //     blockedUntil: { $gt: new Date() },
    //   }).select("name url blockedUntil degradationReason");
    const blockedApis = await Api.find({
      owner: req.user._id,
      currentHealthStatus: "BLOCKED",
      blockedUntil: { $gt: new Date() },
    });
    return res.status(200).json({
      count: blockedApis.length,
      blockedApis,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("getBlockedApis error:", err);
    return res.status(500).json({ error: "Failed to fetch blocked APIs" });
  }
};

//GET /apis/:id
exports.getApiById = async (req, res) => {
  try {
    const api = await Api.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        message: "API not found.",
      });
    }

    res.status(200).json({
      success: true,
      api,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//GET /apis/:id/uptime
exports.getApiUptime = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid API ID",
      });
    }

    const api = await Api.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!api) {
      return res.status(404).json({
        error: "API not found",
      });
    }

    async function calculateUptime(days) {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await ApiHealthLog.find({
        apiId: id,
        checkedAt: {
          $gte: fromDate,
        },
      });

      const totalChecks = logs.length;

      const healthyChecks = logs.filter(
        (log) => log.healthStatus === "HEALTHY",
      ).length;

      const failedChecks = logs.filter(
        (log) => log.healthStatus === "FAILED",
      ).length;

      const slowChecks = logs.filter(
        (log) => log.healthStatus === "SLOW",
      ).length;

      const uptime =
        totalChecks === 0
          ? 0
          : Number(((healthyChecks / totalChecks) * 100).toFixed(2));

      return {
        uptime,
        totalChecks,
        healthyChecks,
        failedChecks,
        slowChecks,
      };
    }

    const last24Hours = await calculateUptime(1);
    const last7Days = await calculateUptime(7);
    const last30Days = await calculateUptime(30);

    res.status(200).json({
      apiId: api._id,
      apiName: api.name,
      last24Hours,
      last7Days,
      last30Days,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
};
