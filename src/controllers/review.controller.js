const { Review, Product, Order, OrderItem, ProductVariant } = require('../models');

exports.create = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.redirect('/products');
    const back = `/products/${product.slug}#reviews`;

    // Phải mua hàng (đơn hoàn thành) mới được đánh giá
    const bought = await OrderItem.findOne({
      include: [
        { model: Order, where: { user_id: req.session.user.id, status: 'completed' } },
        { model: ProductVariant, as: 'variant', where: { product_id: product.id } },
      ],
    });
    if (!bought) {
      req.session.flash = { type: 'error', message: 'Bạn cần mua và nhận hàng thành công trước khi đánh giá' };
      return res.redirect(back);
    }
    const existing = await Review.findOne({ where: { user_id: req.session.user.id, product_id: product.id } });
    if (existing) {
      req.session.flash = { type: 'error', message: 'Bạn đã đánh giá sản phẩm này rồi' };
      return res.redirect(back);
    }
    const rating = Math.min(5, Math.max(1, parseInt(req.body.rating) || 5));
    await Review.create({
      user_id: req.session.user.id,
      product_id: product.id,
      rating,
      comment: (req.body.comment || '').trim().slice(0, 2000),
    });
    req.session.flash = { type: 'success', message: 'Cảm ơn bạn đã đánh giá!' };
    res.redirect(back);
  } catch (e) { next(e); }
};
