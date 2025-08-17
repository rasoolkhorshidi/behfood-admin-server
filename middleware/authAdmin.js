const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ message: "دسترسی غیرمجاز" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    if (decoded.role !== "admin")
      return res.status(403).json({ message: "شما ادمین نیستید!" });

    req.admin = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "توکن نامعتبر است" });
  }
};
