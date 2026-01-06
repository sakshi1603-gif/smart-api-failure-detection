const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dblink = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.l1a6euh.mongodb.net/api-monitor?retryWrites=true&w=majority`;

    await mongoose.connect(dblink);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
