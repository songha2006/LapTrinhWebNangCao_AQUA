const { Coupon } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const coupons = await Coupon.findAll({ order: [['id', 'DESC']] });
    res.render('admin/coupons', { title: 'Mã giảm giá', layout: 'layouts/admin', coupons });
  } catch (e) { next(e); }
};

function parseBody(body) {
  return {
    code: (body.code || '').toUpperCase().trim(),
    type: body.type === 'fixed' ? 'fixed' : 'percent',
    value: parseInt(body.value) || 0,
    min_order: parseInt(body.min_order) || 0,
    quantity: parseInt(body.quantity) || 0,
    expires_at: body.expires_at ? new Date(body.expires_at) : null,
  };
}

exports.create = async (req, res) => {
  try {
    const data = parseBody(req.body);
    if (!data.code || data.value <= 0) throw new Error('invalid');
    if (data.type === 'percent' && data.value > 100) data.value = 100;
    await Coupon.create(data);
    req.session.flash = { type: 'success', message: `Đã tạo mã ${data.code}` };
  } catch {
    req.session.flash = { type: 'error', message: 'Không tạo được mã (trùng mã hoặc dữ liệu không hợp lệ)' };
  }
  res.redirect('/admin/coupons');
};

exports.update = async (req, res) => {
  try {
    const data = parseBody(req.body);
    if (data.type === 'percent' && data.value > 100) data.value = 100;
    await Coupon.update(data, { where: { id: req.params.id } });
    req.session.flash = { type: 'success', message: 'Đã cập nhật mã giảm giá' };
  } catch {
    req.session.flash = { type: 'error', message: 'Không cập nhật được (trùng mã?)' };
  }
  res.redirect('/admin/coupons');
};

exports.destroy = async (req, res) => {
  try {
    await Coupon.destroy({ where: { id: req.params.id } });
    req.session.flash = { type: 'success', message: 'Đã xóa mã giảm giá' };
  } catch {
    req.session.flash = { type: 'error', message: 'Không thể xóa: mã đã được dùng trong đơn hàng' };
  }
  res.redirect('/admin/coupons');
};
