const Api = require("../models/Api.model");

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
// SLA = Service Level Agreement The maximum response time that an API is allowed to take, as promised in an SLA.