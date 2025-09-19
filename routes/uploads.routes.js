const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploads.controller");

// single file upload
router.post("/", uploadController.uploadImage);
router.delete("/:filename", uploadController.deleteImage);

module.exports = router;
