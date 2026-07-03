const mongoose = require("mongoose");

const apiSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/).+/.test(v);
        },
        message: "Please provide a valid URL",
      },
    },

    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE"],
      default: "GET",
    },

    slaLatency: {
      type: Number,
      required: true,
      min: 0,
    },

    currentHealthStatus: {
      type: String,
      enum: ["HEALTHY", "SLOW", "FAILED", "DEGRADED", "BLOCKED"],
      default: "HEALTHY",
    },

    degradationReason: {
      type: String,
      default: null,
    },

    blockedUntil: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

apiSchema.index({ owner: 1 });

apiSchema.index({ currentHealthStatus: 1 });
apiSchema.index({ isActive: 1 });
apiSchema.index({ owner: 1, url: 1 }, { unique: true });

module.exports = mongoose.model("Api", apiSchema);
