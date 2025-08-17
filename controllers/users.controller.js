const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت کاربران", error: err.message });
  }
};
