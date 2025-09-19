const Product = require("../models/Product");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const ShopType = require("../models/ShopType");
const path = require("path");
const fs = require("fs");

// Helper: normalize image url/path so we store only the path (no origin)
function normalizeImagePath(u) {
  if (!u && u !== "") return u;
  try {
    // if it's an absolute URL, URL constructor will work
    const parsed = new URL(u);
    // keep pathname and search (if any) so stored value is like /uploads/xxx.jpg
    return parsed.pathname + (parsed.search || "");
  } catch (e) {
    // not an absolute URL, ensure it starts with /
    if (typeof u === "string" && u.length > 0)
      return u.startsWith("/") ? u : `/${u}`;
    return u || "";
  }
}

// Safely delete a file under public/uploads if it exists and the path points there.
function deleteUploadFile(u) {
  try {
    if (!u) return false;
    // extract pathname if full url
    let p = u;
    try {
      const parsed = new URL(u);
      p = parsed.pathname;
    } catch (e) {
      // not absolute URL, use as-is
    }

    // ensure path points to /uploads/...
    if (!p.startsWith("/uploads/")) {
      // allow also 'uploads/...' without leading slash
      if (p.startsWith("uploads/")) p = "/" + p;
      else return false;
    }

    const uploadsDir = path.join(__dirname, "..", "public", "uploads");
    const filename = path.basename(p);
    const filePath = path.join(uploadsDir, filename);

    // ensure resolved path inside uploadsDir
    if (!filePath.startsWith(uploadsDir)) return false;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    // swallow errors, return false
    return false;
  }
}

// دریافت تمام محصولات
exports.getProducts = async (req, res) => {
  try {
    const { shopType, category, subcategory, store } = req.query;

    const filter = {};
    if (shopType) filter.shopType = shopType;
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    const products = await Product.find(filter)
      .populate("shopType", "name")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "خطا در دریافت محصولات",
      error: err.message,
    });
  }
};

// ایجاد محصول جدید
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      images,
      isActive,
      shopType,
      category,
      subcategory,
    } = req.body;
    // اعتبارسنجی وجود shopType، category و subcategory
    const [shopTypeExists, categoryExists, subcategoryExists] =
      await Promise.all([
        ShopType.findById(shopType),
        Category.findById(category),
        Subcategory.findById(subcategory),
      ]);

    if (!shopTypeExists) {
      return res.status(400).json({ message: "نوع فروشگاه یافت نشد" });
    }

    if (!categoryExists) {
      return res.status(400).json({ message: "دسته‌بندی یافت نشد" });
    }

    if (!subcategoryExists) {
      return res.status(400).json({ message: "زیردسته‌بندی یافت نشد" });
    }

    // اعتبارسنجی ارتباط بین موجودیت‌ها
    if (categoryExists.shopType.toString() !== shopType) {
      return res
        .status(400)
        .json({ message: "دسته‌بندی متعلق به این نوع فروشگاه نیست" });
    }

    if (subcategoryExists.category.toString() !== category) {
      return res
        .status(400)
        .json({ message: "زیردسته‌بندی متعلق به این دسته‌بندی نیست" });
    }

    const normalizedImages = Array.isArray(images)
      ? images.map((i) => normalizeImagePath(i))
      : images
      ? [normalizeImagePath(images)]
      : [];

    const product = new Product({
      name,
      description,
      images: normalizedImages,
      isActive,
      shopType,
      category,
      subcategory,
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ایجاد محصول",
      error: err.message,
    });
  }
};

// دریافت سلسله مراتب محصولات
exports.getProductHierarchy = async (req, res) => {
  try {
    const shopTypes = await ShopType.find({ isActive: true });
    const hierarchy = await Promise.all(
      shopTypes.map(async (shopType) => {
        const categories = await Category.find({
          shopType: shopType._id,
          isActive: true,
        });

        const categoriesWithSubs = await Promise.all(
          categories.map(async (category) => {
            const subcategories = await Subcategory.find({
              category: category._id,
              isActive: true,
            });
            return {
              ...category.toObject(),
              subcategories,
            };
          })
        );

        return {
          ...shopType.toObject(),
          categories: categoriesWithSubs,
        };
      })
    );

    res.json(hierarchy);
  } catch (err) {
    res.status(500).json({
      message: "خطا در دریافت سلسله مراتب محصولات",
      error: err.message,
    });
  }
};

