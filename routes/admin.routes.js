const express = require("express");
const router = express.Router();
const {getProfile} = require("../controllers/admin.controller");


router.get("/profile", getProfile );

module.exports = router;