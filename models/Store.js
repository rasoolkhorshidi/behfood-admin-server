const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "ShopType", required: true },
    address: { type: String, required: true },
    phone: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    discount: { type: Number, default: 0 },
    discountDescription: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;
