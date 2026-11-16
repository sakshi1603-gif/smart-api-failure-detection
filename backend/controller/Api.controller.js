const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const Event = require("../models/ApiEventLog.model");

const mongoose = require("mongoose");
const {
  analyzeApiDegradation,
  analyzeAllApisDegradation,
} = require("../services/degradationAnalyzer.service");
const { assertPublicHost } = require("../utils/ssrfGuard");

const DEMO_EMAIL = "demo@smartapi.com";
const MAX_APIS = Number(process.env.MAX_APIS_PER_USER || 10);
const SLA_MIN = 50;
const SLA_MAX = 5000; // = check timeout; a higher SLA could never trigger
const STATUSES = ["PENDING", "HEALTHY", "DEGRADED", "FAILED", "BLOCKED"];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function validateApiInput({ name, url, slaLatency }) {
  const errors = [];

  const cleanName = String(name || "").trim();
  if (!cleanName) errors.push("Name is required.");

  let raw = String(url || "").trim();
  if (raw && !/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = "https://" + raw;

  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch {
    errors.push("Enter a valid URL, e.g. https://api.example.com/health");
  }

  if (parsed) {
    if (!["http:", "https:"].includes(parsed.protocol)) {
      errors.push("Only http:// and https:// URLs are supported.");
    }
    try {
      assertPublicHost(parsed.hostname);
    } catch {
      errors.push("That address is private or not allowed.");
    }
  }

  const sla = Number(slaLatency);
  if (!Number.isFinite(sla) || sla < SLA_MIN || sla > SLA_MAX) {
    errors.push(`SLA must be between ${SLA_MIN} and ${SLA_MAX} ms.`);
  }

  return {
    errors,
    value: {
      name: cleanName,
      url: parsed ? parsed.toString() : raw,
      slaLatency: sla,
    },
  };
}

//POST /apis
exports.registerApi = async (req, res) => {
  try {
    if (req.user.email === DEMO_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Adding APIs is disabled in demo mode.",
      });
    }

    const { errors, value } = validateApiInput(req.body);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors[0], errors });
    }

    const existing = await Api.countDocuments({ owner: req.user._id });
    if (existing >= MAX_APIS) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: you can monitor up to ${MAX_APIS} APIs.`,
      });
    }

    // Only whitelisted fields: users can't set status, blockedUntil, isActive...
    const api = await Api.create({
      name: value.name,
      url: value.url,
      slaLatency: value.slaLatency,
      method: "GET",
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "API registered successfully.",
      api,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already monitoring this URL.",
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//GET /apis
exports.getApis = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status = "" } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));

    const query = {
      owner: req.user._id,
    };

    // Search by API name (escaped: user input is never used as a raw regex)
    if (search) {
      query.name = {
        $regex: escapeRegex(String(search)),
        $options: "i",
      };
    }

    // Filter by health status
    if (STATUSES.includes(status)) {
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

//DELETE /apis/:id
exports.deleteApi = async (req, res) => {
  try {
    // Demo visitors share one workspace, so they can't delete from it
    if (req.user.email === DEMO_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Deleting is disabled in demo mode.",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid API ID" });
    }

    const api = await Api.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!api) {
      return res.status(404).json({ success: false, message: "API not found." });
    }

    // Remove this API's history and events too
    await Promise.all([
      ApiHealthLog.deleteMany({ apiId: id }),
      Event.deleteMany({ apiId: id }),
    ]);

    res.status(200).json({ success: true, message: "API deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//GET /apis/events
exports.getEvents = async (req, res) => {
  try {
    let { page = 1, limit = 10, status = "" } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));

    const userApis = await Api.find({ owner: req.user._id }, "_id");

    const apiIds = userApis.map((api) => api._id);

    const query = {
      apiId: {
        $in: apiIds,
      },
    };

    // Filter by status
    if (STATUSES.includes(status)) {
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
    console.error("getApiHistory error:", err);
    return res.status(500).json({ error: "Failed to fetch API history" });
  }
};

//GET /apis/:id/retry-history
exports.getRetryHistory = async (req, res) => {
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

    const retries = await ApiHealthLog.find({
      apiId: id,
      isRetry: true,
    })
      .sort({ checkedAt: -1 })
      .limit(50);

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

//GET /apis/:id/degradation
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

//GET /apis/degradation/all (scoped to the logged-in user)
exports.getAllApisDegradationStatus = async (req, res) => {
  try {
    const degradationReport = await analyzeAllApisDegradation(req.user._id);
    return res.status(200).json(degradationReport);
  } catch (err) {
    console.error("getAllApisDegradationStatus error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch APIs degradation status" });
  }
};

//GET /apis/status/blocked
exports.getBlockedApis = async (req, res) => {
  try {
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid API ID" });
    }

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

    // Counted in the database (no loading every log into memory).
    // Retry checks are excluded so they don't skew uptime.
    // Uptime = share of checks that were not FAILED.
    async function calculateUptime(days) {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const rows = await ApiHealthLog.aggregate([
        {
          $match: {
            apiId: new mongoose.Types.ObjectId(id),
            checkedAt: { $gte: fromDate },
            isRetry: { $ne: true },
          },
        },
        { $group: { _id: "$healthStatus", count: { $sum: 1 } } },
      ]);

      const c = Object.fromEntries(rows.map((r) => [r._id, r.count]));
      const healthyChecks = c.HEALTHY || 0;
      const degradedChecks = (c.DEGRADED || 0) + (c.SLOW || 0);
      const failedChecks = c.FAILED || 0;
      const totalChecks = healthyChecks + degradedChecks + failedChecks;

      const uptime =
        totalChecks === 0
          ? 0
          : Number((((totalChecks - failedChecks) / totalChecks) * 100).toFixed(2));

      return { uptime, totalChecks, healthyChecks, degradedChecks, failedChecks };
    }

    const [last24Hours, last7Days, last30Days] = await Promise.all([
      calculateUptime(1),
      calculateUptime(7),
      calculateUptime(30),
    ]);

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