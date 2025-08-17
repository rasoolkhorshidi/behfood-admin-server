const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB                     

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Admin-DB Connected...");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
