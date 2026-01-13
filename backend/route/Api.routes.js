const express = require("express");
const router = express.Router();
const ApiController = require("../controller/Api.controller");


router.post("/", ApiController.registerApi);
router.get("/", ApiController.getApis);
router.get("/:id/history", ApiController.getApiHistory);

module.exports = router;