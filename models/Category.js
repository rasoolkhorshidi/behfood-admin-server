const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  shopType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopType',
    required: true
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;