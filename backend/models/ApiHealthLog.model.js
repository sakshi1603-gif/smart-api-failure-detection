const mongoose = require("mongoose");

const apiHealthLogSchema = new mongoose.Schema({
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Api",
    required: true,
  },

  statusCode: {
    type: Number,
    default: 0,
  },

  responseTime: {
    type: Number,
    default: 0,
  },

  isSuccess: {
    type: Boolean,
    default: false,
  },

  healthStatus: {
    type: String,
    enum: ["HEALTHY", "DEGRADED", "FAILED"],
    required: true,
  },

  failureType: {
    type: String,
    enum: [
      "NONE",
      "TIMEOUT",
      "NETWORK_ERROR",
      "CLIENT_ERROR",
      "SERVER_ERROR",
      "REDIRECT_ERROR",
      "SLA_BREACH",
      "BLOCKED_TARGET",
    ],
    default: "NONE",
  },

  isRetry: {
    type: Boolean,
    default: false,
  },

  retryAttempt: {
    type: Number,
    default: null,
  },

  checkedAt: {
    type: Date,
    default: Date.now,
  },
});

// Fast lookup of the latest logs for one API
apiHealthLogSchema.index({ apiId: 1, checkedAt: -1 });

// Auto-delete logs older than 30 days so the collection doesn't grow forever
apiHealthLogSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("ApiHealthLog", apiHealthLogSchema);