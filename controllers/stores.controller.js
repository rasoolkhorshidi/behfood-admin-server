const Store = require("../models/Store");

// Return stores shaped for the React front-end
exports.getStores = async (req, res) => {
  try {
    // populate owner and type so we can return human-friendly fields
    const stores = await Store.find()
      .populate("owner", "name family phone")
      .populate("type", "name");

    const shaped = stores.map((s) => ({
      _id: s._id,
      name: s.name,
      // ownerName expected by front-end: combine name + family when available
      ownerName: s.owner
        ? `${s.owner.name || ""} ${s.owner.family || ""}`.trim()
        : null,
      phone: s.phone || (s.owner && s.owner.phone) || "",
      // category expected by front-end — use populated type name when present
      category: s.type ? s.type.name : s.type || "",
      address: s.address,
      // status: map boolean isActive to a human readable string
      status:
        typeof s.isActive === "boolean"
          ? s.isActive
            ? "فعال"
            : "غیرفعال"
          : undefined,
      // put extra fields under specs so front-end can display technical details
      specs: {
        discount: s.discount,
        discountDescription: s.discountDescription,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        type: s.type ? { _id: s.type._id, name: s.type.name } : s.type,
        owner: s.owner
          ? {
              _id: s.owner._id,
              name: s.owner.name,
              family: s.owner.family,
              phone: s.owner.phone,
            }
          : s.owner,
      },
    }));

    res.json(shaped);
  } catch (err) {
    res
      .status(500)
      .json({ message: "خطا در دریافت فروشگاه‌ها", error: err.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { name, type, address, phone, owner } = req.body;
    const store = new Store({ name, type, address, phone, owner });
    await store.save();
    res.status(201).json(store);
  } catch (err) {
    res
      .status(500)
      .json({ message: "خطا در ایجاد فروشگاه", error: err.message });
  }
};
