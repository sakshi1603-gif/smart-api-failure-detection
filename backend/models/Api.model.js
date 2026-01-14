const mongoose = require("mongoose");

const apiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  method: {
    type: String,
    default: "GET"
  },
  slaLatency: {
    type: Number,
    required: true
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
