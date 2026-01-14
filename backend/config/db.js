const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dblink = "";


    await mongoose.connect(dblink);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
