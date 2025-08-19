const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت کاربران", error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!["user", "store", "driver"].includes(type)) {
      return res.status(400).json({ message: "نقش نامعتبر" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { type },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ 
      message: "خطا در بروزرسانی نقش کاربر",
      error: err.message 
    });
  }
};
