const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ShopType = require('../models/ShopType');

// دریافت تمام محصولات
exports.getProducts = async (req, res) => {
  try {
    const { shopType, category, subcategory, store } = req.query;
    
    const filter = {};
    if (shopType) filter.shopType = shopType;
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (store) filter.store = store;

    const products = await Product.find(filter)
      .populate('shopType', 'name')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('store', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در دریافت محصولات',
      error: err.message 
    });
  }
};

// ایجاد محصول جدید
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      stock, 
      images, 
      shopType, 
      category, 
      subcategory, 
      store 
    } = req.body;

    // اعتبارسنجی وجود shopType، category و subcategory
    const [shopTypeExists, categoryExists, subcategoryExists] = await Promise.all([
      ShopType.findById(shopType),
      Category.findById(category),
      Subcategory.findById(subcategory)
    ]);

    if (!shopTypeExists) {
      return res.status(400).json({ message: 'نوع فروشگاه یافت نشد' });
    }
    if (!categoryExists) {
      return res.status(400).json({ message: 'دسته‌بندی یافت نشد' });
    }
    if (!subcategoryExists) {
      return res.status(400).json({ message: 'زیردسته‌بندی یافت نشد' });
    }

    // اعتبارسنجی ارتباط بین موجودیت‌ها
    if (categoryExists.shopType.toString() !== shopType) {
      return res.status(400).json({ message: 'دسته‌بندی متعلق به این نوع فروشگاه نیست' });
    }

    if (subcategoryExists.category.toString() !== category) {
      return res.status(400).json({ message: 'زیردسته‌بندی متعلق به این دسته‌بندی نیست' });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      images,
      shopType,
      category,
      subcategory,
      store
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ایجاد محصول',
      error: err.message 
    });
  }
};

// دریافت سلسله مراتب محصولات
exports.getProductHierarchy = async (req, res) => {
  try {
    const shopTypes = await ShopType.find({ isActive: true });
    const hierarchy = await Promise.all(
      shopTypes.map(async shopType => {
        const categories = await Category.find({ 
          shopType: shopType._id, 
          isActive: true 
        });
        
        const categoriesWithSubs = await Promise.all(
          categories.map(async category => {
            const subcategories = await Subcategory.find({
              category: category._id,
              isActive: true
            });
            return {
              ...category.toObject(),
              subcategories
            };
          })
        );
        
        return {
          ...shopType.toObject(),
          categories: categoriesWithSubs
        };
      })
    );

    res.json(hierarchy);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در دریافت سلسله مراتب محصولات',
      error: err.message 
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
      message: 'خطا در دریافت دسته‌بندی‌ها',
      error: err.message 
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
      message: 'خطا در دریافت زیردسته‌بندی‌ها',
      error: err.message 
    });
  }
};

// مدیریت نوع فروشگاه‌ها
exports.createShopType = async (req, res) => {
  try {
    const { name, isActive = true } = req.body;
    const shopType = new ShopType({ name, isActive });
    await shopType.save();
    res.status(201).json(shopType);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ایجاد نوع فروشگاه',
      error: err.message 
    });
  }
};

exports.updateShopType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    
    const shopType = await ShopType.findByIdAndUpdate(
      id,
      { name, isActive },
      { new: true }
    );
    
    if (!shopType) {
      return res.status(404).json({ message: 'نوع فروشگاه یافت نشد' });
    }
    
    res.json(shopType);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ویرایش نوع فروشگاه',
      error: err.message 
    });
  }
};

exports.deleteShopType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // بررسی وجود دسته‌بندی‌های وابسته
    const categories = await Category.find({ shopType: id });
    if (categories.length > 0) {
      return res.status(400).json({ 
        message: 'امکان حذف وجود ندارد. ابتدا دسته‌بندی‌های وابسته را حذف کنید' 
      });
    }
    
    const shopType = await ShopType.findByIdAndDelete(id);
    
    if (!shopType) {
      return res.status(404).json({ message: 'نوع فروشگاه یافت نشد' });
    }
    
    res.json({ message: 'نوع فروشگاه با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در حذف نوع فروشگاه',
      error: err.message 
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
      return res.status(400).json({ message: 'نوع فروشگاه یافت نشد' });
    }
    
    const category = new Category({ 
      name, 
      shopType, 
      image, 
      isActive 
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ایجاد دسته‌بندی',
      error: err.message 
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
        return res.status(400).json({ message: 'نوع فروشگاه یافت نشد' });
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      { name, shopType, image, isActive },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'دسته‌بندی یافت نشد' });
    }
    
    res.json(category);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ویرایش دسته‌بندی',
      error: err.message 
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
        message: 'امکان حذف وجود ندارد. ابتدا زیردسته‌بندی‌های وابسته را حذف کنید' 
      });
    }
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({ message: 'دسته‌بندی یافت نشد' });
    }
    
    res.json({ message: 'دسته‌بندی با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در حذف دسته‌بندی',
      error: err.message 
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
      return res.status(400).json({ message: 'دسته‌بندی یافت نشد' });
    }
    
    const subcategory = new Subcategory({ 
      name, 
      category, 
      isActive 
    });
    
    await subcategory.save();
    res.status(201).json(subcategory);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ایجاد زیردسته‌بندی',
      error: err.message 
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
        return res.status(400).json({ message: 'دسته‌بندی یافت نشد' });
      }
    }
    
    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      { name, category, isActive },
      { new: true }
    );
    
    if (!subcategory) {
      return res.status(404).json({ message: 'زیردسته‌بندی یافت نشد' });
    }
    
    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در ویرایش زیردسته‌بندی',
      error: err.message 
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
        message: 'امکان حذف وجود ندارد. ابتدا محصولات وابسته را حذف کنید' 
      });
    }
    
    const subcategory = await Subcategory.findByIdAndDelete(id);
    
    if (!subcategory) {
      return res.status(404).json({ message: 'زیردسته‌بندی یافت نشد' });
    }
    
    res.json({ message: 'زیردسته‌بندی با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ 
      message: 'خطا در حذف زیردسته‌بندی',
      error: err.message 
    });
  }
};