const express = require("express");
const cors = require("cors");
const config = require("config");
const connectDB = require("./utils/db");

const app = express();
app.use(cors());
app.use(express.json());

// DB
connectDB();

// Routes
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/stores", require("./routes/stores.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/auth", require("./routes/auth.routes"));


const PORT = config.get("server.port") || 5001;
app.listen(PORT, () => console.log(`🚀 Admin Server running on port ${PORT}`));
