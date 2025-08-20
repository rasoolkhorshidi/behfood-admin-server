const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");
const rateLimit = require("express-rate-limit");
const { sendOTP } = require("../utils/sms");

// محدودیت درخواست
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 5 minutes.",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  headers: true, // Include rate limit info in response headers
});

// مرحله ۱: یوزرنیم و پسورد
router.post("/login", loginLimiter, async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ message: "username و password الزامی است" });
  }

  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).json({ message: "کاربر یافت نشد" });

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) return res.status(400).json({ message: "پسورد اشتباه" });

  // تولید OTP
  const otp = authenticator.generate(admin.username);
  admin.otp = otp;
  admin.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 دقیقه
  await admin.save();

  await sendOTP(admin.phone, otp);

  res.json({ phone: admin.phone, message: "کد یکبارمصرف ارسال شد" });
});

// مرحله ۲: تایید OTP و صدور JWT
router.post("/verify-otp", async (req, res) => {
  if (!req.body || !req.body.username || !req.body.otp) {
    return res.status(400).json({ message: "username و otp الزامی است" });
  }

  const { username, otp } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).json({ message: "کاربر یافت نشد" });

  if (!admin.otp || admin.otpExpires < new Date())
    return res.status(400).json({ message: "کد OTP منقضی شده" });

  // const isValid = authenticator.check(String(otp), String(admin.otp));
  // if (!isValid) return res.status(400).json({ message: "کد OTP اشتباه است" });

  if (otp !== admin.otp) {
    return res.status(400).json({ message: "کد OTP اشتباه است" });
  }

  // پاک کردن OTP بعد از تایید
  admin.otp = null;
  admin.otpExpires = null;
  await admin.save();
  console.log("OTP verified successfully");

  const accessToken = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  const refreshToken = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ accessToken });
});

// روت Refresh Token
router.post("/refresh-token", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "توکن یافت نشد" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: "توکن منقضی یا نامعتبر است" });
  }
});

module.exports = router;
