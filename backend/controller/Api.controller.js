const Api = require("../models/Api.model");
const logHealthCheck = require("../utils/healthLogger");

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