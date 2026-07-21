const { ProductVariant, Product } = require('../models');

// Giỏ hàng lưu trong session: [{ variantId, qty }]
function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

// Lấy chi tiết giỏ hàng từ DB (giá luôn lấy mới nhất)
async function loadCartItems(cart) {
  if (!cart.length) return [];
  const variants = await ProductVariant.findAll({
    where: { id: cart.map((i) => i.variantId) },
    include: [Product],
  });
  return cart
    .map((item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) return null;
      return { variant, qty: item.qty, lineTotal: variant.price * item.qty };
    })
    .filter(Boolean);
}

exports.loadCartItems = loadCartItems;

exports.view = async (req, res, next) => {
  try {
    const items = await loadCartItems(getCart(req));
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    res.render('pages/cart', { title: 'Giỏ hàng', items, subtotal });
  } catch (e) { next(e); }
};

exports.add = async (req, res, next) => {
  try {
    const variantId = parseInt(req.body.variant_id);
    const qty = Math.max(1, parseInt(req.body.qty) || 1);
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
      req.session.flash = { type: 'error', message: 'Sản phẩm không tồn tại' };
      return res.redirect('back');
    }
    const cart = getCart(req);
    const existing = cart.find((i) => i.variantId === variantId);
    const newQty = (existing ? existing.qty : 0) + qty;
    if (newQty > variant.stock) {
      req.session.flash = { type: 'error', message: `Chỉ còn ${variant.stock} sản phẩm trong kho` };
      return res.redirect(req.get('Referer') || '/products');
    }
    if (existing) existing.qty = newQty;
    else cart.push({ variantId, qty });
    req.session.flash = { type: 'success', message: 'Đã thêm vào giỏ hàng' };
    res.redirect(req.get('Referer') || '/cart');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const variantId = parseInt(req.body.variant_id);
    const qty = parseInt(req.body.qty);
    const cart = getCart(req);
    const item = cart.find((i) => i.variantId === variantId);
    if (item) {
      if (qty <= 0) {
        req.session.cart = cart.filter((i) => i.variantId !== variantId);
      } else {
        const variant = await ProductVariant.findByPk(variantId);
        item.qty = Math.min(qty, variant ? variant.stock : qty);
      }
    }
    res.redirect('/cart');
  } catch (e) { next(e); }
};

exports.remove = (req, res) => {
  const variantId = parseInt(req.params.variantId);
  req.session.cart = getCart(req).filter((i) => i.variantId !== variantId);
  req.session.flash = { type: 'success', message: 'Đã xóa sản phẩm khỏi giỏ' };
  res.redirect('/cart');
};