// دریافت انواع فروشگاه
exports.getShopType = async (req, res) => {
  try {
    const shopTypes = await ShopType.find();
    res.json(shopTypes);
  } catch (err) {
    res.status(500).json({
      message: "خطا در دریافت دسته‌بندی‌ها",
      error: err.message,
    });
  }
};

// دریافت دسته‌بندی‌ها بر اساس نوع فروشگاه
exports.getCategories = async (req, res) => {
  try {
    const { shopType } = req.query;
    const categories = await Category.find({ shopType });
    res.json(categories);
  } catch (err) {
    res.status(500).json({
      message: "خطا در دریافت دسته‌بندی‌ها",
      error: err.message,
    });
  }
};

// دریافت زیردسته‌بندی‌ها بر اساس دسته‌بندی
exports.getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;
    const subcategories = await Subcategory.find({ category });
    res.json(subcategories);
  } catch (err) {
    res.status(500).json({
      message: "خطا در دریافت زیردسته‌بندی‌ها",
      error: err.message,
    });
  }
};

// مدیریت نوع فروشگاه‌ها
exports.createShopType = async (req, res) => {
  try {
    const { name, isActive = true, image, imageUrl, imagePath } = req.body;
    // prefer explicit fields in this order
    const finalImage = imageUrl || image || imagePath || "";
    // جلوگیری از ثبت نام تکراری (بدون حساسیت به حروف بزرگ/کوچک)
    if (name) {
      const existing = await ShopType.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "نام نوع فروشگاه قبلاً استفاده شده است" });
      }
    }
    const shopType = new ShopType({
      name,
      isActive,
      imageUrl: normalizeImagePath(finalImage),
    });
    await shopType.save();

    res.status(201).json(shopType);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ایجاد نوع فروشگاه",
      error: err.message,
    });
  }
};

exports.updateShopType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, image, imageUrl, imagePath } = req.body;
    const finalImage = imageUrl || image || imagePath;

    // اگر کاربر نام جدید فرستاد، جلوگیری از تکراری بودن نام (غیرهم‌نام با رکورد فعلی)
    if (name) {
      const duplicate = await ShopType.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(400).json({
          message: "نام انتخاب شده برای نوع فروشگاه قبلاً استفاده شده است",
        });
      }
    }

    const existing = await ShopType.findById(id);
    if (!existing)
      return res.status(404).json({ message: "نوع فروشگاه یافت نشد" });

    const update = { name, isActive };
    if (typeof finalImage !== "undefined")
      update.imageUrl = normalizeImagePath(finalImage);

    const shopType = await ShopType.findByIdAndUpdate(id, update, {
      new: true,
    });

    // if image changed, delete old uploaded file
    if (typeof finalImage !== "undefined") {
      const old = existing.imageUrl;
      const newVal = update.imageUrl;
      if (old && old !== newVal) deleteUploadFile(old);
    }

    if (!shopType) {
      return res.status(404).json({ message: "نوع فروشگاه یافت نشد" });
    }

    res.json(shopType);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ویرایش نوع فروشگاه",
      error: err.message,
    });
  }
};

// به‌روزرسانی محصول
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      images,
      isActive,
      shopType,
      category,
      subcategory,
    } = req.body;

    // validate relations if provided
    if (shopType) {
      const shopTypeExists = await ShopType.findById(shopType);
      if (!shopTypeExists)
        return res.status(400).json({ message: "نوع فروشگاه یافت نشد" });
    }
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists)
        return res.status(400).json({ message: "دسته‌بندی یافت نشد" });
    }
    if (subcategory) {
      const subcategoryExists = await Subcategory.findById(subcategory);
      if (!subcategoryExists)
        return res.status(400).json({ message: "زیردسته‌بندی یافت نشد" });
    }

    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ message: "محصول یافت نشد" });

    const update = {
      name,
      description,
      isActive,
      shopType,
      category,
      subcategory,
    };
    if (Array.isArray(images))
      update.images = images.map((i) => normalizeImagePath(i));

    const product = await Product.findByIdAndUpdate(id, update, { new: true });

    // if images changed, delete any removed files from uploads
    if (Array.isArray(images)) {
      const oldImages = Array.isArray(existing.images) ? existing.images : [];
      const newImages = Array.isArray(product.images) ? product.images : [];
      // delete files that were in oldImages but not in newImages
      oldImages.forEach((old) => {
        if (!newImages.includes(old)) deleteUploadFile(old);
      });
    }

    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "خطا در ویرایش محصول", error: err.message });
  }
};

