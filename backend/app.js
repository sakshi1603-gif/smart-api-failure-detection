const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./route/Api.routes");

dotenv.config();

const app = express();
const PORT  = 3000;

app.use(express.json());
app.use("/apis", apiRoutes);

module.exports = app;
