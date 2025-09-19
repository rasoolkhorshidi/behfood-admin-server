const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


const Admin = require("../models/Admin");

const connectDB = require("../utils/db");

// Connect to the database
connectDB();

// Create an admin user
(async () => {
  const admin = new Admin({
    username: "Behnaz",
    password: "1234",
    phone: "09371420384",
  });

  await admin.save();
  console.log("✅ ادمین ساخته شد");
  process.exit();
})();
