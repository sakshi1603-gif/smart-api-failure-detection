const mongoose = require("mongoose");

const apiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/).+/.test(v);
      },
      message: "Please provide a valid URL"
    }
  },
  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE"],
    default: "GET"
  },
  slaLatency: {
    type: Number,
    required: true,
    min: 0
  },

  currentHealthStatus: {
    type: String,
    enum: ["HEALTHY", "SLOW", "FAILED", "DEGRADED", "BLOCKED"],
    default: "HEALTHY"
  },

  degradationReason: {
    type: String,
    default: null
  },

  blockedUntil: {
    type: Date,
    default: null
  },

  isActive: { // Whether the API is actively monitored
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//indexes for efficient querying
apiSchema.index({ currentHealthStatus: 1 });
apiSchema.index({ isActive: 1 });

module.exports = mongoose.model("Api", apiSchema);
