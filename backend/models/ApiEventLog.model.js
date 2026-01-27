const mongoose = require("mongoose");

const ApiEventLogSchema = new mongoose.Schema({
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Api",
    required: true
  },

  fromStatus: String,
  toStatus: String,

  reason: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ApiEventLog", ApiEventLogSchema);
