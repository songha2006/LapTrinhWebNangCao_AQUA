const { Category } = require('../models');

// Biến dùng chung cho mọi view: user, flash, giỏ hàng, danh mục, format tiền
module.exports = async function locals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;

  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((s, i) => s + i.qty, 0);

  res.locals.vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + '₫';
  res.locals.query = req.query;

  try {
    res.locals.navCategories = await Category.findAll({ order: [['id', 'ASC']] });
  } catch {
    res.locals.navCategories = [];
  }
  next();
};
