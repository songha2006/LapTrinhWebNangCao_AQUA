const { Review, User, Product } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      include: [User, Product],
      order: [['created_at', 'DESC']],
    });
    res.render('admin/reviews', { title: 'Quản lý đánh giá', layout: 'layouts/admin', reviews });
  } catch (e) { next(e); }
};

exports.toggleHidden = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (review) {
      await review.update({ is_hidden: !review.is_hidden });
      req.session.flash = { type: 'success', message: `Đã ${review.is_hidden ? 'ẩn' : 'hiện'} đánh giá` };
    }
    res.redirect('/admin/reviews');
  } catch (e) { next(e); }
};
