const Api = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");
const mongoose = require("mongoose");

//POST /apis
exports.registerApi = async (req, res) => {
    try {
        const api = await Api.create(req.body);
        res.status(201).json(api);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//GET /apis
exports.getApis = async (req, res) => {
    const apis = await Api.find();
    res.status(200).json(apis);
};

exports.updateLastCheck = async (apiId, result) => {
  const api = await Api.findByIdAndUpdate(
    apiId,
    {
      lastCheck: {
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        success: result.success,
        checkedAt: new Date()
      }
    },
    { new: true }
  );

  if (api) {
    logHealthCheck(api.name, result);
  }
};

exports.getApiHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // basic validation (important)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid API ID" });
    }

    const history = await ApiHealthLog.find({ apiId: id })
      .sort({ checkedAt: -1 });

    return res.status(200).json({
      apiId: id,
      count: history.length,
      history
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch API history" });
  }
};