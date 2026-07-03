const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");

exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Start of today's date (00:00:00)
    const userApis = await Api.find({ owner: req.user._id }, "_id");

    const apiIds = userApis.map((api) => api._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ---------- API COLLECTION ----------
    const totalApis = await Api.countDocuments({
      owner: req.user._id,
    });

    const healthyApis = await Api.countDocuments({
      owner: req.user._id,
      currentHealthStatus: "HEALTHY",
    });

    const failedApis = await Api.countDocuments({
      owner: req.user._id,
      currentHealthStatus: "FAILED",
    });

    const slowApis = await Api.countDocuments({
      owner: req.user._id,
      currentHealthStatus: "SLOW",
    });

    const blockedApis = await Api.countDocuments({
      owner: req.user._id,
      currentHealthStatus: "BLOCKED",
    });

    // ---------- API HEALTH LOG COLLECTION ----------
    const dashboardStats = await ApiHealthLog.aggregate([
      {
        $match: {
          apiId: {
            $in: apiIds,
          },
          checkedAt: {
            $gte: today,
          },
        },
      },
      {
        $group: {
          _id: null,

          totalChecksToday: {
            $sum: 1,
          },

          totalFailuresToday: {
            $sum: {
              $cond: [{ $eq: ["$healthStatus", "FAILED"] }, 1, 0],
            },
          },

          successfulChecks: {
            $sum: {
              $cond: [
                {
                  $in: ["$healthStatus", ["HEALTHY", "SLOW"]],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = dashboardStats[0] || {
      totalChecksToday: 0,
      totalFailuresToday: 0,
      successfulChecks: 0,
    };

    const successRate =
      stats.totalChecksToday > 0
        ? ((stats.successfulChecks / stats.totalChecksToday) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      totalApis,
      healthyApis,
      failedApis,
      slowApis,
      blockedApis,

      totalChecksToday: stats.totalChecksToday,
      totalFailuresToday: stats.totalFailuresToday,
      successRate: Number(successRate),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch dashboard analytics",
    });
  }
};
