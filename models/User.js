const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, minlength: 3, maxlength: 20 },
    family: { type: String, trim: true, minlength: 3, maxlength: 20 },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      length: 11,
      validate: {
        validator: function (v) {
          return /^09\d{9}$/.test(v);
        },
        message: (props) => `${props.value} شماره موبایل معتبر نیست!`,
      },
    },
    type: {
      type: String,
      enum: ["user", "store", "driver"],
      default: "user",
    },
    token: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
