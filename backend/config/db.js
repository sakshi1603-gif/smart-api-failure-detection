const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dblink = "mongodb+srv://rushabhkulkarni0915_db_user:BrYhJSqe0EnVUFHa@cluster0.bcwgwjc.mongodb.net/?appName=Cluster0";


    await mongoose.connect(dblink);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