// حذف محصول
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "محصول یافت نشد" });

    // delete associated upload files
    if (Array.isArray(product.images)) {
      product.images.forEach((i) => deleteUploadFile(i));
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: "محصول با موفقیت حذف شد" });
  } catch (err) {
    res.status(500).json({ message: "خطا در حذف محصول", error: err.message });
  }
};

exports.deleteShopType = async (req, res) => {
  try {
    const { id } = req.params;

    // بررسی وجود دسته‌بندی‌های وابسته
    const categories = await Category.find({ shopType: id });
    if (categories.length > 0) {
      return res.status(400).json({
        message: "امکان حذف وجود ندارد. ابتدا دسته‌بندی‌های وابسته را حذف کنید",
      });
    }

    const shopType = await ShopType.findById(id);
    if (!shopType)
      return res.status(404).json({ message: "نوع فروشگاه یافت نشد" });


    // delete associated image if any
    if (shopType.imageUrl) deleteUploadFile(shopType.imageUrl);

    await ShopType.findByIdAndDelete(id);
    res.json({ message: "نوع فروشگاه با موفقیت حذف شد" });
  } catch (err) {
    res.status(500).json({
      message: "خطا در حذف نوع فروشگاه",
      error: err.message,
    });
  }
};

// مدیریت دسته‌بندی‌ها
exports.createCategory = async (req, res) => {
  try {
    const { name, shopType, image, isActive = true } = req.body;

    // بررسی وجود نوع فروشگاه
    const shopTypeExists = await ShopType.findById(shopType);
    if (!shopTypeExists) {
      return res.status(400).json({ message: "نوع فروشگاه یافت نشد" });
    }

    const category = new Category({
      name,
      shopType,
      image: normalizeImagePath(image),
      isActive,
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ایجاد دسته‌بندی",
      error: err.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shopType, image, isActive } = req.body;

    // بررسی وجود نوع فروشگاه
    if (shopType) {
      const shopTypeExists = await ShopType.findById(shopType);
      if (!shopTypeExists) {
        return res.status(400).json({ message: "نوع فروشگاه یافت نشد" });
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, shopType, image: normalizeImagePath(image), isActive },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "دسته‌بندی یافت نشد" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ویرایش دسته‌بندی",
      error: err.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // بررسی وجود زیردسته‌بندی‌های وابسته
    const subcategories = await Subcategory.find({ category: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        message:
          "امکان حذف وجود ندارد. ابتدا زیردسته‌بندی‌های وابسته را حذف کنید",
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "دسته‌بندی یافت نشد" });
    }

    res.json({ message: "دسته‌بندی با موفقیت حذف شد" });
  } catch (err) {
    res.status(500).json({
      message: "خطا در حذف دسته‌بندی",
      error: err.message,
    });
  }
};

// مدیریت زیردسته‌بندی‌ها
exports.createSubcategory = async (req, res) => {
  try {
    const { name, category, isActive = true } = req.body;

    // بررسی وجود دسته‌بندی
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "دسته‌بندی یافت نشد" });
    }

    const subcategory = new Subcategory({
      name,
      category,
      isActive,
    });

    await subcategory.save();
    res.status(201).json(subcategory);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ایجاد زیردسته‌بندی",
      error: err.message,
    });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, isActive } = req.body;

    // بررسی وجود دسته‌بندی
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "دسته‌بندی یافت نشد" });
      }
    }

    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      { name, category, isActive },
      { new: true }
    );

    if (!subcategory) {
      return res.status(404).json({ message: "زیردسته‌بندی یافت نشد" });
    }

    res.json(subcategory);
  } catch (err) {
    res.status(500).json({
      message: "خطا در ویرایش زیردسته‌بندی",
      error: err.message,
    });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    // بررسی وجود محصولات وابسته
    const products = await Product.find({ subcategory: id });
    if (products.length > 0) {
      return res.status(400).json({
        message: "امکان حذف وجود ندارد. ابتدا محصولات وابسته را حذف کنید",
      });
    }

    const subcategory = await Subcategory.findByIdAndDelete(id);

    if (!subcategory) {
      return res.status(404).json({ message: "زیردسته‌بندی یافت نشد" });
    }

    res.json({ message: "زیردسته‌بندی با موفقیت حذف شد" });
  } catch (err) {
    res.status(500).json({
      message: "خطا در حذف زیردسته‌بندی",
      error: err.message,
    });
  }
};
