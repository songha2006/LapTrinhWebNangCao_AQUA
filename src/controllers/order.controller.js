const { validationResult } = require('express-validator');
const { sequelize, Order, OrderItem, ProductVariant, Product, Coupon, User } = require('../models');
const vnpay = require('../config/vnpay');
const { loadCartItems } = require('./cart.controller');

// Kiểm tra mã giảm giá, trả về { coupon, discount } hoặc { error }
async function checkCoupon(code, subtotal) {
  if (!code) return { coupon: null, discount: 0 };
  const coupon = await Coupon.findOne({ where: { code: code.toUpperCase().trim() } });
  if (!coupon) return { error: 'Mã giảm giá không tồn tại' };
  if (coupon.quantity <= 0) return { error: 'Mã giảm giá đã hết lượt sử dụng' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { error: 'Mã giảm giá đã hết hạn' };
  if (subtotal < coupon.min_order) {
    return { error: `Đơn tối thiểu ${(coupon.min_order).toLocaleString('vi-VN')}₫ mới dùng được mã này` };
  }
  const discount = coupon.type === 'percent'
    ? Math.floor((subtotal * coupon.value) / 100)
    : Math.min(coupon.value, subtotal);
  return { coupon, discount };
}

exports.showCheckout = async (req, res, next) => {
  try {
    const items = await loadCartItems(req.session.cart || []);
    if (!items.length) {
      req.session.flash = { type: 'error', message: 'Giỏ hàng đang trống' };
      return res.redirect('/cart');
    }
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const { coupon, discount, error } = await checkCoupon(req.session.couponCode, subtotal);
    if (error) delete req.session.couponCode;
    const user = await User.findByPk(req.session.user.id);
    res.render('pages/checkout', {
      title: 'Thanh toán', items, subtotal,
      coupon: coupon || null, discount: discount || 0,
      total: subtotal - (discount || 0),
      user, errors: [], old: {},
    });
  } catch (e) { next(e); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const items = await loadCartItems(req.session.cart || []);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const { error } = await checkCoupon(req.body.code, subtotal);
    if (error) {
      delete req.session.couponCode;
      req.session.flash = { type: 'error', message: error };
    } else {
      req.session.couponCode = req.body.code.toUpperCase().trim();
      req.session.flash = { type: 'success', message: 'Áp dụng mã giảm giá thành công' };
    }
    res.redirect('/checkout');
  } catch (e) { next(e); }
};

exports.removeCoupon = (req, res) => {
  delete req.session.couponCode;
  res.redirect('/checkout');
};

exports.placeOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const items = await loadCartItems(req.session.cart || []);
    if (!items.length) {
      await t.rollback();
      return res.redirect('/cart');
    }
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback();
      const { coupon, discount } = await checkCoupon(req.session.couponCode, subtotal);
      const user = await User.findByPk(req.session.user.id);
      return res.status(422).render('pages/checkout', {
        title: 'Thanh toán', items, subtotal,
        coupon: coupon || null, discount: discount || 0, total: subtotal - (discount || 0),
        user, errors: errors.array(), old: req.body,
      });
    }

    // Kiểm tra tồn kho lần cuối
    for (const item of items) {
      const fresh = await ProductVariant.findByPk(item.variant.id, { transaction: t, lock: t.LOCK ? t.LOCK.UPDATE : undefined });
      if (fresh.stock < item.qty) {
        await t.rollback();
        req.session.flash = { type: 'error', message: `"${item.variant.Product.name}" (${item.variant.color}) chỉ còn ${fresh.stock} sản phẩm` };
        return res.redirect('/cart');
      }
    }

    const { coupon, discount, error } = await checkCoupon(req.session.couponCode, subtotal);
    if (error) {
      await t.rollback();
      delete req.session.couponCode;
      req.session.flash = { type: 'error', message: error };
      return res.redirect('/checkout');
    }

    const order = await Order.create({
      user_id: req.session.user.id,
      coupon_id: coupon ? coupon.id : null,
      subtotal, discount: discount || 0, total: subtotal - (discount || 0),
      payment_method: req.body.payment_method === 'vnpay' ? 'vnpay' : 'cod',
      receiver_name: req.body.receiver_name.trim(),
      address: req.body.address.trim(),
      phone: req.body.phone.trim(),
      note: req.body.note || null,
    }, { transaction: t });

    for (const item of items) {
      await OrderItem.create({
        order_id: order.id, variant_id: item.variant.id,
        quantity: item.qty, price: item.variant.price,
      }, { transaction: t });
      await ProductVariant.decrement('stock', { by: item.qty, where: { id: item.variant.id }, transaction: t });
    }
    if (coupon) await Coupon.decrement('quantity', { by: 1, where: { id: coupon.id }, transaction: t });

    await t.commit();
    req.session.cart = [];
    delete req.session.couponCode;

    if (order.payment_method === 'vnpay') {
      if (vnpay.isConfigured()) {
        const url = vnpay.buildPaymentUrl({
          orderId: order.id, amount: order.total,
          ipAddr: req.ip, orderInfo: `Thanh toan don hang #${order.id}`,
        });
        return res.redirect(url);
      }
      // Chưa có tài khoản sandbox → trang giả lập cổng thanh toán
      return res.redirect(`/payment/vnpay-demo/${order.id}`);
    }
    req.session.flash = { type: 'success', message: `Đặt hàng thành công! Mã đơn #${order.id}` };
    res.redirect(`/orders/${order.id}`);
  } catch (e) {
    await t.rollback();
    next(e);
  }
};

