const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const dashboard = require('../controllers/admin/dashboard.controller');
const product = require('../controllers/admin/product.controller');
const catalog = require('../controllers/admin/catalog.controller');
const coupon = require('../controllers/admin/coupon.controller');
const order = require('../controllers/admin/order.controller');
const user = require('../controllers/admin/user.controller');
const review = require('../controllers/admin/review.controller');
const banner = require('../controllers/admin/banner.controller');

router.use(requireAdmin);

// Dashboard
router.get('/', dashboard.index);

// Sản phẩm
router.get('/products', product.list);
router.get('/products/create', product.showCreate);
router.post('/products', upload.any(), product.create);
router.get('/products/:id/edit', product.showEdit);
router.post('/products/:id', upload.any(), product.update);
router.post('/products/:id/delete', product.destroy);
router.post('/products/:id/images/:imageId/delete', product.deleteImage);

// Danh mục & thương hiệu
router.get('/categories', catalog.categories);
router.post('/categories', catalog.createCategory);
router.post('/categories/:id', catalog.updateCategory);
router.post('/categories/:id/delete', catalog.deleteCategory);
router.get('/brands', catalog.brands);
router.post('/brands', catalog.createBrand);
router.post('/brands/:id', catalog.updateBrand);
router.post('/brands/:id/delete', catalog.deleteBrand);

// Mã giảm giá
router.get('/coupons', coupon.list);
router.post('/coupons', coupon.create);
router.post('/coupons/:id', coupon.update);
router.post('/coupons/:id/delete', coupon.destroy);

// Đơn hàng
router.get('/orders', order.list);
router.get('/orders/:id', order.detail);
router.post('/orders/:id/status', order.updateStatus);

// Người dùng
router.get('/users', user.list);
router.post('/users/:id/toggle-lock', user.toggleLock);

// Đánh giá
router.get('/reviews', review.list);
router.post('/reviews/:id/toggle-hidden', review.toggleHidden);

// Giao diện trang chủ (banner)
router.get('/banner', banner.show);
router.post('/banner', upload.single('image'), banner.upload);
router.post('/banner/position', banner.savePosition);
router.post('/banner/reset', banner.reset);

module.exports = router;
