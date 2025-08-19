// models/ShopType.js
const mongoose = require('mongoose');

const shopTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ShopType = mongoose.model('ShopType', shopTypeSchema);

module.exports = ShopType;