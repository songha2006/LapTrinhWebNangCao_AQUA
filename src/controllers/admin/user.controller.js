const { Op } = require('sequelize');
const { User, Order } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.q}%` } },
        { email: { [Op.like]: `%${req.query.q}%` } },
      ];
    }
    const users = await User.findAll({ where, include: [Order], order: [['id', 'ASC']] });
    res.render('admin/users', { title: 'Quản lý người dùng', layout: 'layouts/admin', users });
  } catch (e) { next(e); }
};

exports.toggleLock = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role === 'admin') {
      req.session.flash = { type: 'error', message: 'Không thể khóa tài khoản này' };
      return res.redirect('/admin/users');
    }
    await user.update({ is_locked: !user.is_locked });
    req.session.flash = { type: 'success', message: `Đã ${user.is_locked ? 'khóa' : 'mở khóa'} tài khoản ${user.email}` };
    res.redirect('/admin/users');
  } catch (e) { next(e); }
};
