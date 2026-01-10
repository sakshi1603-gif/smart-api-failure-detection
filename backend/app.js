const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./route/Api.routes");
require("./cron/monitor.cron");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/apis", apiRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
  }
}


startServer();