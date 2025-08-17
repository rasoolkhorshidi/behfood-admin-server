const jwt = require("jsonwebtoken");

const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "توکن یافت نشد" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "توکن اشتباه است" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "توکن نامعتبر یا منقضی شده" });
  }
};

module.exports = verifyAccessToken;