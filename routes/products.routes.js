const express = require("express");
const router = express.Router();
const {
  getProducts,
  createProduct,
  getProductHierarchy,
  // توابع جدید:
  createShopType,
  updateShopType,
  deleteShopType,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getCategories,
  getSubcategories,
} = require("../controllers/product.controller");

// محصولات
router.get("/", getProducts);
router.get("/hierarchy", getProductHierarchy);
router.post("/", createProduct);

// مدیریت ShopType
router.post("/shoptypes", createShopType);
router.put("/shoptypes/:id", updateShopType);
router.delete("/shoptypes/:id", deleteShopType);

// مدیریت Category
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// مدیریت Subcategory
router.get("/subcategories", getSubcategories);
router.post("/subcategories", createSubcategory);
router.put("/subcategories/:id", updateSubcategory);
router.delete("/subcategories/:id", deleteSubcategory);

module.exports = router;
