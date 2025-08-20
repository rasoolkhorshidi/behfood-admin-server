const express = require("express");
const cors = require("cors");
const connectDB = require("./utils/db");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const verifyAccessToken = require("./middleware/auth");
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", verifyAccessToken, require("./routes/admin.routes"));
app.use("/api/users", verifyAccessToken, require("./routes/users.routes"));
app.use("/api/stores", verifyAccessToken, require("./routes/stores.routes"));
app.use("/api/orders", verifyAccessToken, require("./routes/orders.routes"));
app.use("/api/products", require("./routes/products.routes"));


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Admin Server running on port ${PORT}`));
