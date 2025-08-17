const express = require("express");
const router = express.Router();
const { getStores, createStore } = require("../controllers/stores.controller");

router.get("/", getStores);
router.post("/", createStore);

module.exports = router;
