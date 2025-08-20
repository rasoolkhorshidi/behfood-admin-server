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
  getShopType
} = require("../controllers/product.controller");
const verifyAccessToken = require("../middleware/auth");

// محصولات
router.get("/", getProducts);
router.get("/hierarchy", getProductHierarchy);
router.post("/", verifyAccessToken, createProduct);

// مدیریت ShopType

router.get("/shoptypes", getShopType);
router.post("/shoptypes", verifyAccessToken, createShopType);
router.put("/shoptypes/:id", verifyAccessToken, updateShopType);
router.delete("/shoptypes/:id", verifyAccessToken, deleteShopType);

// مدیریت Category
router.get("/categories", getCategories);
router.post("/categories", verifyAccessToken, createCategory);
router.put("/categories/:id", verifyAccessToken, updateCategory);
router.delete("/categories/:id", verifyAccessToken, deleteCategory);

// مدیریت Subcategory
router.get("/subcategories", getSubcategories);
router.post("/subcategories", verifyAccessToken, createSubcategory);
router.put("/subcategories/:id", verifyAccessToken, updateSubcategory);
router.delete("/subcategories/:id", verifyAccessToken, deleteSubcategory);

module.exports = router;
