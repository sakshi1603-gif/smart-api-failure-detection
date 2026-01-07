const mongoose = require("mongoose");

const apiHealthLogSchema = new mongoose.Schema({
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "api",
    required: true
  },
  statusCode: Number,
  responseTime: Number,
  isSuccess: Boolean,
  checkedAt: {
    type: Date,
    default: Date.now
  }
});

const ApiHealthLog = mongoose.model("ApiHealthLog", apiHealthLogSchema);

module.exports = ApiHealthLog;