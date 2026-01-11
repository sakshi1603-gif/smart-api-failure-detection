const axios = require("axios");
const ApiModel = require("../models/Api.model");
const ApiHealthLog = require("../models/ApiHealthLog.model");

const TIMEOUT = 5000; // 5 seconds

async function monitorAllAPIs() {
  const apis = await ApiModel.find();

  for (const api of apis) {
    const start = Date.now();

    try {
      const response = await axios({
        method: api.method,
        url: api.url,
        timeout: TIMEOUT  //HOW LONG to wait for an API response
      });

      const responseTime = Date.now() - start;

      //save last check 
      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: response.status,
        responseTime,
        isSuccess:true
      });

      console.log(api.url,"→",responseTime + "ms","→", response.status);

    } catch (err) {
      const responseTime = Date.now() - start;

      await ApiHealthLog.create({
        apiId: api._id,
        statusCode: err.response?.status || 0,
        responseTime,
        isSuccess:false
      });

      console.log(api.url,"→",responseTime + "ms","→ FAILED");
    }
  }
}

module.exports = { monitorAllAPIs };
