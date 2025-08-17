const Store = require("../models/Store");

exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find().populate("owner", "name family phone");
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت فروشگاه‌ها", error: err.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { name, type, address, phone, owner } = req.body;
    const store = new Store({ name, type, address, phone, owner });
    await store.save();
    res.status(201).json(store);
  } catch (err) {
    res.status(500).json({ message: "خطا در ایجاد فروشگاه", error: err.message });
  }
};
