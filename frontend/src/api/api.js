import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://smart-api-failure-detection.onrender.com/apis"
      : "http://localhost:5000/apis",
});

export default api;