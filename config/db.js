const mongoose = require("mongoose");
const { getEnv, isDevelopment } = require("./env");

async function connectDB() {
  const { MONGODB_URI } = getEnv();

  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);

  if (isDevelopment()) {
    console.log("MongoDB connected");
  }
}

module.exports = { connectDB };

