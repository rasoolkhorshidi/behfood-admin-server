const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const connectDB = require("../utils/db");

// Connect to the database
connectDB();

// Create an admin user
(async () => {
  const hashed = await bcrypt.hash("123456", 10);
  const admin = new Admin({
    name: "مدیر اصلی",
    phone: "09999999999",
    password: hashed,
  });

  await admin.save();
  console.log("✅ ادمین ساخته شد");
  process.exit();
})();
