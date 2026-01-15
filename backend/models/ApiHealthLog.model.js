const mongoose = require("mongoose");


const apiHealthLogSchema = new mongoose.Schema({
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Api",
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  isSuccess: {
    type: Boolean,
    default: function() {
      return this.statusCode >= 200 && this.statusCode < 400; //Automatically set based on statusCode
    }
  },

  healthStatus: {
    type: String,
    enum: ["FAILED", "SLOW", "HEALTHY"],
    required: true
  },
  failureType: {
    type: String,
    enum: ["NONE", "TIMEOUT", "SERVER_ERROR"],
    default: "NONE"
  },
  retryAttempt: {
    type: Number,
    default: 0
  },
  isRetry: {
    type: Boolean,
    default: false
  },
  checkedAt: {
    type: Date,
    default: Date.now
  }
});

//Add indexes for efficient querying
apiHealthLogSchema.index({ apiId: 1, checkedAt: -1 });
apiHealthLogSchema.index({ healthStatus: 1 });
apiHealthLogSchema.index({ failureType: 1 });

const ApiHealthLog = mongoose.model("ApiHealthLog", apiHealthLogSchema);

module.exports = ApiHealthLog;
