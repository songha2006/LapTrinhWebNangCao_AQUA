const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const home = require('../controllers/home.controller');
const product = require('../controllers/product.controller');
const auth = require('../controllers/auth.controller');
const cart = require('../controllers/cart.controller');
const order = require('../controllers/order.controller');
const review = require('../controllers/review.controller');
const { requireLogin } = require('../middlewares/auth');

// ===== Trang chính =====
router.get('/', home.index);
router.get('/products', product.list);
router.get('/products/:slug', product.detail);

// ===== Auth =====
const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Họ tên phải từ 2 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('password_confirm').custom((v, { req }) => v === req.body.password).withMessage('Xác nhận mật khẩu không khớp'),
];
router.get('/register', auth.showRegister);
router.post('/register', registerRules, auth.register);
router.get('/login', auth.showLogin);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/forgot-password', auth.showForgot);
router.post('/forgot-password', auth.forgot);
router.get('/reset-password/:token', auth.showReset);
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('password_confirm').custom((v, { req }) => v === req.body.password).withMessage('Xác nhận mật khẩu không khớp'),
], auth.reset);

// ===== Giỏ hàng =====
router.get('/cart', cart.view);
router.post('/cart/add', cart.add);
router.post('/cart/update', cart.update);
router.post('/cart/remove/:variantId', cart.remove);

// ===== Đặt hàng =====
const checkoutRules = [
  body('receiver_name').trim().isLength({ min: 2 }).withMessage('Vui lòng nhập tên người nhận'),
  body('phone').trim().matches(/^0\d{9,10}$/).withMessage('Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số)'),
  body('address').trim().isLength({ min: 10 }).withMessage('Địa chỉ phải từ 10 ký tự'),
];
router.get('/checkout', requireLogin, order.showCheckout);
router.post('/checkout/coupon', requireLogin, order.applyCoupon);
router.post('/checkout/coupon/remove', requireLogin, order.removeCoupon);
router.post('/checkout', requireLogin, checkoutRules, order.placeOrder);

// ===== Thanh toán VNPay =====
router.get('/payment/vnpay-return', requireLogin, order.vnpayReturn);
router.get('/payment/vnpay-demo/:id', requireLogin, order.vnpayDemo);
router.post('/payment/vnpay-demo/:id', requireLogin, order.vnpayDemoConfirm);

// ===== Đơn hàng của tôi =====
router.get('/orders', requireLogin, order.myOrders);
router.get('/orders/:id', requireLogin, order.orderDetail);
router.post('/orders/:id/cancel', requireLogin, order.cancelOrder);

// ===== Đánh giá =====
router.post('/products/:productId/reviews', requireLogin, review.create);

module.exports = router;
