const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole } = require("../controllers/users.controller");

router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);

module.exports = router;