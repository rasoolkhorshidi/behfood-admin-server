const express = require("express");
const router = express.Router();
const {
  listBackups,
  createBackup,
  downloadBackup,
} = require("../controllers/backups.controller");

router.get("/", listBackups);
router.post("/", createBackup);
router.get("/:id/download", downloadBackup);

module.exports = router;
