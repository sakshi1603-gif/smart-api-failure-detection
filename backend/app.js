const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const PORT = 3000;

connectDB();

app.get("/", (req, res) => {
  res.send("Smart API Failure Detection System is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
