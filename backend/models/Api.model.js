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
    enum: ["HEALTHY", "DEGRADED"],
    default: "HEALTHY"
  },
  degradationReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Api", apiSchema);
