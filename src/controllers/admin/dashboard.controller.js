const { Op } = require('sequelize');
const { Order, OrderItem, Product, ProductVariant, User } = require('../../models');

// Gom nhóm doanh thu bằng JS để chạy được trên cả SQLite lẫn MySQL
exports.index = async (req, res, next) => {
  try {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start14Days = new Date(startToday.getTime() - 13 * 864e5);

    // Doanh thu tính trên đơn không bị hủy
    const revenueOrders = await Order.findAll({
      where: { status: { [Op.ne]: 'cancelled' }, created_at: { [Op.gte]: start6Months } },
      attributes: ['id', 'total', 'created_at', 'status'],
    });

    const sum = (arr) => arr.reduce((s, o) => s + o.total, 0);
    const revenueToday = sum(revenueOrders.filter((o) => new Date(o.created_at) >= startToday));
    const revenueMonth = sum(revenueOrders.filter((o) => new Date(o.created_at) >= startMonth));

    // Biểu đồ 14 ngày
    const dayLabels = [];
    const dayData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(startToday.getTime() - i * 864e5);
      const next = new Date(d.getTime() + 864e5);
      dayLabels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      dayData.push(sum(revenueOrders.filter((o) => new Date(o.created_at) >= d && new Date(o.created_at) < next)));
    }

    // Biểu đồ 6 tháng
    const monthLabels = [];
    const monthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      monthLabels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
      monthData.push(sum(revenueOrders.filter((o) => new Date(o.created_at) >= d && new Date(o.created_at) < next)));
    }

    const [pendingCount, productCount, userCount, recentOrders] = await Promise.all([
      Order.count({ where: { status: 'pending' } }),
      Product.count(),
      User.count({ where: { role: 'user' } }),
      Order.findAll({ include: [User], order: [['created_at', 'DESC']], limit: 8 }),
    ]);

    // Top sản phẩm bán chạy: gom theo product từ order_items của đơn không hủy
    const items = await OrderItem.findAll({
      include: [
        { model: Order, where: { status: { [Op.ne]: 'cancelled' } }, attributes: [] },
        { model: ProductVariant, as: 'variant', include: [Product] },
      ],
    });
    const salesByProduct = {};
    for (const item of items) {
      if (!item.variant || !item.variant.Product) continue;
      const p = item.variant.Product;
      if (!salesByProduct[p.id]) salesByProduct[p.id] = { product: p, sold: 0, revenue: 0 };
      salesByProduct[p.id].sold += item.quantity;
      salesByProduct[p.id].revenue += item.quantity * item.price;
    }
    const topProducts = Object.values(salesByProduct).sort((a, b) => b.sold - a.sold).slice(0, 5);

    res.render('admin/dashboard', {
      title: 'Tổng quan', layout: 'layouts/admin',
      revenueToday, revenueMonth, pendingCount, productCount, userCount,
      dayLabels, dayData, monthLabels, monthData,
      recentOrders, topProducts,
    });
  } catch (e) { next(e); }
};
