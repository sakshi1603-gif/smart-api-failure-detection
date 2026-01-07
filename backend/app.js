const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./route/Api.routes");
const { monitorAllAPIs } = require("./services/apiCaller.service");

dotenv.config();

const app = express();
const PORT  = 3000;

const startServer = async () => {
  await connectDB();          // connect DB first
  await monitorAllAPIs();     
};
startServer();
app.use(express.json());
app.use("/apis", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
