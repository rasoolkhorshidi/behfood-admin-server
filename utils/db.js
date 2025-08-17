const mongoose = require("mongoose");
const config = require("config");

const dbConfig = config.get("database");

async function connectDB() {
  try {
    await mongoose.connect(dbConfig.url);
    console.log("✅ Admin-DB Connected...");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
