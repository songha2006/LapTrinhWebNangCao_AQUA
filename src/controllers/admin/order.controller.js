const { sequelize, Order, OrderItem, ProductVariant, Product, User, Coupon } = require('../../models');

const PER_PAGE = 12;
// Trạng thái được phép chuyển tiếp
const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed'],
  completed: [],
  cancelled: [],
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const { rows, count } = await Order.findAndCountAll({
      where, include: [User],
      order: [['created_at', 'DESC']],
      limit: PER_PAGE, offset: (page - 1) * PER_PAGE,
    });
    res.render('admin/orders/index', {
      title: 'Quản lý đơn hàng', layout: 'layouts/admin',
      orders: rows, page, totalPages: Math.ceil(count / PER_PAGE),
      statusFilter: req.query.status || '',
    });
  } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        User, Coupon,
        { model: OrderItem, as: 'items', include: [{ model: ProductVariant, as: 'variant', include: [Product] }] },
      ],
    });
    if (!order) return res.redirect('/admin/orders');
    res.render('admin/orders/detail', {
      title: `Đơn hàng #${order.id}`, layout: 'layouts/admin',
      order, nextStatuses: NEXT_STATUS[order.status] || [],
    });
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }], transaction: t,
    });
    const newStatus = req.body.status;
    if (!order || !(NEXT_STATUS[order.status] || []).includes(newStatus)) {
      await t.rollback();
      req.session.flash = { type: 'error', message: 'Chuyển trạng thái không hợp lệ' };
      return res.redirect(`/admin/orders/${req.params.id}`);
    }
    const patch = { status: newStatus };
    // Hoàn thành đơn COD = đã thu tiền
    if (newStatus === 'completed' && order.payment_method === 'cod') patch.payment_status = 'paid';
    await order.update(patch, { transaction: t });
    // Admin hủy đơn → hoàn kho
    if (newStatus === 'cancelled') {
      for (const item of order.items) {
        await ProductVariant.increment('stock', { by: item.quantity, where: { id: item.variant_id }, transaction: t });
      }
    }
    await t.commit();
    req.session.flash = { type: 'success', message: `Đơn #${order.id} → ${newStatus}` };
    res.redirect(`/admin/orders/${order.id}`);
  } catch (e) {
    await t.rollback();
    next(e);
  }
};
