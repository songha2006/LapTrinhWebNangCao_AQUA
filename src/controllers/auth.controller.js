const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../models');

function sessionUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

exports.showRegister = (req, res) => res.render('pages/register', { title: 'Đăng ký', errors: [], old: {} });

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('pages/register', { title: 'Đăng ký', errors: errors.array(), old: req.body });
    }
    const exists = await User.findOne({ where: { email: req.body.email } });
    if (exists) {
      return res.status(422).render('pages/register', {
        title: 'Đăng ký', errors: [{ msg: 'Email đã được sử dụng' }], old: req.body,
      });
    }
    const user = await User.create({
      name: req.body.name.trim(),
      email: req.body.email.toLowerCase().trim(),
      password_hash: await bcrypt.hash(req.body.password, 10),
      phone: req.body.phone || null,
    });
    req.session.user = sessionUser(user);
    req.session.flash = { type: 'success', message: `Chào mừng ${user.name}, đăng ký thành công!` };
    res.redirect('/');
  } catch (e) { next(e); }
};

exports.showLogin = (req, res) => res.render('pages/login', { title: 'Đăng nhập', errors: [], old: {} });

exports.login = async (req, res, next) => {
  try {
    const fail = () => res.status(422).render('pages/login', {
      title: 'Đăng nhập', errors: [{ msg: 'Email hoặc mật khẩu không đúng' }], old: req.body,
    });
    const user = await User.findOne({ where: { email: (req.body.email || '').toLowerCase().trim() } });
    if (!user) return fail();
    if (!(await bcrypt.compare(req.body.password || '', user.password_hash))) return fail();
    if (user.is_locked) {
      return res.status(403).render('pages/login', {
        title: 'Đăng nhập', errors: [{ msg: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' }], old: req.body,
      });
    }
    req.session.user = sessionUser(user);
    req.session.flash = { type: 'success', message: `Xin chào ${user.name}!` };
    const to = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');
    delete req.session.returnTo;
    res.redirect(to);
  } catch (e) { next(e); }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

exports.showForgot = (req, res) => res.render('pages/forgot-password', { title: 'Quên mật khẩu', resetLink: null, errors: [] });

// Không có SMTP nên hiển thị trực tiếp link đặt lại (chế độ demo đồ án)
exports.forgot = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: (req.body.email || '').toLowerCase().trim() } });
    if (!user) {
      return res.status(422).render('pages/forgot-password', {
        title: 'Quên mật khẩu', resetLink: null, errors: [{ msg: 'Không tìm thấy tài khoản với email này' }],
      });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await user.update({ reset_token: token, reset_token_expires: new Date(Date.now() + 3600e3) });
    const resetLink = `/reset-password/${token}`;
    res.render('pages/forgot-password', { title: 'Quên mật khẩu', resetLink, errors: [] });
  } catch (e) { next(e); }
};

exports.showReset = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { reset_token: req.params.token, reset_token_expires: { [Op.gt]: new Date() } },
    });
    if (!user) {
      req.session.flash = { type: 'error', message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' };
      return res.redirect('/forgot-password');
    }
    res.render('pages/reset-password', { title: 'Đặt lại mật khẩu', token: req.params.token, errors: [] });
  } catch (e) { next(e); }
};

exports.reset = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { reset_token: req.params.token, reset_token_expires: { [Op.gt]: new Date() } },
    });
    if (!user) {
      req.session.flash = { type: 'error', message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' };
      return res.redirect('/forgot-password');
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render('pages/reset-password', { title: 'Đặt lại mật khẩu', token: req.params.token, errors: errors.array() });
    }
    await user.update({
      password_hash: await bcrypt.hash(req.body.password, 10),
      reset_token: null, reset_token_expires: null,
    });
    req.session.flash = { type: 'success', message: 'Đổi mật khẩu thành công, hãy đăng nhập lại' };
    res.redirect('/login');
  } catch (e) { next(e); }
};
