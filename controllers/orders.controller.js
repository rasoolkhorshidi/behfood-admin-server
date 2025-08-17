const Order = require("../models/Order");

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name family phone")
      .populate("store", "name type")
      .populate("courier", "name family phone");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت سفارش‌ها", error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customer, store, courier, items, totalPrice } = req.body;
    const order = new Order({ customer, store, courier, items, totalPrice });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "خطا در ایجاد سفارش", error: err.message });
  }
};
