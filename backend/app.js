require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./route/auth");
const apiRoutes = require("./route/Api.routes");
const analyticsRoutes = require("./route/analytics.routes");

// Start cron jobs
require("./cron/monitor.cron");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/apis", apiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Example protected route
// const protect = require("./middleware/auth");
// app.use("/api/monitoring", protect, monitoringRoutes);

// Connect DB & Start Server
async function startServer() {
  try {
    await connectDB();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();