// ===== VNPay =====
exports.vnpayReturn = async (req, res, next) => {
  try {
    const valid = vnpay.verifyReturn(req.query);
    const orderId = parseInt(req.query.vnp_TxnRef);
    const order = await Order.findOne({ where: { id: orderId, user_id: req.session.user ? req.session.user.id : 0 } });
    if (!order) return res.redirect('/orders');
    if (valid && req.query.vnp_ResponseCode === '00') {
      await order.update({ payment_status: 'paid' });
      req.session.flash = { type: 'success', message: `Thanh toán VNPay thành công cho đơn #${order.id}` };
    } else {
      req.session.flash = { type: 'error', message: 'Thanh toán VNPay thất bại hoặc bị hủy' };
    }
    res.redirect(`/orders/${order.id}`);
  } catch (e) { next(e); }
};

// Trang giả lập cổng VNPay khi chưa cấu hình sandbox
exports.vnpayDemo = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.session.user.id } });
    if (!order) return res.redirect('/orders');
    res.render('pages/vnpay-demo', { title: 'Cổng thanh toán VNPay (giả lập)', order });
  } catch (e) { next(e); }
};

exports.vnpayDemoConfirm = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.session.user.id } });
    if (!order) return res.redirect('/orders');
    if (req.body.result === 'success') {
      await order.update({ payment_status: 'paid' });
      req.session.flash = { type: 'success', message: `Thanh toán VNPay (giả lập) thành công cho đơn #${order.id}` };
    } else {
      req.session.flash = { type: 'error', message: 'Bạn đã hủy thanh toán. Đơn hàng vẫn được giữ, có thể thanh toán khi nhận hàng.' };
    }
    res.redirect(`/orders/${order.id}`);
  } catch (e) { next(e); }
};

// ===== Lịch sử đơn hàng =====
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.session.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']],
    });
    res.render('pages/orders', { title: 'Đơn hàng của tôi', orders });
  } catch (e) { next(e); }
};

exports.orderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.session.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: ProductVariant, as: 'variant', include: [Product] }] },
        Coupon,
      ],
    });
    if (!order) return res.status(404).render('pages/404', { title: 'Không tìm thấy' });
    res.render('pages/order-detail', { title: `Đơn hàng #${order.id}`, order });
  } catch (e) { next(e); }
};

exports.cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.session.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    });
    if (!order || !['pending', 'confirmed'].includes(order.status)) {
      await t.rollback();
      req.session.flash = { type: 'error', message: 'Đơn hàng này không thể hủy' };
      return res.redirect('/orders');
    }
    await order.update({ status: 'cancelled' }, { transaction: t });
    // Hoàn kho
    for (const item of order.items) {
      await ProductVariant.increment('stock', { by: item.quantity, where: { id: item.variant_id }, transaction: t });
    }
    await t.commit();
    req.session.flash = { type: 'success', message: `Đã hủy đơn #${order.id}` };
    res.redirect('/orders');
  } catch (e) {
    await t.rollback();
    next(e);
  }
};
