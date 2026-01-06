const express = require("express");
const router = express.Router();
const ApiController = require("../controller/Api.controller");

router.post("/", ApiController.registerApi);
router.get("/", ApiController.getApis);

module.exports = router;